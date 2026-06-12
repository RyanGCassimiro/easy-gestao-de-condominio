-- T05: RLS das tabelas postagem e curtida
ALTER TABLE postagem ENABLE ROW LEVEL SECURITY;
ALTER TABLE curtida  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS postagem_select ON postagem;
DROP POLICY IF EXISTS postagem_insert ON postagem;
DROP POLICY IF EXISTS postagem_update ON postagem;
DROP POLICY IF EXISTS postagem_delete ON postagem;
DROP POLICY IF EXISTS curtida_select  ON curtida;
DROP POLICY IF EXISTS curtida_insert  ON curtida;
DROP POLICY IF EXISTS curtida_delete  ON curtida;

CREATE POLICY postagem_select ON postagem
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY postagem_insert ON postagem
  FOR INSERT WITH CHECK (id_autor = auth.uid());

CREATE POLICY postagem_update ON postagem
  FOR UPDATE USING (id_autor = auth.uid());

CREATE POLICY postagem_delete ON postagem
  FOR DELETE USING (id_autor = auth.uid());

CREATE POLICY curtida_select ON curtida
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY curtida_insert ON curtida
  FOR INSERT WITH CHECK (id_usuario = auth.uid());

CREATE POLICY curtida_delete ON curtida
  FOR DELETE USING (id_usuario = auth.uid());
