import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Pressable,
} from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  registerMoradorSchema,
  registerComercianteSchema,
} from '../../src/features/auth/authSchemas';
import { authService } from '../../src/features/auth/authService';
import { mascaraCPF, mascaraCNPJ } from '../../src/utils/formatters';
import { COLORS, RADIUS } from '../../src/constants/theme';

type Perfil = 'morador' | 'comerciante';

export default function RegisterScreen() {
  const [perfil,          setPerfil]          = useState<Perfil>('morador');
  const [nome,            setNome]            = useState('');
  const [cpf,             setCpf]             = useState('');
  const [cnpj,            setCnpj]            = useState('');
  const [nomeFantasia,    setNomeFantasia]    = useState('');
  const [nomeResponsavel, setNomeResponsavel] = useState('');
  const [unidade,         setUnidade]         = useState('');
  const [bloco,           setBloco]           = useState('');
  const [email,           setEmail]           = useState('');
  const [senha,           setSenha]           = useState('');
  const [confirmarSenha,  setConfirmarSenha]  = useState('');
  const [aceitouTermos,   setAceitouTermos]   = useState(false);
  const [fotoUri,         setFotoUri]         = useState<string | undefined>();
  const [carregando,      setCarregando]      = useState(false);
  const [erro,            setErro]            = useState<string | null>(null);

  const cor = perfil === 'morador' ? COLORS.terracota : COLORS.azulWanessa;

  async function selecionarFoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setFotoUri(result.assets[0].uri);
  }

  async function handleCadastro() {
    setErro(null);
    const payload =
      perfil === 'morador'
        ? { nome, cpf: cpf.replace(/\D/g, ''), unidade, bloco, email, senha, confirmarSenha, aceitouTermos: aceitouTermos as true }
        : { nomeFantasia, cnpj: cnpj.replace(/\D/g, ''), nomeResponsavel, email, senha, confirmarSenha, aceitouTermos: aceitouTermos as true };

    const schema = perfil === 'morador' ? registerMoradorSchema : registerComercianteSchema;
    const resultado = schema.safeParse(payload);
    if (!resultado.success) {
      setErro(resultado.error.errors[0].message);
      return;
    }
    setCarregando(true);
    try {
      if (perfil === 'morador') {
        await authService.registrarMorador(resultado.data as any, fotoUri);
      } else {
        await authService.registrarComerciante(resultado.data as any);
      }
      router.replace('/(app)');
    } catch (e: any) {
      setErro(e.message ?? 'Erro ao cadastrar. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <ScrollView
      style={styles.wrapper}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.titulo, { color: cor }]}>Cadastro</Text>

      <View style={styles.toggle}>
        {(['morador', 'comerciante'] as Perfil[]).map(p => (
          <TouchableOpacity
            key={p}
            style={[
              styles.toggleBtn,
              perfil === p && { backgroundColor: p === 'morador' ? COLORS.terracota : COLORS.azulWanessa },
            ]}
            onPress={() => setPerfil(p)}
          >
            <Text style={[styles.toggleTexto, perfil === p && styles.toggleTextoAtivo]}>
              {p === 'morador' ? 'Morador' : 'Comércio'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {perfil === 'morador' ? (
        <>
          <TextInput style={styles.input} placeholder="Nome Completo" placeholderTextColor="#BBB" value={nome} onChangeText={setNome} />
          <TextInput
            style={styles.input}
            placeholder="CPF"
            placeholderTextColor="#BBB"
            value={cpf}
            onChangeText={v => setCpf(mascaraCPF(v))}
            keyboardType="numeric"
            maxLength={14}
          />
          <View style={styles.row}>
            <TextInput style={[styles.input, styles.inputHalf]} placeholder="Unidade" placeholderTextColor="#BBB" value={unidade} onChangeText={setUnidade} />
            <TextInput style={[styles.input, styles.inputHalf]} placeholder="Torre/Quadra" placeholderTextColor="#BBB" value={bloco} onChangeText={setBloco} />
          </View>
          <TouchableOpacity style={[styles.fotoBotao, { borderColor: cor }]} onPress={selecionarFoto}>
            <Text style={[styles.fotoTexto, { color: cor }]}>{fotoUri ? '✓ Foto selecionada' : 'Selecionar foto de perfil'}</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TextInput style={styles.input} placeholder="Nome Completo" placeholderTextColor="#BBB" value={nomeFantasia} onChangeText={setNomeFantasia} />
          <TextInput
            style={styles.input}
            placeholder="CNPJ"
            placeholderTextColor="#BBB"
            value={cnpj}
            onChangeText={v => setCnpj(mascaraCNPJ(v))}
            keyboardType="numeric"
            maxLength={18}
          />
          <TextInput style={styles.input} placeholder="Nome do Responsável" placeholderTextColor="#BBB" value={nomeResponsavel} onChangeText={setNomeResponsavel} />
        </>
      )}

      <TextInput
        style={styles.input}
        placeholder="E-mail"
        placeholderTextColor="#BBB"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <View style={styles.row}>
        <TextInput style={[styles.input, styles.inputHalf]} placeholder="Senha" placeholderTextColor="#BBB" value={senha} onChangeText={setSenha} secureTextEntry />
        <TextInput style={[styles.input, styles.inputHalf]} placeholder="Confirmar Senha" placeholderTextColor="#BBB" value={confirmarSenha} onChangeText={setConfirmarSenha} secureTextEntry />
      </View>

      {erro && <Text style={styles.erro}>{erro}</Text>}

      <TouchableOpacity
        style={[styles.botao, { backgroundColor: cor }]}
        onPress={handleCadastro}
        disabled={carregando}
      >
        {carregando
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.botaoTexto}>Criar Conta</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()}>
        <Text style={[styles.link, { color: cor }]}>
          Já possui uma conta? <Text style={{ fontWeight: 'bold' }}>Fazer Login!</Text>
        </Text>
      </TouchableOpacity>

      <Pressable style={styles.termosRow} onPress={() => setAceitouTermos(v => !v)}>
        <View style={[styles.checkbox, aceitouTermos && { backgroundColor: cor, borderColor: cor }]}>
          {aceitouTermos && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.termosTexto}>
          Concordo com Todos os Termos de Serviço e Políticas de Privacidade
        </Text>
      </Pressable>

      <Text style={styles.footer}>Easy 2026</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrapper:          { flex: 1, backgroundColor: COLORS.background },
  container:        { paddingHorizontal: 28, paddingTop: 52, paddingBottom: 32 },
  titulo:           { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 24 },
  toggle:           { flexDirection: 'row', backgroundColor: COLORS.toggleBg, borderRadius: RADIUS.pill, padding: 4, marginBottom: 20 },
  toggleBtn:        { flex: 1, paddingVertical: 10, borderRadius: RADIUS.pill, alignItems: 'center' },
  toggleTexto:      { color: COLORS.terracota, fontWeight: '600', fontSize: 14 },
  toggleTextoAtivo: { color: '#fff', fontWeight: '600', fontSize: 14 },
  row:              { flexDirection: 'row', gap: 10 },
  input:            { borderWidth: 1, borderColor: COLORS.inputBorder, borderRadius: RADIUS.sm, padding: 12, marginBottom: 12, backgroundColor: COLORS.card, fontSize: 14, color: COLORS.textPrimary },
  inputHalf:        { flex: 1 },
  fotoBotao:        { borderWidth: 1, borderRadius: RADIUS.sm, padding: 12, marginBottom: 12, alignItems: 'center' },
  fotoTexto:        { fontSize: 14 },
  erro:             { color: COLORS.error, marginBottom: 10, textAlign: 'center', fontSize: 13 },
  botao:            { borderRadius: RADIUS.pill, paddingVertical: 15, alignItems: 'center', marginBottom: 14, marginTop: 4 },
  botaoTexto:       { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  link:             { textAlign: 'center', fontSize: 13, marginBottom: 16 },
  termosRow:        { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 4 },
  checkbox:         { width: 20, height: 20, borderWidth: 1.5, borderColor: '#AAA', borderRadius: 4, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  checkmark:        { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  termosTexto:      { flex: 1, color: COLORS.textSecondary, fontSize: 12, lineHeight: 18 },
  footer:           { textAlign: 'center', color: COLORS.textMuted, fontSize: 11, marginTop: 24 },
});
