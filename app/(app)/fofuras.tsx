import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Image, Modal, TextInput, Switch, ActivityIndicator, ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { fofurasService } from '../../src/features/fofuras/fofurasService';
import { petSchema } from '../../src/features/fofuras/fofurasSchemas';
import { COLORS, RADIUS } from '../../src/constants/theme';

type Pet = {
  id_dependente: number;
  nome:          string;
  raca:          string | null;
  especie:       string | null;
  imagem_url?:   string | null;
};

type Especie = 'cachorro' | 'gato' | 'ave' | 'outro';
const ESPECIES: { key: Especie; label: string; emoji: string }[] = [
  { key: 'cachorro', label: 'Cachorro', emoji: '🐕' },
  { key: 'gato',     label: 'Gato',     emoji: '🐱' },
  { key: 'ave',      label: 'Ave',      emoji: '🦜' },
  { key: 'outro',    label: 'Outro',    emoji: '🐾' },
];

export default function FofurasScreen() {
  const [pets,      setPets]      = useState<Pet[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editando,  setEditando]  = useState<Pet | null>(null);
  const [nome,      setNome]      = useState('');
  const [raca,      setRaca]      = useState('');
  const [especie,   setEspecie]   = useState<Especie>('cachorro');
  const [dataNasc,  setDataNasc]  = useState('');
  const [obs,       setObs]       = useState('');
  const [fotoUri,   setFotoUri]   = useState<string | undefined>();
  const [lgpd,      setLgpd]      = useState(false);
  const [erro,      setErro]      = useState<string | null>(null);

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
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => require('expo-router').router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.topTitulo}>Fofuras</Text>
        <TouchableOpacity onPress={() => abrirModal()}>
          <Ionicons name="add-circle-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading
        ? <ActivityIndicator color={COLORS.terracota} style={{ marginTop: 32 }} />
        : <FlatList
            data={pets}
            numColumns={2}
            keyExtractor={i => String(i.id_dependente)}
            contentContainerStyle={{ padding: 10, paddingBottom: 24 }}
            onRefresh={buscar}
            refreshing={loading}
            ListEmptyComponent={(
              <View style={styles.vazioBox}>
                <Text style={{ fontSize: 48 }}>🐾</Text>
                <Text style={styles.vazioTexto}>Nenhum pet cadastrado ainda.</Text>
                <TouchableOpacity style={styles.cadastrarBtn} onPress={() => abrirModal()}>
                  <Text style={styles.cadastrarTexto}>Cadastrar meu pet</Text>
                </TouchableOpacity>
              </View>
            )}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.card} onPress={() => abrirModal(item)}>
                {item.imagem_url
                  ? <Image source={{ uri: item.imagem_url }} style={styles.foto} />
                  : (
                    <View style={styles.semFoto}>
                      <Text style={{ fontSize: 36 }}>
                        {ESPECIES.find(e => e.key === item.especie)?.emoji ?? '🐾'}
                      </Text>
                    </View>
                  )}
                <Text style={styles.petNome}>{item.nome}</Text>
                <Text style={styles.petRaca} numberOfLines={1}>{item.raca}</Text>
                <View style={styles.especieChip}>
                  <Text style={styles.especieChipTexto}>{item.especie}</Text>
                </View>
              </TouchableOpacity>
            )}
          />}

      <Modal visible={modalOpen} animationType="slide" transparent>
        <View style={styles.overlay}>
          <ScrollView style={styles.modal} bounces={false}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitulo}>{editando ? 'Editar Pet' : 'Cadastrar Pet'}</Text>

            <TouchableOpacity style={styles.fotoBotao} onPress={selecionarFoto}>
              {fotoUri
                ? <Image source={{ uri: fotoUri }} style={styles.fotoPreview} />
                : (
                  <View style={styles.fotoPlaceholder}>
                    <Ionicons name="camera-outline" size={28} color={COLORS.terracota} />
                    <Text style={styles.fotoTexto}>Adicionar foto</Text>
                  </View>
                )}
            </TouchableOpacity>

            <TextInput style={styles.input} placeholder="Nome do pet" placeholderTextColor="#BBB" value={nome} onChangeText={setNome} />
            <TextInput style={styles.input} placeholder="Raça" placeholderTextColor="#BBB" value={raca} onChangeText={setRaca} />

            <Text style={styles.label}>Espécie</Text>
            <View style={styles.especieRow}>
              {ESPECIES.map(e => (
                <TouchableOpacity
                  key={e.key}
                  style={[styles.especieBtn, especie === e.key && styles.especieSelecionada]}
                  onPress={() => setEspecie(e.key)}
                >
                  <Text>{e.emoji}</Text>
                  <Text style={especie === e.key ? styles.especieTextoAtivo : styles.especieTexto}>{e.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput style={styles.input} placeholder="Data de nascimento (AAAA-MM-DD, opcional)" placeholderTextColor="#BBB" value={dataNasc} onChangeText={setDataNasc} />
            <TextInput style={styles.input} placeholder="Observações (opcional)" placeholderTextColor="#BBB" value={obs} onChangeText={setObs} multiline />

            <View style={styles.lgpdRow}>
              <Switch
                value={lgpd}
                onValueChange={setLgpd}
                trackColor={{ true: COLORS.terracota }}
                thumbColor="#fff"
              />
              <Text style={styles.lgpdTexto}>
                Autorizo o cadastro e uso dos dados deste pet conforme LGPD Art.14
              </Text>
            </View>

            {erro && <Text style={styles.erro}>{erro}</Text>}

            <View style={styles.botoesRow}>
              <TouchableOpacity style={styles.cancelarBtn} onPress={() => setModalOpen(false)}>
                <Text style={styles.cancelarTexto}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmarBtn} onPress={handleSalvar}>
                <Text style={styles.confirmarTexto}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: COLORS.background },
  topBar:             { backgroundColor: COLORS.terracota, paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topTitulo:          { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  card:               { flex: 1, backgroundColor: COLORS.card, margin: 5, borderRadius: RADIUS.md, padding: 12, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  foto:               { width: 90, height: 90, borderRadius: 45, marginBottom: 8 },
  semFoto:            { width: 90, height: 90, borderRadius: 45, backgroundColor: COLORS.toggleBg, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  petNome:            { fontWeight: 'bold', fontSize: 14, color: COLORS.textPrimary },
  petRaca:            { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  especieChip:        { marginTop: 6, backgroundColor: COLORS.toggleBg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.pill },
  especieChipTexto:   { color: COLORS.terracota, fontSize: 10, fontWeight: '600' },

  vazioBox:           { alignItems: 'center', marginTop: 60, gap: 12 },
  vazioTexto:         { color: COLORS.textMuted, fontSize: 14 },
  cadastrarBtn:       { backgroundColor: COLORS.terracota, paddingHorizontal: 20, paddingVertical: 10, borderRadius: RADIUS.pill, marginTop: 4 },
  cadastrarTexto:     { color: '#fff', fontWeight: 'bold' },

  overlay:            { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal:              { backgroundColor: COLORS.background, borderTopLeftRadius: RADIUS.lg, borderTopRightRadius: RADIUS.lg, padding: 24, maxHeight: '92%' },
  modalHandle:        { width: 40, height: 4, backgroundColor: '#DDD', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitulo:        { fontSize: 18, fontWeight: 'bold', color: COLORS.terracota, marginBottom: 16 },

  fotoBotao:          { alignSelf: 'center', marginBottom: 16 },
  fotoPreview:        { width: 90, height: 90, borderRadius: 45 },
  fotoPlaceholder:    { width: 90, height: 90, borderRadius: 45, backgroundColor: COLORS.toggleBg, alignItems: 'center', justifyContent: 'center', gap: 4 },
  fotoTexto:          { color: COLORS.terracota, fontSize: 11, fontWeight: '600' },

  label:              { fontWeight: '600', color: COLORS.textSecondary, marginBottom: 8, fontSize: 13 },
  input:              { borderWidth: 1, borderColor: COLORS.inputBorder, borderRadius: RADIUS.sm, padding: 12, marginBottom: 10, backgroundColor: COLORS.card, fontSize: 14, color: COLORS.textPrimary },
  especieRow:         { flexDirection: 'row', gap: 8, marginBottom: 14, flexWrap: 'wrap' },
  especieBtn:         { flex: 1, minWidth: 70, alignItems: 'center', paddingVertical: 8, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: COLORS.inputBorder, gap: 2 },
  especieSelecionada: { borderColor: COLORS.terracota, backgroundColor: COLORS.toggleBg },
  especieTexto:       { color: COLORS.textSecondary, fontSize: 11 },
  especieTextoAtivo:  { color: COLORS.terracota, fontWeight: '600', fontSize: 11 },
  lgpdRow:            { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 14 },
  lgpdTexto:          { flex: 1, color: COLORS.textSecondary, fontSize: 12, lineHeight: 17 },
  erro:               { color: COLORS.error, marginBottom: 8, fontSize: 13 },
  botoesRow:          { flexDirection: 'row', gap: 10, marginBottom: 24 },
  cancelarBtn:        { flex: 1, padding: 14, borderRadius: RADIUS.pill, borderWidth: 1, borderColor: COLORS.inputBorder, alignItems: 'center' },
  cancelarTexto:      { color: COLORS.textSecondary, fontWeight: '600' },
  confirmarBtn:       { flex: 1, padding: 14, borderRadius: RADIUS.pill, backgroundColor: COLORS.terracota, alignItems: 'center' },
  confirmarTexto:     { color: '#fff', fontWeight: 'bold' },
});
