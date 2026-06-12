import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Switch,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { loginSchema } from '../../src/features/auth/authSchemas';
import { authService } from '../../src/features/auth/authService';
import { COLORS, RADIUS } from '../../src/constants/theme';

type Perfil = 'morador' | 'comerciante';

export default function LoginScreen() {
  const [perfil,     setPerfil]     = useState<Perfil>('morador');
  const [email,      setEmail]      = useState('');
  const [senha,      setSenha]      = useState('');
  const [lembrar,    setLembrar]    = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro,       setErro]       = useState<string | null>(null);

  const cor = perfil === 'morador' ? COLORS.terracota : COLORS.azulWanessa;

  async function handleLogin() {
    setErro(null);
    const resultado = loginSchema.safeParse({ email, senha, perfil });
    if (!resultado.success) {
      setErro(resultado.error.errors[0].message);
      return;
    }
    setCarregando(true);
    try {
      await authService.login(resultado.data);
      await SecureStore.setItemAsync('lembrar_sessao', lembrar ? 'true' : 'false');
      router.replace('/(app)');
    } catch (e: any) {
      setErro(e.message ?? 'Erro ao fazer login. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.wrapper}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        <Text style={[styles.logo, { color: cor }]}>Easy</Text>
        <Text style={[styles.tagline, { color: cor }]}>
          nunca foi tão fácil se conectar com pessoas
        </Text>

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

        <Text style={styles.label}>E-mail</Text>
        <TextInput
          style={styles.input}
          placeholder="nome@exemplo.com"
          placeholderTextColor="#BBB"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />

        <Text style={styles.label}>Senha</Text>
        <TextInput
          style={styles.input}
          placeholder="Senha"
          placeholderTextColor="#BBB"
          value={senha}
          onChangeText={setSenha}
          secureTextEntry
        />

        {erro && <Text style={styles.erro}>{erro}</Text>}

        <TouchableOpacity
          style={[styles.botao, { backgroundColor: cor }]}
          onPress={handleLogin}
          disabled={carregando}
        >
          {carregando
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.botaoTexto}>Entrar</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
          <Text style={[styles.link, { color: cor }]}>Esqueci minha senha</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
          <Text style={[styles.link, { color: cor }]}>
            Não possui conta? <Text style={{ fontWeight: 'bold' }}>Criar Conta!</Text>
          </Text>
        </TouchableOpacity>

        <View style={styles.lembrarRow}>
          <Switch
            value={lembrar}
            onValueChange={setLembrar}
            trackColor={{ true: cor }}
            thumbColor="#fff"
          />
          <Text style={styles.lembrarTexto}>Lembrar-me</Text>
        </View>

        <Text style={styles.footer}>Easy 2026</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper:          { flex: 1, backgroundColor: COLORS.background },
  container:        { flexGrow: 1, paddingHorizontal: 32, paddingTop: 64, paddingBottom: 32 },
  logo:             { fontSize: 40, fontWeight: 'bold', textAlign: 'center', marginBottom: 4 },
  tagline:          { fontSize: 13, textAlign: 'center', marginBottom: 32 },
  toggle:           { flexDirection: 'row', backgroundColor: COLORS.toggleBg, borderRadius: RADIUS.pill, padding: 4, marginBottom: 28 },
  toggleBtn:        { flex: 1, paddingVertical: 10, borderRadius: RADIUS.pill, alignItems: 'center' },
  toggleTexto:      { color: COLORS.terracota, fontWeight: '600', fontSize: 14 },
  toggleTextoAtivo: { color: '#fff', fontWeight: '600', fontSize: 14 },
  label:            { fontSize: 13, color: COLORS.textSecondary, marginBottom: 4, marginLeft: 2 },
  input:            { borderWidth: 1, borderColor: COLORS.inputBorder, borderRadius: RADIUS.sm, padding: 13, marginBottom: 16, backgroundColor: COLORS.card, fontSize: 14, color: COLORS.textPrimary },
  erro:             { color: COLORS.error, marginBottom: 10, textAlign: 'center', fontSize: 13 },
  botao:            { borderRadius: RADIUS.pill, paddingVertical: 15, alignItems: 'center', marginBottom: 16, marginTop: 4 },
  botaoTexto:       { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  link:             { textAlign: 'center', marginTop: 8, fontSize: 13 },
  lembrarRow:       { flexDirection: 'row', alignItems: 'center', marginTop: 20, gap: 8 },
  lembrarTexto:     { color: COLORS.textSecondary, fontSize: 13 },
  footer:           { textAlign: 'center', color: COLORS.textMuted, fontSize: 11, marginTop: 40 },
});
