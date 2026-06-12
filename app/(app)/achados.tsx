import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Image, ActivityIndicator, Modal, TextInput, Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { achadosService } from '../../src/features/achados/achadosService';
import { useProfile } from '../../src/hooks/useProfile';
import { formatarData } from '../../src/utils/formatters';

type Item = {
  id_item:     number;
  descricao:   string;
  local_achado: string;
  imagem_url?: string;
  data_achado: string;
  status:      string;
};

export default function AchadosScreen() {
  const { profile } = useProfile();
  const isPorteiro = profile?.perfil === 'porteiro';

  const [itens,      setItens]      = useState<Item[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [modalNovo,  setModalNovo]  = useState(false);
  const [itemSel,    setItemSel]    = useState<Item | null>(null);
  const [fotoUri,    setFotoUri]    = useState<string | undefined>();
  const [descricao,  setDescricao]  = useState('');
  const [local,      setLocal]      = useState('');
  const [data,       setData]       = useState('');
  const [nomeRet,    setNomeRet]    = useState('');
  const [docRet,     setDocRet]     = useState('');
  const [erro,       setErro]       = useState<string | null>(null);

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
      {isPorteiro && (
        <TouchableOpacity style={styles.novaBotao} onPress={() => setModalNovo(true)}>
          <Text style={styles.novaBotaoTexto}>+ Registrar Item Achado</Text>
        </TouchableOpacity>
      )}

      {loading
        ? <ActivityIndicator color="#8B4513" style={{ marginTop: 32 }} />
        : <FlatList
            data={itens}
            numColumns={2}
            keyExtractor={i => String(i.id_item)}
            contentContainerStyle={{ padding: 8 }}
            ListEmptyComponent={<Text style={styles.vazio}>Nenhum item disponível.</Text>}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.card} onPress={() => setItemSel(item)}>
                {item.imagem_url
                  ? <Image source={{ uri: item.imagem_url }} style={styles.imagem} />
                  : <View style={styles.semImagem}><Text>📦</Text></View>}
                <Text style={styles.desc} numberOfLines={2}>{item.descricao}</Text>
                <Text style={styles.local}>{item.local_achado}</Text>
                <Text style={styles.data}>{formatarData(item.data_achado)}</Text>
              </TouchableOpacity>
            )}
          />}

      {/* Modal: Novo item (porteiro) */}
      <Modal visible={modalNovo} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitulo}>Registrar Item</Text>
            <TouchableOpacity style={styles.fotoBotao} onPress={selecionarFoto}>
              <Text>{fotoUri ? 'Foto selecionada ✓' : 'Adicionar foto'}</Text>
            </TouchableOpacity>
            <TextInput style={styles.input} placeholder="Descrição" value={descricao} onChangeText={setDescricao} />
            <TextInput style={styles.input} placeholder="Local onde foi achado" value={local} onChangeText={setLocal} />
            <TextInput style={styles.input} placeholder="Data achado (AAAA-MM-DD)" value={data} onChangeText={setData} />
            {erro && <Text style={styles.erro}>{erro}</Text>}
            <View style={styles.botoesRow}>
              <TouchableOpacity style={styles.cancelarBtn} onPress={() => setModalNovo(false)}><Text>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={styles.confirmarBtn} onPress={handleRegistrar}><Text style={{ color: '#fff', fontWeight: 'bold' }}>Registrar</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: Detalhes / Solicitar retirada */}
      <Modal visible={!!itemSel} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitulo}>{itemSel?.descricao}</Text>
            <Text style={styles.modalInfo}>Local: {itemSel?.local_achado}</Text>
            <Text style={styles.modalInfo}>Data: {itemSel ? formatarData(itemSel.data_achado) : ''}</Text>

            <Text style={[styles.modalTitulo, { marginTop: 16 }]}>Confirmar Retirada</Text>
            <TextInput style={styles.input} placeholder="Nome completo" value={nomeRet} onChangeText={setNomeRet} />
            <TextInput style={styles.input} placeholder="CPF ou RG" value={docRet} onChangeText={setDocRet} keyboardType="numeric" />

            <View style={styles.botoesRow}>
              <TouchableOpacity style={styles.cancelarBtn} onPress={() => setItemSel(null)}><Text>Fechar</Text></TouchableOpacity>
              <TouchableOpacity style={styles.confirmarBtn} onPress={handleRetirada}><Text style={{ color: '#fff', fontWeight: 'bold' }}>Confirmar Retirada</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#FAF7F4' },
  novaBotao:     { backgroundColor: '#8B4513', margin: 16, borderRadius: 8, padding: 14, alignItems: 'center' },
  novaBotaoTexto: { color: '#fff', fontWeight: 'bold' },
  card:          { flex: 1, backgroundColor: '#fff', margin: 6, borderRadius: 12, padding: 10, elevation: 2 },
  imagem:        { width: '100%', height: 100, borderRadius: 8, marginBottom: 8 },
  semImagem:     { width: '100%', height: 100, backgroundColor: '#EDE0D4', borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  desc:          { fontWeight: '600', color: '#333', fontSize: 13 },
  local:         { color: '#666', fontSize: 12, marginTop: 2 },
  data:          { color: '#999', fontSize: 11, marginTop: 2 },
  vazio:         { textAlign: 'center', color: '#999', margin: 32 },
  overlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal:         { backgroundColor: '#FAF7F4', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitulo:   { fontSize: 16, fontWeight: 'bold', color: '#8B4513', marginBottom: 8 },
  modalInfo:     { color: '#555', marginBottom: 4 },
  fotoBotao:     { borderWidth: 1, borderColor: '#8B4513', borderRadius: 8, padding: 12, alignItems: 'center', marginBottom: 12 },
  input:         { borderWidth: 1, borderColor: '#D4A990', borderRadius: 8, padding: 12, marginBottom: 10, backgroundColor: '#fff' },
  erro:          { color: '#C0392B', marginBottom: 8 },
  botoesRow:     { flexDirection: 'row', gap: 10 },
  cancelarBtn:   { flex: 1, padding: 14, borderRadius: 8, borderWidth: 1, borderColor: '#D4A990', alignItems: 'center' },
  confirmarBtn:  { flex: 1, padding: 14, borderRadius: 8, backgroundColor: '#8B4513', alignItems: 'center' },
});
