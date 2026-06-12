import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../src/services/supabaseClient';
import { useProfile } from '../../src/hooks/useProfile';
import { formatarData } from '../../src/utils/formatters';

type Aviso = { id_aviso: number; titulo: string; prioridade: string; created_at: string };

const ACESSO_RAPIDO = [
  { label: 'Reservas',        rota: '/(app)/reservas',    icone: '📅' },
  { label: 'Mural de Avisos', rota: '/(app)/avisos',      icone: '📢' },
  { label: 'Assembleias',     rota: '/(app)/assembleias', icone: '🗳️' },
  { label: 'Achados',         rota: '/(app)/achados',     icone: '🔍' },
  { label: 'Feed',            rota: '/(app)/feed',        icone: '🛍️' },
  { label: 'Pets',            rota: '/(app)/fofuras',     icone: '🐾' },
];

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
        if (data) setAvisos(data);
        setLoading(false);
      });
  }, []);

  const saudacao = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  if (loadingProfile) return <ActivityIndicator style={{ flex: 1 }} color="#8B4513" />;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.saudacao}>
          {saudacao()}, {profile?.nome?.split(' ')[0] ?? 'morador'}!
        </Text>
        {profile?.unidade && (
          <Text style={styles.unidade}>Ap. {profile.unidade} · Bloco {profile.bloco}</Text>
        )}
      </View>

      <Text style={styles.secaoTitulo}>Acesso Rápido</Text>
      <View style={styles.grid}>
        {ACESSO_RAPIDO.map(item => (
          <TouchableOpacity
            key={item.rota}
            style={styles.card}
            onPress={() => router.push(item.rota as any)}
          >
            <Text style={styles.cardIcone}>{item.icone}</Text>
            <Text style={styles.cardLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.secaoTitulo}>Avisos Recentes</Text>
      {loading
        ? <ActivityIndicator color="#8B4513" />
        : avisos.map(a => (
            <TouchableOpacity
              key={a.id_aviso}
              style={styles.avisoCard}
              onPress={() => router.push('/(app)/avisos')}
            >
              <View style={[styles.badge, styles[`badge_${a.prioridade}` as keyof typeof styles] ?? styles.badge_normal]}>
                <Text style={styles.badgeTexto}>{a.prioridade.toUpperCase()}</Text>
              </View>
              <Text style={styles.avisoTitulo}>{a.titulo}</Text>
              <Text style={styles.avisoData}>{formatarData(a.created_at)}</Text>
            </TouchableOpacity>
          ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#FAF7F4' },
  header:        { padding: 24, backgroundColor: '#8B4513' },
  saudacao:      { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  unidade:       { color: '#EDE0D4', marginTop: 4 },
  secaoTitulo:   { fontSize: 16, fontWeight: 'bold', color: '#8B4513', padding: 16, paddingBottom: 8 },
  grid:          { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12 },
  card:          { width: '30%', margin: '1.5%', backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center', elevation: 2 },
  cardIcone:     { fontSize: 28, marginBottom: 6 },
  cardLabel:     { fontSize: 12, color: '#555', textAlign: 'center' },
  avisoCard:     { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 8, borderRadius: 10, padding: 14, elevation: 1 },
  avisoTitulo:   { fontWeight: '600', color: '#333', marginTop: 4 },
  avisoData:     { color: '#999', fontSize: 12, marginTop: 4 },
  badge:         { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  badge_normal:  { backgroundColor: '#D4EDDA' },
  badge_urgente: { backgroundColor: '#F8D7DA' },
  badge_info:    { backgroundColor: '#D1ECF1' },
  badgeTexto:    { fontSize: 10, fontWeight: 'bold', color: '#333' },
});
