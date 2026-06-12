import { useCallback, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Linking, Switch,
} from 'react-native';
import { feedService } from '../../src/features/feed/feedService';
import { useProfile } from '../../src/hooks/useProfile';
import { formatarData } from '../../src/utils/formatters';

type Post = {
  id_postagem:  number;
  titulo:       string;
  conteudo:     string;
  is_maior18:   boolean;
  whatsapp_url?: string;
  created_at:   string;
  autor?:       { nome_fantasia: string; foto_url?: string };
  _count?:      { count: number }[];
};

export default function FeedScreen() {
  const { profile } = useProfile();
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
      <Text style={styles.autor}>{item.autor?.nome_fantasia ?? 'Comerciante'}</Text>
      <Text style={styles.titulo}>{item.titulo}</Text>
      <Text style={styles.conteudo} numberOfLines={3}>{item.conteudo}</Text>
      <View style={styles.rodape}>
        <Text style={styles.data}>{formatarData(item.created_at)}</Text>
        <View style={styles.acoes}>
          <TouchableOpacity
            style={styles.botaoAcao}
            onPress={() => feedService.curtir({ idPostagem: item.id_postagem })}
          >
            <Text>❤️ {item._count?.[0]?.count ?? 0}</Text>
          </TouchableOpacity>
          {item.whatsapp_url && (
            <TouchableOpacity
              style={[styles.botaoAcao, styles.whatsapp]}
              onPress={() => Linking.openURL(item.whatsapp_url!)}
            >
              <Text style={styles.whatsappTexto}>WhatsApp</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.filtro}>
        <Text style={styles.filtroLabel}>Conteúdo +18</Text>
        <Switch value={incluirMaior18} onValueChange={v => { setIncluirMaior18(v); recarregar(); }} />
      </View>
      <FlatList
        data={posts}
        keyExtractor={i => String(i.id_postagem)}
        renderItem={renderItem}
        onEndReached={() => carregar(pagina)}
        onEndReachedThreshold={0.3}
        onRefresh={recarregar}
        refreshing={carregando && pagina === 0}
        ListEmptyComponent={
          !carregando ? <Text style={styles.vazio}>Nenhum post ainda.</Text> : null
        }
        ListFooterComponent={carregando ? <ActivityIndicator color="#8B4513" /> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#FAF7F4' },
  filtro:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: '#EDE0D4' },
  filtroLabel:  { color: '#555' },
  card:         { backgroundColor: '#fff', margin: 8, borderRadius: 12, padding: 16, elevation: 2 },
  autor:        { color: '#8B4513', fontWeight: 'bold', marginBottom: 4 },
  titulo:       { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 6 },
  conteudo:     { color: '#666', lineHeight: 20 },
  rodape:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  data:         { color: '#999', fontSize: 12 },
  acoes:        { flexDirection: 'row', gap: 8 },
  botaoAcao:    { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, backgroundColor: '#FAF7F4' },
  whatsapp:     { backgroundColor: '#25D366' },
  whatsappTexto: { color: '#fff', fontWeight: '600', fontSize: 12 },
  vazio:        { textAlign: 'center', color: '#999', margin: 32 },
});
