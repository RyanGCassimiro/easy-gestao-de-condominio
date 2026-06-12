import { supabase } from './supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';

type Callback<T = Record<string, unknown>> = (payload: T) => void;

export function subscribeVotos(
  idPauta: number,
  onUpdate: Callback,
): RealtimeChannel {
  return supabase
    .channel(`votos:pauta:${idPauta}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'voto', filter: `id_pauta=eq.${idPauta}` },
      onUpdate,
    )
    .subscribe();
}

export function subscribeAvisos(
  idCondominio: number,
  onInsert: Callback,
): RealtimeChannel {
  return supabase
    .channel(`avisos:${idCondominio}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'aviso', filter: `id_condominio=eq.${idCondominio}` },
      onInsert,
    )
    .subscribe();
}

export function unsubscribe(channel: RealtimeChannel): void {
  supabase.removeChannel(channel);
}
