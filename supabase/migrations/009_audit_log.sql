-- RF019: Tabela audit_log imutável (já criada no 000_schema.sql)
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS audit_no_update ON audit_log;
DROP POLICY IF EXISTS audit_no_delete ON audit_log;
DROP POLICY IF EXISTS audit_no_select ON audit_log;
DROP POLICY IF EXISTS audit_insert    ON audit_log;

CREATE POLICY audit_no_update ON audit_log FOR UPDATE USING (false);
CREATE POLICY audit_no_delete ON audit_log FOR DELETE USING (false);
CREATE POLICY audit_no_select ON audit_log FOR SELECT USING (false);
CREATE POLICY audit_insert    ON audit_log FOR INSERT WITH CHECK (true);

-- Triggers de auditoria

CREATE OR REPLACE FUNCTION audit_usuario_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  PERFORM inserir_audit_log('cadastro', 'usuario', NEW.id_usuario::text, NULL);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_audit_usuario ON usuario;
CREATE TRIGGER tg_audit_usuario
  AFTER INSERT ON usuario
  FOR EACH ROW EXECUTE FUNCTION audit_usuario_insert();

CREATE OR REPLACE FUNCTION audit_reserva()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM inserir_audit_log('reserva_criada', 'reserva', NEW.id_reserva::text, NULL);
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'cancelada' THEN
    PERFORM inserir_audit_log('reserva_cancelada', 'reserva', NEW.id_reserva::text, NULL);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_audit_reserva ON reserva;
CREATE TRIGGER tg_audit_reserva
  AFTER INSERT OR UPDATE ON reserva
  FOR EACH ROW EXECUTE FUNCTION audit_reserva();

CREATE OR REPLACE FUNCTION audit_aviso_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  PERFORM inserir_audit_log('aviso_publicado', 'aviso', NEW.id_aviso::text, NULL);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_audit_aviso ON aviso;
CREATE TRIGGER tg_audit_aviso
  AFTER INSERT ON aviso
  FOR EACH ROW EXECUTE FUNCTION audit_aviso_insert();

CREATE OR REPLACE FUNCTION audit_voto_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  PERFORM inserir_audit_log(
    'voto', 'voto', NEW.id_voto::text,
    jsonb_build_object('id_pauta', NEW.id_pauta, 'opcao', NEW.opcao)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_audit_voto ON voto;
CREATE TRIGGER tg_audit_voto
  AFTER INSERT ON voto
  FOR EACH ROW EXECUTE FUNCTION audit_voto_insert();

CREATE OR REPLACE FUNCTION audit_item_achado()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM inserir_audit_log('item_registrado', 'item_achado', NEW.id_item::text, NULL);
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'retirado' THEN
    PERFORM inserir_audit_log('item_retirado', 'item_achado', NEW.id_item::text, NULL);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_audit_item_achado ON item_achado;
CREATE TRIGGER tg_audit_item_achado
  AFTER INSERT OR UPDATE ON item_achado
  FOR EACH ROW EXECUTE FUNCTION audit_item_achado();
