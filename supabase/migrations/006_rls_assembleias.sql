-- T08: RLS das tabelas assembleia, pauta e voto
ALTER TABLE assembleia ENABLE ROW LEVEL SECURITY;
ALTER TABLE pauta      ENABLE ROW LEVEL SECURITY;
ALTER TABLE voto       ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS assembleia_select         ON assembleia;
DROP POLICY IF EXISTS assembleia_sindico_insert ON assembleia;
DROP POLICY IF EXISTS assembleia_sindico_update ON assembleia;
DROP POLICY IF EXISTS pauta_select              ON pauta;
DROP POLICY IF EXISTS pauta_sindico_insert      ON pauta;
DROP POLICY IF EXISTS voto_select               ON voto;
DROP POLICY IF EXISTS voto_insert               ON voto;
DROP POLICY IF EXISTS voto_no_update            ON voto;
DROP POLICY IF EXISTS voto_no_delete            ON voto;

CREATE POLICY assembleia_select ON assembleia
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY assembleia_sindico_insert ON assembleia
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM usuario WHERE id_usuario = auth.uid() AND perfil = 'sindico')
  );

CREATE POLICY assembleia_sindico_update ON assembleia
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM usuario WHERE id_usuario = auth.uid() AND perfil = 'sindico')
  );

CREATE POLICY pauta_select ON pauta
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY pauta_sindico_insert ON pauta
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM usuario WHERE id_usuario = auth.uid() AND perfil = 'sindico')
  );

CREATE POLICY voto_select ON voto
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY voto_insert ON voto
  FOR INSERT WITH CHECK (
    id_usuario = auth.uid()
    AND NOT EXISTS (
      SELECT 1 FROM voto v
       WHERE v.id_pauta   = voto.id_pauta
         AND v.id_usuario = auth.uid()
    )
  );

CREATE POLICY voto_no_update ON voto FOR UPDATE USING (false);
CREATE POLICY voto_no_delete ON voto FOR DELETE USING (false);
