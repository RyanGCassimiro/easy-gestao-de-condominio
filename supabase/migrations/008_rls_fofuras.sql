-- T10: RLS da tabela dependente (pets)
ALTER TABLE dependente ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pet_select ON dependente;
DROP POLICY IF EXISTS pet_insert ON dependente;
DROP POLICY IF EXISTS pet_update ON dependente;

CREATE POLICY pet_select ON dependente
  FOR SELECT USING (id_usuario = auth.uid());

CREATE POLICY pet_insert ON dependente
  FOR INSERT WITH CHECK (
    id_usuario = auth.uid() AND tipo = 'pet'
  );

CREATE POLICY pet_update ON dependente
  FOR UPDATE USING (
    id_usuario = auth.uid() AND tipo = 'pet'
  );

CREATE OR REPLACE FUNCTION check_consentimento_lgpd()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.tipo = 'pet' AND NEW.consentimento_lgpd IS NOT TRUE THEN
    RAISE EXCEPTION 'Consentimento LGPD obrigatório para cadastro de pet (Art.14)';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_consentimento_lgpd ON dependente;
CREATE TRIGGER tg_consentimento_lgpd
  BEFORE INSERT ON dependente
  FOR EACH ROW WHEN (NEW.tipo = 'pet')
  EXECUTE FUNCTION check_consentimento_lgpd();
