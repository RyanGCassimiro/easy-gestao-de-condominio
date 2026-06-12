import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { forgotPasswordSchema } from '../../src/features/auth/authSchemas';
import { authService } from '../../src/features/auth/authService';

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
      <View style={styles.container}>
        <Text style={styles.titulo}>E-mail enviado!</Text>
        <Text style={styles.subtitulo}>
          Verifique sua caixa de entrada e siga as instruções para redefinir a senha.
          O link expira em 1 hora.
        </Text>
        <TouchableOpacity style={styles.botao} onPress={() => router.replace('/(auth)/login')}>
          <Text style={styles.botaoTexto}>Voltar ao Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.titulo}>Recuperar Senha</Text>
      <Text style={styles.subtitulo}>
        Informe seu e-mail cadastrado. Enviaremos um link para redefinir sua senha.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="E-mail"
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
          : <Text style={styles.botaoTexto}>Enviar Link</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.link}>Voltar ao Login</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#FAF7F4' },
  titulo:     { fontSize: 24, fontWeight: 'bold', color: '#8B4513', textAlign: 'center', marginBottom: 12 },
  subtitulo:  { color: '#666', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  input:      { borderWidth: 1, borderColor: '#D4A990', borderRadius: 8, padding: 12, marginBottom: 12, backgroundColor: '#fff' },
  erro:       { color: '#C0392B', marginBottom: 8, textAlign: 'center' },
  botao:      { backgroundColor: '#8B4513', borderRadius: 8, padding: 14, alignItems: 'center', marginBottom: 12 },
  botaoTexto: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  link:       { color: '#8B4513', textAlign: 'center', marginTop: 8, textDecorationLine: 'underline' },
});
