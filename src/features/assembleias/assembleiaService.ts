import { supabase } from '../../services/supabaseClient';
import { AssembleiaInput, PautaInput, VotoInput } from './assembleiaSchemas';

export const assembleiaService = {
  async listar() {
    const { data, error } = await supabase
      .from('assembleia')
      .select('*, pautas:pauta(*)')
      .order('data_hora', { ascending: false });
    if (error) throw error;
    return data;
  },

  async criar(input: AssembleiaInput) {
    const { data, error } = await supabase
      .from('assembleia')
      .insert({
        titulo:     input.titulo,
        descricao:  input.descricao,
        data_hora:  input.dataHora,
        local:      input.local,
        modalidade: input.modalidade,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async adicionarPauta(input: PautaInput) {
    const { data, error } = await supabase
      .from('pauta')
      .insert({
        id_assembleia: input.idAssembleia,
        titulo:        input.titulo,
        descricao:     input.descricao,
        ordem:         input.ordem,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async votar(input: VotoInput) {
    const { data, error } = await supabase
      .from('voto')
      .insert({
        id_pauta:  input.idPauta,
        opcao:     input.opcao,
        data_hora: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async contarVotos(idPauta: number) {
    const { data, error } = await supabase
      .from('voto')
      .select('opcao')
      .eq('id_pauta', idPauta);
    if (error) throw error;

    return data.reduce(
      (acc, v) => ({ ...acc, [v.opcao]: (acc[v.opcao as keyof typeof acc] ?? 0) + 1 }),
      { sim: 0, nao: 0, abstencao: 0 },
    );
  },

  async jaVotou(idPauta: number): Promise<boolean> {
    const uid = (await supabase.auth.getUser()).data.user?.id;
    const { count } = await supabase
      .from('voto')
      .select('*', { count: 'exact', head: true })
      .eq('id_pauta', idPauta)
      .eq('id_usuario', uid ?? '');
    return (count ?? 0) > 0;
  },
};
