import { supabase } from './supabaseClient';

type AuditEntry = {
  acao:        string;
  entidade:    string;
  id_entidade?: string;
  detalhes?:   Record<string, unknown>;
};

export async function registrarAudit(entry: AuditEntry): Promise<void> {
  const { error } = await supabase.rpc('inserir_audit_log', {
    p_acao:        entry.acao,
    p_entidade:    entry.entidade,
    p_id_entidade: entry.id_entidade ?? null,
    p_detalhes:    entry.detalhes ?? null,
  });

  if (error) console.warn('Audit log falhou:', error.message);
}
