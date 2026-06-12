import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { forgotPasswordSchema } from '../../src/features/auth/authSchemas';
import { authService } from '../../src/features/auth/authService';
import { COLORS, RADIUS } from '../../src/constants/theme';

export default function ForgotPasswordScreen() {
  const [email,      setEmail]      = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro,       setErro]       = useState<string | null>(null);
  const [enviado,    setEnviado]    = useState(false);

  async function handleEnviar() {
    setErro(null);
    const resultado = forgotPasswordSchema.safeParse({ email });
    if (!resultado.success) {
      setErro(resultado.error.errors[0].message);
      return;
    }
    setCarregando(true);
    try {
      await authService.recuperarSenha(resultado.data);
      setEnviado(true);
    } catch (e: any) {
      setErro(e.message ?? 'Erro ao enviar. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  }

  if (enviado) {
    return (
      <View style={styles.wrapper}>
        <View style={styles.container}>
          <Text style={styles.logo}>Easy</Text>
          <Text style={styles.titulo}>E-mail enviado!</Text>
          <Text style={styles.subtitulo}>
            Verifique sua caixa de entrada e siga as instruções para redefinir a senha.
          </Text>
          <TouchableOpacity style={styles.botao} onPress={() => router.replace('/(auth)/login')}>
            <Text style={styles.botaoTexto}>Voltar ao Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.wrapper}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        <Text style={styles.logo}>Easy</Text>

        <Text style={styles.titulo}>Esqueceu sua senha?</Text>
        <Text style={styles.subtitulo}>
          Não esqueça!{'\n'}Nós estamos aqui para te ajudar.
        </Text>

        <Text style={styles.instrucao}>
          Insira o seu endereço de e-mail e lhe enviaremos instruções para redefinir sua senha.
        </Text>

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

        {erro && <Text style={styles.erro}>{erro}</Text>}

        <TouchableOpacity style={styles.botao} onPress={handleEnviar} disabled={carregando}>
          {carregando
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.botaoTexto}>Enviar</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.link}>
            Já possui uma conta? <Text style={{ fontWeight: 'bold' }}>Fazer Login!</Text>
          </Text>
        </TouchableOpacity>

        <Text style={styles.footer}>Easy 2026</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper:    { flex: 1, backgroundColor: COLORS.background },
  container:  { flexGrow: 1, paddingHorizontal: 32, paddingTop: 64, paddingBottom: 32 },
  logo:       { fontSize: 40, fontWeight: 'bold', textAlign: 'center', color: COLORS.terracota, marginBottom: 24 },
  titulo:     { fontSize: 18, fontWeight: 'bold', color: COLORS.terracota, textAlign: 'center', marginBottom: 4 },
  subtitulo:  { fontSize: 14, color: COLORS.terracota, textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  instrucao:  { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  label:      { fontSize: 13, color: COLORS.textSecondary, marginBottom: 4, marginLeft: 2 },
  input:      { borderWidth: 1, borderColor: COLORS.inputBorder, borderRadius: RADIUS.sm, padding: 13, marginBottom: 20, backgroundColor: COLORS.card, fontSize: 14, color: COLORS.textPrimary },
  erro:       { color: COLORS.error, marginBottom: 10, textAlign: 'center', fontSize: 13 },
  botao:      { backgroundColor: COLORS.terracota, borderRadius: RADIUS.pill, paddingVertical: 15, alignItems: 'center', marginBottom: 16 },
  botaoTexto: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  link:       { textAlign: 'center', color: COLORS.terracota, fontSize: 13, marginTop: 8 },
  footer:     { textAlign: 'center', color: COLORS.textMuted, fontSize: 11, marginTop: 40 },
});
