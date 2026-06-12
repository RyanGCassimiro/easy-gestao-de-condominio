import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { avisosService } from '../../src/features/avisos/avisosService';
import { useRealtimeAvisos } from '../../src/hooks/useRealtime';
import { useProfile } from '../../src/hooks/useProfile';
import { formatarData } from '../../src/utils/formatters';
import { COLORS, RADIUS } from '../../src/constants/theme';

type Aviso = {
  id_aviso:   number;
  titulo:     string;
  conteudo:   string;
  prioridade: 'normal' | 'urgente' | 'info';
  created_at: string;
  lido?:      { id_usuario: string }[];
};

const BADGE: Record<string, { bg: string; text: string; label: string }> = {
  urgente: { bg: '#F8D7DA', text: '#C0392B', label: 'URGENTE' },
  info:    { bg: '#D1ECF1', text: '#0C5460', label: 'INFO' },
  normal:  { bg: '#D4EDDA', text: '#155724', label: 'NORMAL' },
};

const PRIORIDADE_ICONE: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  urgente: 'warning-outline',
  info:    'information-circle-outline',
  normal:  'checkmark-circle-outline',
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

  const renderItem = ({ item }: { item: Aviso }) => {
    const b = BADGE[item.prioridade] ?? BADGE.normal;
    const lido = isLido(item);
    return (
      <View style={[styles.card, lido && styles.cardLido]}>
        <View style={styles.cardTop}>
          <View style={[styles.badge, { backgroundColor: b.bg }]}>
            <Ionicons name={PRIORIDADE_ICONE[item.prioridade]} size={11} color={b.text} />
            <Text style={[styles.badgeTexto, { color: b.text }]}>{b.label}</Text>
          </View>
          <Text style={styles.data}>{formatarData(item.created_at)}</Text>
        </View>

        <Text style={[styles.titulo, lido && styles.tituloLido]}>{item.titulo}</Text>
        <Text style={styles.conteudo} numberOfLines={4}>{item.conteudo}</Text>

        {!lido ? (
          <TouchableOpacity style={styles.lidoBotao} onPress={() => marcarLido(item.id_aviso)}>
            <Text style={styles.lidoTexto}>Marcar como lido</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.lidoMarcaRow}>
            <Ionicons name="checkmark-circle" size={14} color={COLORS.verde} />
            <Text style={styles.lidoMarca}>Lido</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.topTitulo}>Mural de Avisos</Text>
        <Text style={styles.topSub}>Fique por dentro das novidades</Text>
      </View>

      {loading
        ? <ActivityIndicator color={COLORS.terracota} style={{ marginTop: 32 }} />
        : <FlatList
            data={avisos}
            keyExtractor={i => String(i.id_aviso)}
            renderItem={renderItem}
            onRefresh={buscar}
            refreshing={loading}
            contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
            ListEmptyComponent={(
              <View style={styles.vazioBox}>
                <Ionicons name="megaphone-outline" size={48} color={COLORS.inputBorder} />
                <Text style={styles.vazioTexto}>Nenhum aviso no momento.</Text>
              </View>
            )}
          />}
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.background },
  topBar:       { backgroundColor: COLORS.terracota, paddingTop: 56, paddingBottom: 20, paddingHorizontal: 20 },
  topTitulo:    { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  topSub:       { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 2 },

  card:         { backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: 16, marginBottom: 10, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  cardLido:     { opacity: 0.65 },
  cardTop:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  badge:        { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.pill },
  badgeTexto:   { fontSize: 10, fontWeight: 'bold' },
  data:         { color: COLORS.textMuted, fontSize: 11 },

  titulo:       { fontWeight: 'bold', fontSize: 15, color: COLORS.textPrimary, marginBottom: 6 },
  tituloLido:   { color: COLORS.textMuted },
  conteudo:     { color: COLORS.textSecondary, lineHeight: 20, fontSize: 13 },

  lidoBotao:    { alignSelf: 'flex-start', marginTop: 10, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: COLORS.toggleBg, borderRadius: RADIUS.pill },
  lidoTexto:    { color: COLORS.terracota, fontSize: 12, fontWeight: '600' },
  lidoMarcaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10 },
  lidoMarca:    { color: COLORS.verde, fontSize: 12, fontWeight: '600' },

  vazioBox:     { alignItems: 'center', marginTop: 60, gap: 12 },
  vazioTexto:   { color: COLORS.textMuted, fontSize: 14 },
});
