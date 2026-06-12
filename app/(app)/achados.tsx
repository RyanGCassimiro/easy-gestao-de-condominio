import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Image, ActivityIndicator, Modal, TextInput, Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { achadosService } from '../../src/features/achados/achadosService';
import { useProfile } from '../../src/hooks/useProfile';
import { formatarData } from '../../src/utils/formatters';
import { COLORS, RADIUS } from '../../src/constants/theme';

type Item = {
  id_item:      number;
  descricao:    string;
  local_achado: string;
  imagem_url?:  string | null;
  data_achado:  string;
  status:       string;
};

export default function AchadosScreen() {
  const { profile } = useProfile();
  const isPorteiro = profile?.perfil === 'porteiro';

  const [itens,     setItens]     = useState<Item[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [modalNovo, setModalNovo] = useState(false);
  const [itemSel,   setItemSel]   = useState<Item | null>(null);
  const [fotoUri,   setFotoUri]   = useState<string | undefined>();
  const [descricao, setDescricao] = useState('');
  const [local,     setLocal]     = useState('');
  const [data,      setData]      = useState('');
  const [nomeRet,   setNomeRet]   = useState('');
  const [docRet,    setDocRet]    = useState('');
  const [erro,      setErro]      = useState<string | null>(null);

  useEffect(() => { buscar(); }, []);

  async function buscar() {
    setLoading(true);
    const d = await achadosService.listar();
    setItens(d ?? []);
    setLoading(false);
  }

  async function selecionarFoto() {
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!r.canceled) setFotoUri(r.assets[0].uri);
  }

  async function handleRegistrar() {
    setErro(null);
    try {
      await achadosService.registrar({ descricao, localAchado: local, dataAchado: data, status: 'disponivel' }, fotoUri);
      setModalNovo(false);
      setDescricao(''); setLocal(''); setData(''); setFotoUri(undefined);
      buscar();
    } catch (e: any) { setErro(e.message); }
  }

  async function handleRetirada() {
    if (!itemSel) return;
    Alert.alert('Confirmar retirada', `${nomeRet} está retirando este item?`, [
      { text: 'Não', style: 'cancel' },
      {
        text: 'Confirmar',
        onPress: async () => {
          try {
            await achadosService.confirmarRetirada({ idItem: itemSel.id_item, nomeRetirada: nomeRet, documentoRetirada: docRet });
            setItemSel(null);
            buscar();
          } catch (e: any) { Alert.alert('Erro', e.message); }
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => require('expo-router').router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.topTitulo}>Achados e Perdidos</Text>
        {isPorteiro
          ? (
            <TouchableOpacity onPress={() => setModalNovo(true)}>
              <Ionicons name="add-circle-outline" size={24} color="#fff" />
            </TouchableOpacity>
          )
          : <View style={{ width: 24 }} />}
      </View>

      {loading
        ? <ActivityIndicator color={COLORS.terracota} style={{ marginTop: 32 }} />
        : <FlatList
            data={itens}
            numColumns={2}
            keyExtractor={i => String(i.id_item)}
            contentContainerStyle={{ padding: 10, paddingBottom: 24 }}
            onRefresh={buscar}
            refreshing={loading}
            ListEmptyComponent={(
              <View style={styles.vazioBox}>
                <Ionicons name="search-outline" size={48} color={COLORS.inputBorder} />
                <Text style={styles.vazioTexto}>Nenhum item disponível.</Text>
              </View>
            )}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.card} onPress={() => setItemSel(item)}>
                {item.imagem_url
                  ? <Image source={{ uri: item.imagem_url }} style={styles.imagem} />
                  : (
                    <View style={styles.semImagem}>
                      <Ionicons name="cube-outline" size={32} color={COLORS.inputBorder} />
                    </View>
                  )}
                <Text style={styles.desc} numberOfLines={2}>{item.descricao}</Text>
                <View style={styles.localRow}>
                  <Ionicons name="location-outline" size={11} color={COLORS.textMuted} />
                  <Text style={styles.local}>{item.local_achado}</Text>
                </View>
                <Text style={styles.data}>{formatarData(item.data_achado)}</Text>
              </TouchableOpacity>
            )}
          />}

      {/* Modal: Novo item (porteiro) */}
      <Modal visible={modalNovo} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitulo}>Registrar Item</Text>

            <TouchableOpacity style={styles.fotoBotao} onPress={selecionarFoto}>
              <Ionicons name="camera-outline" size={20} color={COLORS.terracota} />
              <Text style={styles.fotoTexto}>{fotoUri ? 'Foto selecionada ✓' : 'Adicionar foto'}</Text>
            </TouchableOpacity>

            <TextInput style={styles.input} placeholder="Descrição do item" placeholderTextColor="#BBB" value={descricao} onChangeText={setDescricao} />
            <TextInput style={styles.input} placeholder="Local onde foi achado" placeholderTextColor="#BBB" value={local} onChangeText={setLocal} />
            <TextInput style={styles.input} placeholder="Data achado (AAAA-MM-DD)" placeholderTextColor="#BBB" value={data} onChangeText={setData} />

            {erro && <Text style={styles.erro}>{erro}</Text>}
            <View style={styles.botoesRow}>
              <TouchableOpacity style={styles.cancelarBtn} onPress={() => setModalNovo(false)}>
                <Text style={styles.cancelarTexto}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmarBtn} onPress={handleRegistrar}>
                <Text style={styles.confirmarTexto}>Registrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: Detalhes */}
      <Modal visible={!!itemSel} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitulo}>{itemSel?.descricao}</Text>
            <View style={styles.detalheRow}>
              <Ionicons name="location-outline" size={14} color={COLORS.textSecondary} />
              <Text style={styles.detalheTexto}>{itemSel?.local_achado}</Text>
            </View>
            <View style={styles.detalheRow}>
              <Ionicons name="calendar-outline" size={14} color={COLORS.textSecondary} />
              <Text style={styles.detalheTexto}>{itemSel ? formatarData(itemSel.data_achado) : ''}</Text>
            </View>

            <Text style={[styles.modalTitulo, { marginTop: 16, fontSize: 14 }]}>Confirmar Retirada</Text>
            <TextInput style={styles.input} placeholder="Nome completo" placeholderTextColor="#BBB" value={nomeRet} onChangeText={setNomeRet} />
            <TextInput style={styles.input} placeholder="CPF ou RG" placeholderTextColor="#BBB" value={docRet} onChangeText={setDocRet} keyboardType="numeric" />

            <View style={styles.botoesRow}>
              <TouchableOpacity style={styles.cancelarBtn} onPress={() => setItemSel(null)}>
                <Text style={styles.cancelarTexto}>Fechar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmarBtn} onPress={handleRetirada}>
                <Text style={styles.confirmarTexto}>Confirmar Retirada</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: COLORS.background },
  topBar:         { backgroundColor: COLORS.terracota, paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topTitulo:      { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  card:           { flex: 1, backgroundColor: COLORS.card, margin: 5, borderRadius: RADIUS.md, padding: 10, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  imagem:         { width: '100%', height: 110, borderRadius: RADIUS.sm, marginBottom: 8 },
  semImagem:      { width: '100%', height: 110, backgroundColor: COLORS.toggleBg, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  desc:           { fontWeight: '600', color: COLORS.textPrimary, fontSize: 13 },
  localRow:       { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 4 },
  local:          { color: COLORS.textSecondary, fontSize: 11 },
  data:           { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },

  vazioBox:       { alignItems: 'center', marginTop: 60, gap: 12 },
  vazioTexto:     { color: COLORS.textMuted, fontSize: 14 },

  overlay:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal:          { backgroundColor: COLORS.background, borderTopLeftRadius: RADIUS.lg, borderTopRightRadius: RADIUS.lg, padding: 24, paddingBottom: 36 },
  modalHandle:    { width: 40, height: 4, backgroundColor: '#DDD', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitulo:    { fontSize: 16, fontWeight: 'bold', color: COLORS.terracota, marginBottom: 12 },
  fotoBotao:      { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: COLORS.terracota, borderRadius: RADIUS.sm, padding: 12, alignSelf: 'stretch', justifyContent: 'center', marginBottom: 12 },
  fotoTexto:      { color: COLORS.terracota, fontWeight: '600' },
  detalheRow:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  detalheTexto:   { color: COLORS.textSecondary, fontSize: 13 },
  input:          { borderWidth: 1, borderColor: COLORS.inputBorder, borderRadius: RADIUS.sm, padding: 12, marginBottom: 10, backgroundColor: COLORS.card, fontSize: 14, color: COLORS.textPrimary },
  erro:           { color: COLORS.error, marginBottom: 8, fontSize: 13 },
  botoesRow:      { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelarBtn:    { flex: 1, padding: 14, borderRadius: RADIUS.pill, borderWidth: 1, borderColor: COLORS.inputBorder, alignItems: 'center' },
  cancelarTexto:  { color: COLORS.textSecondary, fontWeight: '600' },
  confirmarBtn:   { flex: 1, padding: 14, borderRadius: RADIUS.pill, backgroundColor: COLORS.terracota, alignItems: 'center' },
  confirmarTexto: { color: '#fff', fontWeight: 'bold' },
});
