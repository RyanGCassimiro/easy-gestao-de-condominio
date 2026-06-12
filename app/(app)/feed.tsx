import { useCallback, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Linking, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { feedService } from '../../src/features/feed/feedService';
import { formatarData } from '../../src/utils/formatters';
import { COLORS, RADIUS } from '../../src/constants/theme';

type Post = {
  id_postagem:  number;
  titulo:       string;
  conteudo:     string;
  is_maior18:   boolean;
  whatsapp_url?: string | null;
  created_at:   string;
  autor?:       { nome_fantasia: string | null; foto_url?: string | null };
  _count?:      { count: number }[];
};

export default function FeedScreen() {
  const [posts,          setPosts]          = useState<Post[]>([]);
  const [pagina,         setPagina]         = useState(0);
  const [carregando,     setCarregando]     = useState(false);
  const [semMais,        setSemMais]        = useState(false);
  const [incluirMaior18, setIncluirMaior18] = useState(false);

  const carregar = useCallback(async (pag = 0, reset = false) => {
    if (carregando || semMais) return;
    setCarregando(true);
    try {
      const data = await feedService.listar({ pagina: pag, tamanhoPagina: 20, incluirMaior18 });
      setPosts(prev => reset ? data : [...prev, ...data]);
      if (data.length < 20) setSemMais(true);
      setPagina(pag + 1);
    } finally {
      setCarregando(false);
    }
  }, [carregando, semMais, incluirMaior18]);

  const recarregar = () => { setSemMais(false); carregar(0, true); };

  const renderItem = ({ item }: { item: Post }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarLetra}>
            {(item.autor?.nome_fantasia ?? 'C')[0].toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.autor}>{item.autor?.nome_fantasia ?? 'Comerciante'}</Text>
          <Text style={styles.data}>{formatarData(item.created_at)}</Text>
        </View>
        {item.is_maior18 && (
          <View style={styles.badge18}>
            <Text style={styles.badge18Texto}>+18</Text>
          </View>
        )}
      </View>

      <Text style={styles.titulo}>{item.titulo}</Text>
      <Text style={styles.conteudo} numberOfLines={4}>{item.conteudo}</Text>

      <View style={styles.rodape}>
        <TouchableOpacity
          style={styles.curtirBtn}
          onPress={() => feedService.curtir({ idPostagem: item.id_postagem })}
        >
          <Ionicons name="heart-outline" size={16} color={COLORS.terracota} />
          <Text style={styles.curtirTexto}>{item._count?.[0]?.count ?? 0}</Text>
        </TouchableOpacity>

        {item.whatsapp_url && (
          <TouchableOpacity
            style={styles.whatsappBtn}
            onPress={() => Linking.openURL(item.whatsapp_url!)}
          >
            <Ionicons name="logo-whatsapp" size={14} color="#fff" />
            <Text style={styles.whatsappTexto}>Contato</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.topTitulo}>Feed da Comunidade</Text>
        <View style={styles.filtroRow}>
          <Text style={styles.filtroLabel}>Conteúdo +18</Text>
          <Switch
            value={incluirMaior18}
            onValueChange={v => { setIncluirMaior18(v); recarregar(); }}
            trackColor={{ true: COLORS.terracota }}
            thumbColor="#fff"
          />
        </View>
      </View>

      <FlatList
        data={posts}
        keyExtractor={i => String(i.id_postagem)}
        renderItem={renderItem}
        onEndReached={() => carregar(pagina)}
        onEndReachedThreshold={0.3}
        onRefresh={recarregar}
        refreshing={carregando && pagina === 0}
        contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
        ListEmptyComponent={
          !carregando
            ? (
              <View style={styles.vazioBox}>
                <Ionicons name="storefront-outline" size={48} color={COLORS.inputBorder} />
                <Text style={styles.vazioTexto}>Nenhum post ainda.</Text>
              </View>
            )
            : null
        }
        ListFooterComponent={carregando ? <ActivityIndicator color={COLORS.terracota} style={{ marginVertical: 16 }} /> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.background },

  topBar:       { backgroundColor: COLORS.terracota, paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20 },
  topTitulo:    { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  filtroRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  filtroLabel:  { color: 'rgba(255,255,255,0.9)', fontSize: 13 },

  card:         { backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: 16, marginBottom: 10, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  cardHeader:   { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  avatarCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.toggleBg, alignItems: 'center', justifyContent: 'center' },
  avatarLetra:  { color: COLORS.terracota, fontWeight: 'bold', fontSize: 16 },
  autor:        { fontWeight: '600', color: COLORS.terracota, fontSize: 13 },
  data:         { color: COLORS.textMuted, fontSize: 11 },
  badge18:      { backgroundColor: '#F8D7DA', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badge18Texto: { fontSize: 10, fontWeight: 'bold', color: '#C0392B' },
  titulo:       { fontSize: 15, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 6 },
  conteudo:     { color: COLORS.textSecondary, lineHeight: 20, fontSize: 13 },
  rodape:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, gap: 8 },
  curtirBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.pill, backgroundColor: COLORS.background },
  curtirTexto:  { color: COLORS.terracota, fontWeight: '600', fontSize: 12 },
  whatsappBtn:  { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#25D366', paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.pill },
  whatsappTexto: { color: '#fff', fontWeight: '600', fontSize: 12 },

  vazioBox:     { alignItems: 'center', marginTop: 60, gap: 12 },
  vazioTexto:   { color: COLORS.textMuted, fontSize: 14 },
});
