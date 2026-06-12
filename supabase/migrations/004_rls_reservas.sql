-- T06: RLS da tabela reserva + trigger de conflito de horário
ALTER TABLE reserva ENABLE ROW LEVEL SECURITY;

CREATE POLICY reserva_morador_select ON reserva
  FOR SELECT USING (
    id_morador = (SELECT id_morador FROM morador WHERE id_usuario = auth.uid())
  );

CREATE POLICY reserva_morador_insert ON reserva
  FOR INSERT WITH CHECK (
    id_morador = (SELECT id_morador FROM morador WHERE id_usuario = auth.uid())
  );

CREATE POLICY reserva_morador_update ON reserva
  FOR UPDATE USING (
    id_morador = (SELECT id_morador FROM morador WHERE id_usuario = auth.uid())
  );

-- Trigger: impede sobreposição de horário no mesmo espaço
CREATE OR REPLACE FUNCTION check_conflito_reserva()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM reserva
     WHERE id_espaco = NEW.id_espaco
       AND data      = NEW.data
       AND status   != 'cancelada'
       AND (hora_inicio, hora_fim) OVERLAPS (NEW.hora_inicio, NEW.hora_fim)
  ) THEN
    RAISE EXCEPTION 'Conflito de horário: espaço já reservado neste período';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tg_conflito_reserva
  BEFORE INSERT ON reserva
  FOR EACH ROW EXECUTE FUNCTION check_conflito_reserva();
