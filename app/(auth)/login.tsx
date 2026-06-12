import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Switch,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { loginSchema } from '../../src/features/auth/authSchemas';
import { authService } from '../../src/features/auth/authService';

export default function LoginScreen() {
  const [perfil,     setPerfil]     = useState<'morador' | 'comerciante'>('morador');
  const [email,      setEmail]      = useState('');
  const [senha,      setSenha]      = useState('');
  const [lembrar,    setLembrar]    = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro,       setErro]       = useState<string | null>(null);

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
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.titulo}>EASY CORE</Text>

      <View style={styles.toggle}>
        <TouchableOpacity
          style={[styles.toggleBtn, perfil === 'morador' && styles.toggleAtivo]}
          onPress={() => setPerfil('morador')}
        >
          <Text style={perfil === 'morador' ? styles.toggleTextoAtivo : styles.toggleTexto}>
            Morador
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, perfil === 'comerciante' && styles.toggleAtivo]}
          onPress={() => setPerfil('comerciante')}
        >
          <Text style={perfil === 'comerciante' ? styles.toggleTextoAtivo : styles.toggleTexto}>
            Comércio
          </Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.input}
        placeholder="E-mail"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />
      <TextInput
        style={styles.input}
        placeholder="Senha"
        value={senha}
        onChangeText={setSenha}
        secureTextEntry
      />

      {erro && <Text style={styles.erro}>{erro}</Text>}

      <TouchableOpacity style={styles.botao} onPress={handleLogin} disabled={carregando}>
        {carregando
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.botaoTexto}>Entrar</Text>}
      </TouchableOpacity>

      <View style={styles.lembrarRow}>
        <Switch value={lembrar} onValueChange={setLembrar} />
        <Text style={styles.lembrarTexto}>Lembrar-me</Text>
      </View>

      <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
        <Text style={styles.link}>Esqueci minha senha</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
        <Text style={styles.link}>Não possui conta? Criar Conta!</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#FAF7F4' },
  titulo:          { fontSize: 28, fontWeight: 'bold', color: '#8B4513', textAlign: 'center', marginBottom: 32 },
  toggle:          { flexDirection: 'row', backgroundColor: '#EDE0D4', borderRadius: 8, marginBottom: 24 },
  toggleBtn:       { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  toggleAtivo:     { backgroundColor: '#8B4513' },
  toggleTexto:     { color: '#8B4513', fontWeight: '600' },
  toggleTextoAtivo: { color: '#fff', fontWeight: '600' },
  input:           { borderWidth: 1, borderColor: '#D4A990', borderRadius: 8, padding: 12, marginBottom: 12, backgroundColor: '#fff' },
  erro:            { color: '#C0392B', marginBottom: 8, textAlign: 'center' },
  botao:           { backgroundColor: '#8B4513', borderRadius: 8, padding: 14, alignItems: 'center', marginBottom: 12 },
  botaoTexto:      { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  lembrarRow:      { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  lembrarTexto:    { marginLeft: 8, color: '#555' },
  link:            { color: '#8B4513', textAlign: 'center', marginTop: 8, textDecorationLine: 'underline' },
});
