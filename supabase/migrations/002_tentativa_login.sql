-- T01: Rate-limit / bloqueio progressivo de brute-force
-- A tabela tentativa_login já foi criada no 000_schema.sql
ALTER TABLE tentativa_login ENABLE ROW LEVEL SECURITY;

-- Apenas service_role acessa logs de tentativa
CREATE POLICY tentativa_no_select ON tentativa_login FOR SELECT USING (false);
CREATE POLICY tentativa_no_update ON tentativa_login FOR UPDATE USING (false);
CREATE POLICY tentativa_no_delete ON tentativa_login FOR DELETE USING (false);
CREATE POLICY tentativa_insert    ON tentativa_login
  FOR INSERT WITH CHECK (auth.role() = 'service_role');
