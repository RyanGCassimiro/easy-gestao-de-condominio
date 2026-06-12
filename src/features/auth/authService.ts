import { supabase } from '../../services/supabaseClient';
import { registrarAudit } from '../../services/auditService';
import { hashCPF } from '../../utils/cpfValidator';
import { uploadImagem } from '../../services/storageService';
import {
  LoginInput,
  RegisterMoradorInput,
  RegisterComercianteInput,
  ForgotPasswordInput,
} from './authSchemas';

const CPF_SALT = process.env.EXPO_PUBLIC_CPF_SALT ?? 'easy_core_salt';

export const authService = {
  async login(input: LoginInput) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email:    input.email,
      password: input.senha,
    });
    if (error) throw new Error(error.message);
    return data;
  },

  async registrarMorador(input: RegisterMoradorInput, fotoUri?: string) {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email:    input.email,
      password: input.senha,
    });
    if (authError) throw new Error(authError.message);

    const uid = authData.user!.id;
    let fotoUrl: string | undefined;

    if (fotoUri) {
      fotoUrl = await uploadImagem('avatars', `${uid}/perfil.jpg`, fotoUri, 'image/jpeg');
    }

    const { error: userError } = await supabase.from('usuario').insert({
      id_usuario:       uid,
      email:            input.email,
      perfil:           'morador',
      foto_url:         fotoUrl,
      aceite_termos_em: new Date().toISOString(),
    });
    if (userError) throw new Error(userError.message);

    const { error: moradorError } = await supabase.from('morador').insert({
      id_usuario: uid,
      nome:       input.nome,
      cpf_hash:   await hashCPF(input.cpf, CPF_SALT),
      unidade:    input.unidade,
      bloco:      input.bloco,
    });
    if (moradorError) throw new Error(moradorError.message);

    await registrarAudit({ acao: 'cadastro', entidade: 'usuario', id_entidade: uid });
  },

  async registrarComerciante(input: RegisterComercianteInput) {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email:    input.email,
      password: input.senha,
    });
    if (authError) throw new Error(authError.message);

    const uid = authData.user!.id;

    const { error: userError } = await supabase.from('usuario').insert({
      id_usuario:       uid,
      email:            input.email,
      perfil:           'comerciante',
      aceite_termos_em: new Date().toISOString(),
    });
    if (userError) throw new Error(userError.message);

    const { error: comError } = await supabase.from('comerciante').insert({
      id_usuario:      uid,
      nome_fantasia:   input.nomeFantasia,
      cnpj:            input.cnpj,
      nome_responsavel: input.nomeResponsavel,
    });
    if (comError) throw new Error(comError.message);

    await registrarAudit({ acao: 'cadastro', entidade: 'usuario', id_entidade: uid });
  },

  async recuperarSenha(input: ForgotPasswordInput) {
    const { error } = await supabase.auth.resetPasswordForEmail(input.email, {
      redirectTo: 'easy-core://reset-password',
    });
    if (error) throw new Error(error.message);
  },

  async logout() {
    await supabase.auth.signOut();
  },
};
