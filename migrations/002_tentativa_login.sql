-- T01: Tabela e trigger de rate-limit / bloqueio progressivo de brute-force
CREATE TABLE IF NOT EXISTS tentativa_login (
  id            BIGSERIAL PRIMARY KEY,
  id_usuario    UUID REFERENCES usuario(id_usuario),
  ip_origem     INET,
  data_hora     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status        TEXT NOT NULL CHECK (status IN ('sucesso', 'falha')),
  bloqueado_ate TIMESTAMPTZ
);

ALTER TABLE tentativa_login ENABLE ROW LEVEL SECURITY;

-- Nenhum usuário lê/altera logs de tentativa (apenas service_role)
CREATE POLICY tentativa_no_select ON tentativa_login FOR SELECT USING (false);
CREATE POLICY tentativa_no_update ON tentativa_login FOR UPDATE USING (false);
CREATE POLICY tentativa_no_delete ON tentativa_login FOR DELETE USING (false);

CREATE OR REPLACE FUNCTION verificar_bloqueio_login()
RETURNS TRIGGER AS $$
DECLARE
  v_tentativas   INT;
  v_bloqueio_ate TIMESTAMPTZ;
BEGIN
  SELECT COUNT(*), MAX(bloqueado_ate)
    INTO v_tentativas, v_bloqueio_ate
    FROM tentativa_login
   WHERE id_usuario = NEW.id_usuario
     AND status = 'falha'
     AND data_hora > NOW() - INTERVAL '30 minutes';

  IF v_bloqueio_ate IS NOT NULL AND v_bloqueio_ate > NOW() THEN
    RAISE EXCEPTION 'Conta bloqueada até %', v_bloqueio_ate;
  END IF;

  IF v_tentativas >= 5 THEN
    NEW.bloqueado_ate := NOW() + INTERVAL '24 hours';
  ELSIF v_tentativas >= 3 THEN
    NEW.bloqueado_ate := NOW() + INTERVAL '15 minutes';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tg_verificar_bloqueio
  BEFORE INSERT ON tentativa_login
  FOR EACH ROW EXECUTE FUNCTION verificar_bloqueio_login();
