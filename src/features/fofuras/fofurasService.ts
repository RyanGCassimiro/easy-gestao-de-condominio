import { supabase } from '../../services/supabaseClient';
import { PetInput, EditarPetInput } from './fofurasSchemas';
import { uploadImagem } from '../../services/storageService';

export const fofurasService = {
  async listar() {
    const { data, error } = await supabase
      .from('dependente')
      .select('*')
      .eq('tipo', 'pet')
      .order('nome');
    if (error) throw error;
    return data;
  },

  async cadastrar(input: PetInput, fotoUri?: string) {
    let imagemUrl = input.imagemUrl;

    if (fotoUri) {
      const uid = (await supabase.auth.getUser()).data.user!.id;
      imagemUrl = await uploadImagem('pets', `${uid}/${Date.now()}.jpg`, fotoUri, 'image/jpeg');
    }

    const { data, error } = await supabase
      .from('dependente')
      .insert({
        nome:                  input.nome,
        raca:                  input.raca,
        especie:               input.especie,
        imagem_url:            imagemUrl,
        data_nasc:             input.dataNasc,
        observacao:            input.observacao,
        tipo:                  'pet',
        consentimento_lgpd:    true,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async editar(input: EditarPetInput, fotoUri?: string) {
    let imagemUrl = input.imagemUrl;

    if (fotoUri) {
      const uid = (await supabase.auth.getUser()).data.user!.id;
      imagemUrl = await uploadImagem('pets', `${uid}/${Date.now()}.jpg`, fotoUri, 'image/jpeg');
    }

    const { error } = await supabase
      .from('dependente')
      .update({
        nome:       input.nome,
        raca:       input.raca,
        especie:    input.especie,
        imagem_url: imagemUrl,
        data_nasc:  input.dataNasc,
        observacao: input.observacao,
      })
      .eq('id_dependente', input.idPet)
      .eq('tipo', 'pet');
    if (error) throw error;
  },
};
