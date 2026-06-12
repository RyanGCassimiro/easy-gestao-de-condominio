import { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from './useAuth';

type Profile = {
  id_usuario: string;
  perfil:     'morador' | 'comerciante' | 'sindico' | 'porteiro';
  nome?:      string;
  unidade?:   string;
  bloco?:     string;
  foto_url?:  string;
};

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setProfile(null); setLoading(false); return; }

    supabase
      .from('usuario')
      .select('id_usuario, perfil, foto_url, morador(nome, unidade, bloco)')
      .eq('id_usuario', user.id)
      .single()
      .then(({ data, error }) => {
        if (!error && data) {
          const m = (data as any).morador?.[0];
          setProfile({
            id_usuario: data.id_usuario,
            perfil:     data.perfil as Profile['perfil'],
            foto_url:   data.foto_url,
            nome:       m?.nome,
            unidade:    m?.unidade,
            bloco:      m?.bloco,
          });
        }
        setLoading(false);
      });
  }, [user]);

  return { profile, loading };
}
