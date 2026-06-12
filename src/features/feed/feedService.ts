import { supabase } from '../../services/supabaseClient';
import { sanitizeFreeText } from '../../utils/sanitize';
import { PostagemInput, CurtidaInput, FiltroFeedInput } from './feedSchemas';

export const feedService = {
  async listar(filtro: FiltroFeedInput) {
    let query = supabase
      .from('postagem')
      .select('*, autor:usuario(nome_fantasia, foto_url), _count:curtida(count)')
      .order('created_at', { ascending: false })
      .range(
        filtro.pagina * filtro.tamanhoPagina,
        (filtro.pagina + 1) * filtro.tamanhoPagina - 1,
      );

    if (!filtro.incluirMaior18) query = query.eq('is_maior18', false);
    if (filtro.categoria)       query = query.contains('categorias', [filtro.categoria]);

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async criar(input: PostagemInput) {
    const { data, error } = await supabase
      .from('postagem')
      .insert({
        ...input,
        conteudo: sanitizeFreeText(input.conteudo),
        titulo:   sanitizeFreeText(input.titulo),
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async curtir(input: CurtidaInput) {
    const { error } = await supabase
      .from('curtida')
      .insert({ id_postagem: input.idPostagem });
    if (error) throw error;
  },

  async descurtir(idPostagem: number) {
    const { error } = await supabase
      .from('curtida')
      .delete()
      .eq('id_postagem', idPostagem);
    if (error) throw error;
  },
};
