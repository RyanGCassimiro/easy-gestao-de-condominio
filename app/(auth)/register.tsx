import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Switch,
} from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  registerMoradorSchema,
  registerComercianteSchema,
} from '../../src/features/auth/authSchemas';
import { authService } from '../../src/features/auth/authService';
import { mascaraCPF, mascaraCNPJ } from '../../src/utils/formatters';

type Perfil = 'morador' | 'comerciante';

export default function RegisterScreen() {
  const [perfil,           setPerfil]           = useState<Perfil>('morador');
  const [nome,             setNome]             = useState('');
  const [cpf,              setCpf]              = useState('');
  const [cnpj,             setCnpj]             = useState('');
  const [nomeFantasia,     setNomeFantasia]     = useState('');
  const [nomeResponsavel,  setNomeResponsavel]  = useState('');
  const [unidade,          setUnidade]          = useState('');
  const [bloco,            setBloco]            = useState('');
  const [email,            setEmail]            = useState('');
  const [senha,            setSenha]            = useState('');
  const [confirmarSenha,   setConfirmarSenha]   = useState('');
  const [aceitouTermos,    setAceitouTermos]    = useState(false);
  const [fotoUri,          setFotoUri]          = useState<string | undefined>();
  const [carregando,       setCarregando]       = useState(false);
  const [erro,             setErro]             = useState<string | null>(null);

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
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.titulo}>Criar Conta</Text>

      <View style={styles.toggle}>
        {(['morador', 'comerciante'] as Perfil[]).map(p => (
          <TouchableOpacity
            key={p}
            style={[styles.toggleBtn, perfil === p && styles.toggleAtivo]}
            onPress={() => setPerfil(p)}
          >
            <Text style={perfil === p ? styles.toggleTextoAtivo : styles.toggleTexto}>
              {p === 'morador' ? 'Morador' : 'Comerciante'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {perfil === 'morador' ? (
        <>
          <TextInput style={styles.input} placeholder="Nome completo" value={nome} onChangeText={setNome} />
          <TextInput
            style={styles.input}
            placeholder="CPF"
            value={cpf}
            onChangeText={v => setCpf(mascaraCPF(v))}
            keyboardType="numeric"
            maxLength={14}
          />
          <TextInput style={styles.input} placeholder="Unidade (ex: 101)" value={unidade} onChangeText={setUnidade} />
          <TextInput style={styles.input} placeholder="Bloco (ex: A)" value={bloco} onChangeText={setBloco} />
          <TouchableOpacity style={styles.fotoBotao} onPress={selecionarFoto}>
            <Text style={styles.fotoTexto}>{fotoUri ? 'Foto selecionada' : 'Selecionar foto de perfil'}</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TextInput style={styles.input} placeholder="Nome Fantasia" value={nomeFantasia} onChangeText={setNomeFantasia} />
          <TextInput
            style={styles.input}
            placeholder="CNPJ"
            value={cnpj}
            onChangeText={v => setCnpj(mascaraCNPJ(v))}
            keyboardType="numeric"
            maxLength={18}
          />
          <TextInput style={styles.input} placeholder="Nome do responsável" value={nomeResponsavel} onChangeText={setNomeResponsavel} />
        </>
      )}

      <TextInput
        style={styles.input}
        placeholder="E-mail"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput style={styles.input} placeholder="Senha" value={senha} onChangeText={setSenha} secureTextEntry />
      <TextInput style={styles.input} placeholder="Confirmar senha" value={confirmarSenha} onChangeText={setConfirmarSenha} secureTextEntry />

      <View style={styles.termosRow}>
        <Switch value={aceitouTermos} onValueChange={setAceitouTermos} />
        <Text style={styles.termosTexto}>Aceito os Termos de Uso e Política de Privacidade</Text>
      </View>

      {erro && <Text style={styles.erro}>{erro}</Text>}

      <TouchableOpacity style={styles.botao} onPress={handleCadastro} disabled={carregando}>
        {carregando
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.botaoTexto}>Cadastrar</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.link}>Já tenho conta. Fazer Login</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:        { padding: 24, backgroundColor: '#FAF7F4', flexGrow: 1 },
  titulo:           { fontSize: 24, fontWeight: 'bold', color: '#8B4513', textAlign: 'center', marginBottom: 24, marginTop: 16 },
  toggle:           { flexDirection: 'row', backgroundColor: '#EDE0D4', borderRadius: 8, marginBottom: 20 },
  toggleBtn:        { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  toggleAtivo:      { backgroundColor: '#8B4513' },
  toggleTexto:      { color: '#8B4513', fontWeight: '600' },
  toggleTextoAtivo: { color: '#fff', fontWeight: '600' },
  input:            { borderWidth: 1, borderColor: '#D4A990', borderRadius: 8, padding: 12, marginBottom: 12, backgroundColor: '#fff' },
  fotoBotao:        { borderWidth: 1, borderColor: '#8B4513', borderRadius: 8, padding: 12, marginBottom: 12, alignItems: 'center' },
  fotoTexto:        { color: '#8B4513' },
  termosRow:        { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 8 },
  termosTexto:      { flex: 1, color: '#555', fontSize: 13 },
  erro:             { color: '#C0392B', marginBottom: 8, textAlign: 'center' },
  botao:            { backgroundColor: '#8B4513', borderRadius: 8, padding: 14, alignItems: 'center', marginBottom: 12 },
  botaoTexto:       { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  link:             { color: '#8B4513', textAlign: 'center', marginTop: 8, textDecorationLine: 'underline' },
});
