-- T01 / T02: RLS da tabela usuario
ALTER TABLE usuario ENABLE ROW LEVEL SECURITY;

CREATE POLICY usuario_select_proprio ON usuario
  FOR SELECT USING (id_usuario = auth.uid());

CREATE POLICY usuario_update_proprio ON usuario
  FOR UPDATE USING (id_usuario = auth.uid());

-- Cadastro é sem RLS (INSERT público controlado por trigger de unicidade)
CREATE POLICY usuario_insert_publico ON usuario
  FOR INSERT WITH CHECK (true);
