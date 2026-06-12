import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Image,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/services/supabaseClient';
import { useProfile } from '../../src/hooks/useProfile';
import { formatarData } from '../../src/utils/formatters';
import { COLORS, RADIUS } from '../../src/constants/theme';

type Aviso = { id_aviso: number; titulo: string; prioridade: string; created_at: string };

const ACESSO_RAPIDO = [
  { label: 'Feed',        rota: '/(app)/feed',        icone: 'storefront-outline' as const },
  { label: 'Reservas',    rota: '/(app)/reservas',    icone: 'calendar-outline' as const },
  { label: 'Avisos',      rota: '/(app)/avisos',      icone: 'megaphone-outline' as const },
  { label: 'Assembleias', rota: '/(app)/assembleias', icone: 'people-outline' as const },
  { label: 'Achados',     rota: '/(app)/achados',     icone: 'search-outline' as const },
  { label: 'Fofuras',     rota: '/(app)/fofuras',     icone: 'paw-outline' as const },
];

const BADGE_COLOR: Record<string, string> = {
  urgente: '#F8D7DA',
  info:    '#D1ECF1',
  normal:  '#D4EDDA',
};

export default function HomeScreen() {
  const { profile, loading: loadingProfile } = useProfile();
  const [avisos,  setAvisos]  = useState<Aviso[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('aviso')
      .select('id_aviso, titulo, prioridade, created_at')
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (data) setAvisos(data as Aviso[]);
        setLoading(false);
      });
  }, []);

  const saudacao = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  if (loadingProfile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.terracota} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          {profile?.foto_url
            ? <Image source={{ uri: profile.foto_url }} style={styles.avatar} />
            : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={28} color="#fff" />
              </View>
            )}
          <View style={styles.headerTexto}>
            <Text style={styles.ola}>Olá, bem-vindo(a)</Text>
            <Text style={styles.nome}>{profile?.nome?.split(' ')[0] ?? 'morador'}, como vai?</Text>
            {profile?.unidade && (
              <Text style={styles.unidade}>Apto {profile.unidade} - Bloco {profile.bloco}</Text>
            )}
          </View>
        </View>

        <View style={styles.acoesRow}>
          {(['chatbubble-outline', 'call-outline', 'card-outline', 'mail-outline'] as const).map((icone, i) => (
            <TouchableOpacity key={i} style={styles.acaoBotao}>
              <Ionicons name={icone} size={22} color={COLORS.terracota} />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Acesso Rápido */}
      <View style={styles.secao}>
        <Text style={styles.secaoTitulo}>Acesso rápido</Text>
        <View style={styles.grid}>
          {ACESSO_RAPIDO.map(item => (
            <TouchableOpacity
              key={item.rota}
              style={styles.gridItem}
              onPress={() => router.push(item.rota as any)}
            >
              <View style={styles.gridIcone}>
                <Ionicons name={item.icone} size={24} color={COLORS.terracota} />
              </View>
              <Text style={styles.gridLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Avisos Recentes */}
      <View style={styles.secao}>
        <Text style={styles.secaoTitulo}>Avisos recentes</Text>
        {loading
          ? <ActivityIndicator color={COLORS.terracota} />
          : avisos.length === 0
            ? <Text style={styles.vazio}>Nenhum aviso por enquanto</Text>
            : avisos.map(a => (
                <TouchableOpacity
                  key={a.id_aviso}
                  style={styles.avisoCard}
                  onPress={() => router.push('/(app)/avisos')}
                >
                  <View style={[styles.badge, { backgroundColor: BADGE_COLOR[a.prioridade] ?? BADGE_COLOR.normal }]}>
                    <Text style={styles.badgeTexto}>{a.prioridade.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.avisoTitulo}>{a.titulo}</Text>
                  <Text style={styles.avisoData}>{formatarData(a.created_at)}</Text>
                </TouchableOpacity>
              ))}
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:         { flex: 1, backgroundColor: COLORS.background },
  loadingContainer:  { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },

  // Header
  header:            { backgroundColor: COLORS.terracota, paddingTop: 56, paddingBottom: 24, paddingHorizontal: 20 },
  headerTop:         { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 14 },
  avatar:            { width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: '#fff' },
  avatarPlaceholder: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' },
  headerTexto:       { flex: 1 },
  ola:               { color: 'rgba(255,255,255,0.85)', fontSize: 13 },
  nome:              { color: '#fff', fontSize: 18, fontWeight: 'bold', marginVertical: 2 },
  unidade:           { color: 'rgba(255,255,255,0.85)', fontSize: 13 },
  acoesRow:          { flexDirection: 'row', justifyContent: 'space-around' },
  acaoBotao:         { width: 52, height: 52, borderRadius: 26, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },

  // Seções
  secao:             { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  secaoTitulo:       { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 12 },

  // Grid acesso rápido
  grid:              { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridItem:          { width: '30%', alignItems: 'center', gap: 6 },
  gridIcone:         { width: 56, height: 56, borderRadius: 16, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  gridLabel:         { fontSize: 12, color: COLORS.textSecondary, textAlign: 'center' },

  // Avisos
  vazio:             { color: COLORS.textMuted, fontSize: 14, textAlign: 'center', paddingVertical: 16 },
  avisoCard:         { backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: 14, marginBottom: 8, elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  badge:             { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginBottom: 6 },
  badgeTexto:        { fontSize: 10, fontWeight: 'bold', color: '#333' },
  avisoTitulo:       { fontWeight: '600', color: COLORS.textPrimary, fontSize: 14 },
  avisoData:         { color: COLORS.textMuted, fontSize: 12, marginTop: 4 },
});
