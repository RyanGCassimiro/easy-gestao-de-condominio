-- RF019: Tabela audit_log imutável (todas as telas com ações críticas)
CREATE TABLE IF NOT EXISTS audit_log (
  id          BIGSERIAL PRIMARY KEY,
  acao        TEXT        NOT NULL,
  entidade    TEXT        NOT NULL,
  id_entidade TEXT,
  id_usuario  UUID        REFERENCES usuario(id_usuario),
  ip_origem   INET,
  data_hora   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  detalhes    JSONB
);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Imutável: nenhum usuário pode alterar ou excluir logs
CREATE POLICY audit_no_update ON audit_log FOR UPDATE USING (false);
CREATE POLICY audit_no_delete ON audit_log FOR DELETE USING (false);
CREATE POLICY audit_no_select ON audit_log FOR SELECT USING (false);

-- Somente service_role (backend) insere
CREATE POLICY audit_insert ON audit_log
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Função auxiliar para inserir log (chamada pelos triggers das outras tabelas)
CREATE OR REPLACE FUNCTION inserir_audit_log(
  p_acao        TEXT,
  p_entidade    TEXT,
  p_id_entidade TEXT,
  p_detalhes    JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO audit_log (acao, entidade, id_entidade, id_usuario, detalhes)
  VALUES (p_acao, p_entidade, p_id_entidade, auth.uid(), p_detalhes);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers de auditoria por tela ----------------------------------------

-- T02: Cadastro de usuário
CREATE OR REPLACE FUNCTION audit_usuario_insert()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM inserir_audit_log('cadastro', 'usuario', NEW.id_usuario::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tg_audit_usuario
  AFTER INSERT ON usuario
  FOR EACH ROW EXECUTE FUNCTION audit_usuario_insert();

-- T06: Reserva criada / cancelada
CREATE OR REPLACE FUNCTION audit_reserva()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM inserir_audit_log('reserva_criada', 'reserva', NEW.id_reserva::text);
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'cancelada' THEN
    PERFORM inserir_audit_log('reserva_cancelada', 'reserva', NEW.id_reserva::text);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tg_audit_reserva
  AFTER INSERT OR UPDATE ON reserva
  FOR EACH ROW EXECUTE FUNCTION audit_reserva();

-- T07: Aviso publicado
CREATE OR REPLACE FUNCTION audit_aviso_insert()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM inserir_audit_log('aviso_publicado', 'aviso', NEW.id_aviso::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tg_audit_aviso
  AFTER INSERT ON aviso
  FOR EACH ROW EXECUTE FUNCTION audit_aviso_insert();

-- T08: Voto registrado
CREATE OR REPLACE FUNCTION audit_voto_insert()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM inserir_audit_log(
    'voto',
    'voto',
    NEW.id_voto::text,
    jsonb_build_object('id_pauta', NEW.id_pauta, 'hash', NEW.hash_verificacao)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tg_audit_voto
  AFTER INSERT ON voto
  FOR EACH ROW EXECUTE FUNCTION audit_voto_insert();

-- T09: Item achado registrado / retirada confirmada
CREATE OR REPLACE FUNCTION audit_item_achado()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM inserir_audit_log('item_registrado', 'item_achado', NEW.id_item::text);
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'retirado' THEN
    PERFORM inserir_audit_log('item_retirado', 'item_achado', NEW.id_item::text);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tg_audit_item_achado
  AFTER INSERT OR UPDATE ON item_achado
  FOR EACH ROW EXECUTE FUNCTION audit_item_achado();
