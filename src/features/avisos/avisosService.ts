import { supabase } from '../../services/supabaseClient';
import { AvisoInput, MarcarLidoInput } from './avisosSchemas';
import { sanitizeFreeText } from '../../utils/sanitize';
import { enviarNotificacaoLocal } from '../../services/notificationService';

export const avisosService = {
  async listar() {
    const { data, error } = await supabase
      .from('aviso')
      .select('*, lido:visualiza_aviso(id_usuario)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async publicar(input: AvisoInput) {
    const { data, error } = await supabase
      .from('aviso')
      .insert({
        titulo:    sanitizeFreeText(input.titulo),
        conteudo:  sanitizeFreeText(input.conteudo),
        prioridade: input.prioridade,
        bloco:     input.bloco,
        andar:     input.andar,
        expira_em: input.expiraEm,
      })
      .select()
      .single();
    if (error) throw error;

    await enviarNotificacaoLocal(input.titulo, input.conteudo.slice(0, 100));
    return data;
  },

  async marcarLido(input: MarcarLidoInput) {
    const { error } = await supabase
      .from('visualiza_aviso')
      .insert({ id_aviso: input.idAviso });
    if (error && error.code !== '23505') throw error; // ignora duplicata
  },
};
