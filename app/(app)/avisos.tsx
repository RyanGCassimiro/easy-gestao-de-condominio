import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { avisosService } from '../../src/features/avisos/avisosService';
import { useRealtimeAvisos } from '../../src/hooks/useRealtime';
import { useProfile } from '../../src/hooks/useProfile';
import { formatarData } from '../../src/utils/formatters';

type Aviso = {
  id_aviso:   number;
  titulo:     string;
  conteudo:   string;
  prioridade: 'normal' | 'urgente' | 'info';
  created_at: string;
  lido?:      { id_usuario: string }[];
};

const COR_BADGE: Record<string, string> = {
  normal:  '#D4EDDA',
  urgente: '#F8D7DA',
  info:    '#D1ECF1',
};

export default function MuralScreen() {
  const { profile } = useProfile();
  const [avisos,  setAvisos]  = useState<Aviso[]>([]);
  const [loading, setLoading] = useState(true);

  async function buscar() {
    setLoading(true);
    const data = await avisosService.listar();
    setAvisos(data ?? []);
    setLoading(false);
  }

  useEffect(() => { buscar(); }, []);

  // Novos avisos chegam em tempo real
  useRealtimeAvisos(0, () => buscar());

  async function marcarLido(id: number) {
    await avisosService.marcarLido({ idAviso: id });
    setAvisos(prev =>
      prev.map(a =>
        a.id_aviso === id
          ? { ...a, lido: [...(a.lido ?? []), { id_usuario: profile?.id_usuario ?? '' }] }
          : a,
      ),
    );
  }

  const isLido = (aviso: Aviso) =>
    aviso.lido?.some(l => l.id_usuario === profile?.id_usuario) ?? false;

  const renderItem = ({ item }: { item: Aviso }) => (
    <View style={[styles.card, isLido(item) && styles.cardLido]}>
      <View style={[styles.badge, { backgroundColor: COR_BADGE[item.prioridade] }]}>
        <Text style={styles.badgeTexto}>{item.prioridade.toUpperCase()}</Text>
      </View>
      <Text style={styles.titulo}>{item.titulo}</Text>
      <Text style={styles.conteudo} numberOfLines={4}>{item.conteudo}</Text>
      <View style={styles.rodape}>
        <Text style={styles.data}>{formatarData(item.created_at)}</Text>
        {!isLido(item) && (
          <TouchableOpacity style={styles.lidoBotao} onPress={() => marcarLido(item.id_aviso)}>
            <Text style={styles.lidoTexto}>Marcar como lido</Text>
          </TouchableOpacity>
        )}
        {isLido(item) && <Text style={styles.lidoMarca}>✓ Lido</Text>}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading
        ? <ActivityIndicator color="#8B4513" style={{ marginTop: 32 }} />
        : <FlatList
            data={avisos}
            keyExtractor={i => String(i.id_aviso)}
            renderItem={renderItem}
            onRefresh={buscar}
            refreshing={loading}
            contentContainerStyle={{ padding: 12 }}
            ListEmptyComponent={<Text style={styles.vazio}>Nenhum aviso no momento.</Text>}
          />}
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#FAF7F4' },
  card:       { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10, elevation: 2 },
  cardLido:   { opacity: 0.6 },
  badge:      { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginBottom: 8 },
  badgeTexto: { fontSize: 10, fontWeight: 'bold', color: '#333' },
  titulo:     { fontWeight: 'bold', fontSize: 15, color: '#333', marginBottom: 6 },
  conteudo:   { color: '#666', lineHeight: 20 },
  rodape:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  data:       { color: '#999', fontSize: 12 },
  lidoBotao:  { padding: 6, backgroundColor: '#EDE0D4', borderRadius: 6 },
  lidoTexto:  { color: '#8B4513', fontSize: 12, fontWeight: '600' },
  lidoMarca:  { color: '#27AE60', fontSize: 12 },
  vazio:      { textAlign: 'center', color: '#999', margin: 32 },
});
