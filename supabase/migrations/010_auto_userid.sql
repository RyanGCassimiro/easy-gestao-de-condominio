-- Trigger genérico: preenche id_usuario e id_autor com auth.uid() antes do INSERT
-- Evita ter que passar o UUID manualmente em cada service

-- curtida
CREATE OR REPLACE FUNCTION set_usuario_curtida()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  NEW.id_usuario := auth.uid();
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS tg_set_usuario_curtida ON curtida;
CREATE TRIGGER tg_set_usuario_curtida
  BEFORE INSERT ON curtida
  FOR EACH ROW EXECUTE FUNCTION set_usuario_curtida();

-- voto
CREATE OR REPLACE FUNCTION set_usuario_voto()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  NEW.id_usuario := auth.uid();
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS tg_set_usuario_voto ON voto;
CREATE TRIGGER tg_set_usuario_voto
  BEFORE INSERT ON voto
  FOR EACH ROW EXECUTE FUNCTION set_usuario_voto();

-- visualiza_aviso
CREATE OR REPLACE FUNCTION set_usuario_visualiza()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  NEW.id_usuario := auth.uid();
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS tg_set_usuario_visualiza ON visualiza_aviso;
CREATE TRIGGER tg_set_usuario_visualiza
  BEFORE INSERT ON visualiza_aviso
  FOR EACH ROW EXECUTE FUNCTION set_usuario_visualiza();

-- postagem (id_autor)
CREATE OR REPLACE FUNCTION set_autor_postagem()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  NEW.id_autor := auth.uid();
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS tg_set_autor_postagem ON postagem;
CREATE TRIGGER tg_set_autor_postagem
  BEFORE INSERT ON postagem
  FOR EACH ROW EXECUTE FUNCTION set_autor_postagem();

-- dependente (id_usuario)
CREATE OR REPLACE FUNCTION set_usuario_dependente()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  NEW.id_usuario := auth.uid();
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS tg_set_usuario_dependente ON dependente;
CREATE TRIGGER tg_set_usuario_dependente
  BEFORE INSERT ON dependente
  FOR EACH ROW EXECUTE FUNCTION set_usuario_dependente();

-- reserva (id_usuario)
CREATE OR REPLACE FUNCTION set_usuario_reserva()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  NEW.id_usuario := auth.uid();
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS tg_set_usuario_reserva ON reserva;
CREATE TRIGGER tg_set_usuario_reserva
  BEFORE INSERT ON reserva
  FOR EACH ROW EXECUTE FUNCTION set_usuario_reserva();
