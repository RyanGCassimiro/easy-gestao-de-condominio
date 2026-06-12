import { supabase } from '../../services/supabaseClient';
import { ReservaInput, CancelarReservaInput } from './reservasSchemas';

export const reservasService = {
  async listar() {
    const { data, error } = await supabase
      .from('reserva')
      .select('*, espaco:espaco_comum(nome, descricao)')
      .neq('status', 'cancelada')
      .order('data', { ascending: true });
    if (error) throw error;
    return data;
  },

  async criar(input: ReservaInput) {
    const { data, error } = await supabase
      .from('reserva')
      .insert({
        id_espaco:   input.idEspaco,
        data:        input.data,
        hora_inicio: input.horaInicio,
        hora_fim:    input.horaFim,
        observacao:  input.observacao,
        status:      'ativa',
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async cancelar(input: CancelarReservaInput) {
    const { error } = await supabase
      .from('reserva')
      .update({ status: 'cancelada', motivo_cancelamento: input.motivo })
      .eq('id_reserva', input.idReserva);
    if (error) throw error;
  },

  async listarEspacos() {
    const { data, error } = await supabase
      .from('espaco_comum')
      .select('*')
      .eq('ativo', true);
    if (error) throw error;
    return data;
  },
};
