import { supabase } from '../../services/supabaseClient';
import { ItemAchadoInput, SolicitarRetiradaInput } from './achadosSchemas';
import { uploadImagem } from '../../services/storageService';
import { registrarAudit } from '../../services/auditService';

export const achadosService = {
  async listar() {
    const { data, error } = await supabase
      .from('item_achado')
      .select('*')
      .eq('status', 'disponivel')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async registrar(input: ItemAchadoInput, fotoUri?: string) {
    let imagemUrl = input.imagemUrl;

    if (fotoUri) {
      const nome = `achados/${Date.now()}.jpg`;
      imagemUrl = await uploadImagem('achados', nome, fotoUri, 'image/jpeg');
    }

    const { data, error } = await supabase
      .from('item_achado')
      .insert({
        descricao:   input.descricao,
        local_achado: input.localAchado,
        imagem_url:  imagemUrl,
        data_achado: input.dataAchado,
        status:      'disponivel',
      })
      .select()
      .single();
    if (error) throw error;

    await registrarAudit({
      acao:        'item_registrado',
      entidade:    'item_achado',
      id_entidade: String(data.id_item),
    });

    return data;
  },

  async confirmarRetirada(input: SolicitarRetiradaInput) {
    const { error } = await supabase
      .from('item_achado')
      .update({
        status:             'retirado',
        nome_retirada:      input.nomeRetirada,
        documento_retirada: input.documentoRetirada,
        observacao_retirada: input.observacao,
        data_retirada:      new Date().toISOString(),
      })
      .eq('id_item', input.idItem);
    if (error) throw error;

    await registrarAudit({
      acao:        'item_retirado',
      entidade:    'item_achado',
      id_entidade: String(input.idItem),
    });
  },
};
