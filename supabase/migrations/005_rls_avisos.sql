-- T07: RLS das tabelas aviso e visualiza_aviso
ALTER TABLE aviso           ENABLE ROW LEVEL SECURITY;
ALTER TABLE visualiza_aviso ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS aviso_select          ON aviso;
DROP POLICY IF EXISTS aviso_sindico_insert  ON aviso;
DROP POLICY IF EXISTS aviso_sindico_update  ON aviso;
DROP POLICY IF EXISTS aviso_sindico_delete  ON aviso;
DROP POLICY IF EXISTS visualiza_select      ON visualiza_aviso;
DROP POLICY IF EXISTS visualiza_insert      ON visualiza_aviso;

CREATE POLICY aviso_select ON aviso
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY aviso_sindico_insert ON aviso
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM usuario WHERE id_usuario = auth.uid() AND perfil = 'sindico')
  );

CREATE POLICY aviso_sindico_update ON aviso
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM usuario WHERE id_usuario = auth.uid() AND perfil = 'sindico')
  );

CREATE POLICY aviso_sindico_delete ON aviso
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM usuario WHERE id_usuario = auth.uid() AND perfil = 'sindico')
  );

CREATE POLICY visualiza_select ON visualiza_aviso
  FOR SELECT USING (id_usuario = auth.uid());

CREATE POLICY visualiza_insert ON visualiza_aviso
  FOR INSERT WITH CHECK (id_usuario = auth.uid());
