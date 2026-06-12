-- T07: RLS das tabelas aviso e visualiza_aviso
ALTER TABLE aviso          ENABLE ROW LEVEL SECURITY;
ALTER TABLE visualiza_aviso ENABLE ROW LEVEL SECURITY;

-- Função auxiliar: retorna o id_condominio do usuário logado
CREATE OR REPLACE FUNCTION auth_condominio()
RETURNS INT AS $$
  SELECT id_condominio
    FROM morador_unidade
   WHERE id_usuario = auth.uid()
   LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Morador lê avisos do próprio condomínio
CREATE POLICY aviso_morador_select ON aviso
  FOR SELECT USING (id_condominio = auth_condominio());

-- Síndico publica avisos
CREATE POLICY aviso_sindico_insert ON aviso
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuario
       WHERE id_usuario = auth.uid()
         AND perfil = 'sindico'
    )
  );

-- Síndico edita/remove os próprios avisos
CREATE POLICY aviso_sindico_update ON aviso
  FOR UPDATE USING (id_autor = auth.uid());

CREATE POLICY aviso_sindico_delete ON aviso
  FOR DELETE USING (id_autor = auth.uid());

-- Morador registra leitura
CREATE POLICY visualiza_insert ON visualiza_aviso
  FOR INSERT WITH CHECK (id_usuario = auth.uid());

-- Trigger: grava leitura automaticamente ao marcar lido
CREATE OR REPLACE FUNCTION registrar_visualizacao()
RETURNS TRIGGER AS $$
BEGIN
  NEW.data_hora := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tg_visualiza_aviso
  BEFORE INSERT ON visualiza_aviso
  FOR EACH ROW EXECUTE FUNCTION registrar_visualizacao();
