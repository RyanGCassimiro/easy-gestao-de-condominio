import { useEffect, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { subscribeVotos, subscribeAvisos, unsubscribe } from '../services/realtimeService';

export function useRealtimeVotos(idPauta: number, onUpdate: (payload: unknown) => void) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    channelRef.current = subscribeVotos(idPauta, onUpdate);
    return () => {
      if (channelRef.current) unsubscribe(channelRef.current);
    };
  }, [idPauta]);
}

export function useRealtimeAvisos(idCondominio: number, onInsert: (payload: unknown) => void) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    channelRef.current = subscribeAvisos(idCondominio, onInsert);
    return () => {
      if (channelRef.current) unsubscribe(channelRef.current);
    };
  }, [idCondominio]);
}
