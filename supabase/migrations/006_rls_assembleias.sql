-- T08: RLS das tabelas assembleia, pauta e voto
ALTER TABLE assembleia ENABLE ROW LEVEL SECURITY;
ALTER TABLE pauta      ENABLE ROW LEVEL SECURITY;
ALTER TABLE voto       ENABLE ROW LEVEL SECURITY;

-- Função: verifica se o usuário é titular (pode votar)
CREATE OR REPLACE FUNCTION is_titular(p_uid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM morador
     WHERE id_usuario = p_uid
       AND is_titular = true
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Todos os autenticados leem assembleias e pautas do próprio condomínio
CREATE POLICY assembleia_select ON assembleia
  FOR SELECT USING (id_condominio = auth_condominio());

CREATE POLICY pauta_select ON pauta
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM assembleia a
       WHERE a.id_assembleia = pauta.id_assembleia
         AND a.id_condominio = auth_condominio()
    )
  );

-- Somente síndico cria assembleias e pautas
CREATE POLICY assembleia_sindico_insert ON assembleia
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM usuario WHERE id_usuario = auth.uid() AND perfil = 'sindico')
  );

CREATE POLICY pauta_sindico_insert ON pauta
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM usuario WHERE id_usuario = auth.uid() AND perfil = 'sindico')
  );

-- Voto: somente titular e sem voto anterior para a mesma pauta
CREATE POLICY voto_titular_insert ON voto
  FOR INSERT WITH CHECK (
    is_titular(auth.uid()) = true
    AND NOT EXISTS (
      SELECT 1 FROM voto v
       WHERE v.id_pauta   = NEW.id_pauta
         AND v.id_usuario = auth.uid()
    )
  );

-- Voto é imutável após registro
CREATE POLICY voto_no_update ON voto FOR UPDATE USING (false);
CREATE POLICY voto_no_delete ON voto FOR DELETE USING (false);

-- Trigger: gera hash_verificacao após INSERT do voto
CREATE OR REPLACE FUNCTION gerar_hash_voto()
RETURNS TRIGGER AS $$
BEGIN
  NEW.hash_verificacao := encode(
    digest(
      NEW.id_voto::text || '|' ||
      NEW.id_pauta::text || '|' ||
      NEW.id_usuario::text || '|' ||
      NEW.data_hora::text,
      'sha256'
    ),
    'hex'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tg_hash_voto
  BEFORE INSERT ON voto
  FOR EACH ROW EXECUTE FUNCTION gerar_hash_voto();
