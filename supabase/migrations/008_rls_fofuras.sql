-- T10: RLS da tabela dependente/pet
-- A tabela é chamada "dependente" no modelo físico; pets são vinculados via tipo
ALTER TABLE dependente ENABLE ROW LEVEL SECURITY;

-- Morador vê apenas os próprios pets
CREATE POLICY pet_morador_select ON dependente
  FOR SELECT USING (
    id_morador = (SELECT id_morador FROM morador WHERE id_usuario = auth.uid())
    AND tipo = 'pet'
  );

CREATE POLICY pet_morador_insert ON dependente
  FOR INSERT WITH CHECK (
    id_morador = (SELECT id_morador FROM morador WHERE id_usuario = auth.uid())
    AND tipo = 'pet'
  );

CREATE POLICY pet_morador_update ON dependente
  FOR UPDATE USING (
    id_morador = (SELECT id_morador FROM morador WHERE id_usuario = auth.uid())
    AND tipo = 'pet'
  );

-- LGPD Art.14: registra consentimento do responsável ao inserir
CREATE OR REPLACE FUNCTION registrar_consentimento_lgpd()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.consentimento_lgpd IS NOT TRUE THEN
    RAISE EXCEPTION 'Consentimento LGPD obrigatório (Art.14)';
  END IF;
  NEW.timestamp_consentimento := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tg_consentimento_lgpd
  BEFORE INSERT ON dependente
  FOR EACH ROW WHEN (NEW.tipo = 'pet')
  EXECUTE FUNCTION registrar_consentimento_lgpd();
