import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Image, Modal, TextInput, Switch, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { fofurasService } from '../../src/features/fofuras/fofurasService';
import { petSchema } from '../../src/features/fofuras/fofurasSchemas';

type Pet = {
  id_dependente: number;
  nome:    string;
  raca:    string;
  especie: string;
  imagem_url?: string;
};

type Especie = 'cachorro' | 'gato' | 'ave' | 'outro';
const ESPECIES: Especie[] = ['cachorro', 'gato', 'ave', 'outro'];

export default function FofurasScreen() {
  const [pets,       setPets]       = useState<Pet[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [modalOpen,  setModalOpen]  = useState(false);
  const [editando,   setEditando]   = useState<Pet | null>(null);
  const [nome,       setNome]       = useState('');
  const [raca,       setRaca]       = useState('');
  const [especie,    setEspecie]    = useState<Especie>('cachorro');
  const [dataNasc,   setDataNasc]   = useState('');
  const [obs,        setObs]        = useState('');
  const [fotoUri,    setFotoUri]    = useState<string | undefined>();
  const [lgpd,       setLgpd]       = useState(false);
  const [erro,       setErro]       = useState<string | null>(null);

  useEffect(() => { buscar(); }, []);

  async function buscar() {
    setLoading(true);
    const d = await fofurasService.listar();
    setPets(d ?? []);
    setLoading(false);
  }

  function abrirModal(pet?: Pet) {
    setEditando(pet ?? null);
    setNome(pet?.nome ?? '');
    setRaca(pet?.raca ?? '');
    setEspecie((pet?.especie as Especie) ?? 'cachorro');
    setDataNasc('');
    setObs('');
    setFotoUri(undefined);
    setLgpd(false);
    setErro(null);
    setModalOpen(true);
  }

  async function selecionarFoto() {
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!r.canceled) setFotoUri(r.assets[0].uri);
  }

  async function handleSalvar() {
    setErro(null);
    const payload = { nome, raca, especie, dataNasc: dataNasc || undefined, observacao: obs || undefined, consentimentoLGPD: lgpd as true };
    const resultado = petSchema.safeParse(payload);
    if (!resultado.success) { setErro(resultado.error.errors[0].message); return; }
    try {
      if (editando) {
        await fofurasService.editar({ ...resultado.data, idPet: editando.id_dependente }, fotoUri);
      } else {
        await fofurasService.cadastrar(resultado.data, fotoUri);
      }
      setModalOpen(false);
      buscar();
    } catch (e: any) { setErro(e.message); }
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.novaBotao} onPress={() => abrirModal()}>
        <Text style={styles.novaBotaoTexto}>+ Cadastrar Pet</Text>
      </TouchableOpacity>

      {loading
        ? <ActivityIndicator color="#8B4513" style={{ marginTop: 32 }} />
        : <FlatList
            data={pets}
            numColumns={2}
            keyExtractor={i => String(i.id_dependente)}
            contentContainerStyle={{ padding: 8 }}
            onRefresh={buscar}
            refreshing={loading}
            ListEmptyComponent={<Text style={styles.vazio}>Nenhum pet cadastrado ainda.</Text>}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.card} onPress={() => abrirModal(item)}>
                {item.imagem_url
                  ? <Image source={{ uri: item.imagem_url }} style={styles.foto} />
                  : <View style={styles.semFoto}><Text style={{ fontSize: 40 }}>🐾</Text></View>}
                <Text style={styles.petNome}>{item.nome}</Text>
                <Text style={styles.petRaca}>{item.raca}</Text>
                <Text style={styles.petEspecie}>{item.especie}</Text>
              </TouchableOpacity>
            )}
          />}

      <Modal visible={modalOpen} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitulo}>{editando ? 'Editar Pet' : 'Cadastrar Pet'}</Text>

            <TouchableOpacity style={styles.fotoBotao} onPress={selecionarFoto}>
              {fotoUri
                ? <Image source={{ uri: fotoUri }} style={styles.fotoPreview} />
                : <Text>📷 Adicionar foto</Text>}
            </TouchableOpacity>

            <TextInput style={styles.input} placeholder="Nome do pet" value={nome} onChangeText={setNome} />
            <TextInput style={styles.input} placeholder="Raça" value={raca} onChangeText={setRaca} />

            <Text style={styles.label}>Espécie</Text>
            <View style={styles.especieRow}>
              {ESPECIES.map(e => (
                <TouchableOpacity
                  key={e}
                  style={[styles.especieBtn, especie === e && styles.especieSelecionada]}
                  onPress={() => setEspecie(e)}
                >
                  <Text style={especie === e ? styles.especieTextoAtivo : styles.especieTexto}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput style={styles.input} placeholder="Data nasc. (AAAA-MM-DD, opcional)" value={dataNasc} onChangeText={setDataNasc} />
            <TextInput style={styles.input} placeholder="Observações (opcional)" value={obs} onChangeText={setObs} />

            <View style={styles.lgpdRow}>
              <Switch value={lgpd} onValueChange={setLgpd} />
              <Text style={styles.lgpdTexto}>
                Autorizo o cadastro e uso dos dados deste pet conforme LGPD Art.14
              </Text>
            </View>

            {erro && <Text style={styles.erro}>{erro}</Text>}

            <View style={styles.botoesRow}>
              <TouchableOpacity style={styles.cancelarBtn} onPress={() => setModalOpen(false)}><Text>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={styles.confirmarBtn} onPress={handleSalvar}><Text style={{ color: '#fff', fontWeight: 'bold' }}>Salvar</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: '#FAF7F4' },
  novaBotao:          { backgroundColor: '#8B4513', margin: 16, borderRadius: 8, padding: 14, alignItems: 'center' },
  novaBotaoTexto:     { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  card:               { flex: 1, backgroundColor: '#fff', margin: 6, borderRadius: 16, padding: 12, alignItems: 'center', elevation: 2 },
  foto:               { width: 90, height: 90, borderRadius: 45, marginBottom: 8 },
  semFoto:            { width: 90, height: 90, borderRadius: 45, backgroundColor: '#EDE0D4', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  petNome:            { fontWeight: 'bold', fontSize: 14, color: '#333' },
  petRaca:            { color: '#666', fontSize: 12 },
  petEspecie:         { color: '#8B4513', fontSize: 11, marginTop: 2 },
  vazio:              { textAlign: 'center', color: '#999', margin: 32 },
  overlay:            { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal:              { backgroundColor: '#FAF7F4', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '90%' },
  modalTitulo:        { fontSize: 18, fontWeight: 'bold', color: '#8B4513', marginBottom: 16 },
  fotoBotao:          { borderWidth: 1, borderColor: '#8B4513', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 12 },
  fotoPreview:        { width: 80, height: 80, borderRadius: 40 },
  input:              { borderWidth: 1, borderColor: '#D4A990', borderRadius: 8, padding: 12, marginBottom: 10, backgroundColor: '#fff' },
  label:              { fontWeight: '600', color: '#555', marginBottom: 6 },
  especieRow:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  especieBtn:         { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#D4A990' },
  especieSelecionada: { borderColor: '#8B4513', backgroundColor: '#EDE0D4' },
  especieTexto:       { color: '#555' },
  especieTextoAtivo:  { color: '#8B4513', fontWeight: '600' },
  lgpdRow:            { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  lgpdTexto:          { flex: 1, color: '#555', fontSize: 12, lineHeight: 16 },
  erro:               { color: '#C0392B', marginBottom: 8 },
  botoesRow:          { flexDirection: 'row', gap: 10 },
  cancelarBtn:        { flex: 1, padding: 14, borderRadius: 8, borderWidth: 1, borderColor: '#D4A990', alignItems: 'center' },
  confirmarBtn:       { flex: 1, padding: 14, borderRadius: 8, backgroundColor: '#8B4513', alignItems: 'center' },
});
