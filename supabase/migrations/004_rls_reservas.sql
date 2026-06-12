-- T06: RLS da tabela reserva + espaco_comum
ALTER TABLE reserva      ENABLE ROW LEVEL SECURITY;
ALTER TABLE espaco_comum ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS reserva_select    ON reserva;
DROP POLICY IF EXISTS reserva_insert    ON reserva;
DROP POLICY IF EXISTS reserva_update    ON reserva;
DROP POLICY IF EXISTS reserva_no_delete ON reserva;
DROP POLICY IF EXISTS espaco_select     ON espaco_comum;
DROP POLICY IF EXISTS espaco_sindico    ON espaco_comum;

CREATE POLICY reserva_select ON reserva
  FOR SELECT USING (id_usuario = auth.uid());

CREATE POLICY reserva_insert ON reserva
  FOR INSERT WITH CHECK (id_usuario = auth.uid());

CREATE POLICY reserva_update ON reserva
  FOR UPDATE USING (id_usuario = auth.uid());

CREATE POLICY reserva_no_delete ON reserva FOR DELETE USING (false);

CREATE POLICY espaco_select ON espaco_comum
  FOR SELECT USING (auth.uid() IS NOT NULL AND ativo = TRUE);

CREATE POLICY espaco_sindico ON espaco_comum
  FOR ALL USING (
    EXISTS (SELECT 1 FROM usuario WHERE id_usuario = auth.uid() AND perfil = 'sindico')
  );

CREATE OR REPLACE FUNCTION check_conflito_reserva()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM reserva
     WHERE id_espaco   = NEW.id_espaco
       AND data        = NEW.data
       AND status      = 'ativa'
       AND (hora_inicio, hora_fim) OVERLAPS (NEW.hora_inicio, NEW.hora_fim)
  ) THEN
    RAISE EXCEPTION 'Conflito de horário: espaço já reservado neste período';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_conflito_reserva ON reserva;
CREATE TRIGGER tg_conflito_reserva
  BEFORE INSERT ON reserva
  FOR EACH ROW EXECUTE FUNCTION check_conflito_reserva();
