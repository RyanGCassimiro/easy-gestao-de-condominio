import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS } from '../../src/constants/theme';

const ITENS = [
  { label: 'Assembleias', sublabel: 'Pautas e votações online', rota: '/(app)/assembleias', icone: 'people-outline' as const, cor: COLORS.azulWanessa },
  { label: 'Achados e Perdidos', sublabel: 'Itens encontrados no condomínio', rota: '/(app)/achados', icone: 'search-outline' as const, cor: COLORS.mango },
  { label: 'Fofuras', sublabel: 'Pets do condomínio', rota: '/(app)/fofuras', icone: 'paw-outline' as const, cor: COLORS.verde },
];

export default function MaisScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitulo}>Mais</Text>
        <Text style={styles.headerSub}>Explore mais funcionalidades</Text>
      </View>

      <View style={styles.lista}>
        {ITENS.map(item => (
          <TouchableOpacity
            key={item.rota}
            style={styles.card}
            onPress={() => router.push(item.rota as any)}
          >
            <View style={[styles.iconeBox, { backgroundColor: item.cor + '1A' }]}>
              <Ionicons name={item.icone} size={26} color={item.cor} />
            </View>
            <View style={styles.cardTexto}>
              <Text style={styles.cardLabel}>{item.label}</Text>
              <Text style={styles.cardSublabel}>{item.sublabel}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: COLORS.background },
  header:      { backgroundColor: COLORS.terracota, paddingTop: 56, paddingBottom: 24, paddingHorizontal: 20 },
  headerTitulo: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  headerSub:   { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 2 },
  lista:       { padding: 16, gap: 10 },
  card:        { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  iconeBox:    { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cardTexto:   { flex: 1 },
  cardLabel:   { fontWeight: '600', fontSize: 15, color: COLORS.textPrimary },
  cardSublabel: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
});
