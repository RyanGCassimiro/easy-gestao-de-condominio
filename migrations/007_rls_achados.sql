-- T09: RLS da tabela item_achado
ALTER TABLE item_achado ENABLE ROW LEVEL SECURITY;

-- Morador lê itens disponíveis do próprio condomínio
CREATE POLICY achado_morador_select ON item_achado
  FOR SELECT USING (
    id_condominio = auth_condominio()
    AND status = 'disponivel'
  );

-- Porteiro registra e atualiza itens
CREATE POLICY achado_porteiro_insert ON item_achado
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM usuario WHERE id_usuario = auth.uid() AND perfil = 'porteiro')
  );

CREATE POLICY achado_porteiro_update ON item_achado
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM usuario WHERE id_usuario = auth.uid() AND perfil = 'porteiro')
  );

-- Nenhum usuário apaga itens (log imutável)
CREATE POLICY achado_no_delete ON item_achado FOR DELETE USING (false);
