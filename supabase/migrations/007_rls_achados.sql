-- T09: RLS da tabela item_achado
ALTER TABLE item_achado ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS achado_select          ON item_achado;
DROP POLICY IF EXISTS achado_porteiro_insert ON item_achado;
DROP POLICY IF EXISTS achado_porteiro_update ON item_achado;
DROP POLICY IF EXISTS achado_no_delete       ON item_achado;

CREATE POLICY achado_select ON item_achado
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY achado_porteiro_insert ON item_achado
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM usuario WHERE id_usuario = auth.uid() AND perfil = 'porteiro')
  );

CREATE POLICY achado_porteiro_update ON item_achado
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM usuario WHERE id_usuario = auth.uid() AND perfil = 'porteiro')
  );

CREATE POLICY achado_no_delete ON item_achado FOR DELETE USING (false);
