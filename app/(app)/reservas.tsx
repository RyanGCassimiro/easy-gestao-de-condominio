import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Modal, TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { reservasService } from '../../src/features/reservas/reservasService';
import { reservaSchema } from '../../src/features/reservas/reservasSchemas';
import { formatarData } from '../../src/utils/formatters';

type Reserva = {
  id_reserva: number;
  data:        string;
  hora_inicio: string;
  hora_fim:    string;
  status:      string;
  observacao?: string;
  espaco?:     { nome: string };
};

type Espaco = { id_espaco: number; nome: string };

export default function ReservasScreen() {
  const [reservas,  setReservas]  = useState<Reserva[]>([]);
  const [espacos,   setEspacos]   = useState<Espaco[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [erro,      setErro]      = useState<string | null>(null);

  const [idEspaco,   setIdEspaco]   = useState('');
  const [data,       setData]       = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFim,    setHoraFim]    = useState('');
  const [obs,        setObs]        = useState('');

  useEffect(() => { buscarDados(); }, []);

  async function buscarDados() {
    setLoading(true);
    const [r, e] = await Promise.all([reservasService.listar(), reservasService.listarEspacos()]);
    setReservas(r ?? []);
    setEspacos(e ?? []);
    setLoading(false);
  }

  async function handleNova() {
    setErro(null);
    const resultado = reservaSchema.safeParse({
      idEspaco: Number(idEspaco), data, horaInicio, horaFim, observacao: obs || undefined,
    });
    if (!resultado.success) { setErro(resultado.error.errors[0].message); return; }
    try {
      await reservasService.criar(resultado.data);
      setModalOpen(false);
      buscarDados();
    } catch (e: any) {
      setErro(e.message ?? 'Erro ao criar reserva.');
    }
  }

  async function handleCancelar(id: number) {
    Alert.alert('Cancelar Reserva', 'Deseja cancelar esta reserva?', [
      { text: 'Não', style: 'cancel' },
      {
        text: 'Sim',
        style: 'destructive',
        onPress: async () => {
          await reservasService.cancelar({ idReserva: id });
          buscarDados();
        },
      },
    ]);
  }

  const renderReserva = ({ item }: { item: Reserva }) => (
    <View style={styles.card}>
      <Text style={styles.cardEspaco}>{item.espaco?.nome ?? 'Espaço'}</Text>
      <Text style={styles.cardInfo}>{formatarData(item.data)} · {item.hora_inicio}–{item.hora_fim}</Text>
      {item.observacao && <Text style={styles.cardObs}>{item.observacao}</Text>}
      <TouchableOpacity style={styles.cancelarBtn} onPress={() => handleCancelar(item.id_reserva)}>
        <Text style={styles.cancelarTexto}>Cancelar</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.novaBotao} onPress={() => setModalOpen(true)}>
        <Text style={styles.novaBotaoTexto}>+ Nova Reserva</Text>
      </TouchableOpacity>

      {loading
        ? <ActivityIndicator color="#8B4513" style={{ marginTop: 32 }} />
        : <FlatList
            data={reservas}
            keyExtractor={i => String(i.id_reserva)}
            renderItem={renderReserva}
            contentContainerStyle={{ padding: 12 }}
            ListEmptyComponent={<Text style={styles.vazio}>Nenhuma reserva ativa.</Text>}
          />}

      <Modal visible={modalOpen} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitulo}>Nova Reserva</Text>

            <Text style={styles.label}>Espaço</Text>
            {espacos.map(e => (
              <TouchableOpacity
                key={e.id_espaco}
                style={[styles.espacoOpcao, idEspaco === String(e.id_espaco) && styles.espacoSelecionado]}
                onPress={() => setIdEspaco(String(e.id_espaco))}
              >
                <Text>{e.nome}</Text>
              </TouchableOpacity>
            ))}

            <TextInput style={styles.input} placeholder="Data (AAAA-MM-DD)" value={data} onChangeText={setData} />
            <TextInput style={styles.input} placeholder="Hora início (HH:MM)" value={horaInicio} onChangeText={setHoraInicio} />
            <TextInput style={styles.input} placeholder="Hora fim (HH:MM)" value={horaFim} onChangeText={setHoraFim} />
            <TextInput style={styles.input} placeholder="Observação (opcional)" value={obs} onChangeText={setObs} />

            {erro && <Text style={styles.erro}>{erro}</Text>}

            <View style={styles.modalBotoes}>
              <TouchableOpacity style={styles.cancelarModal} onPress={() => { setModalOpen(false); setErro(null); }}>
                <Text>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmarModal} onPress={handleNova}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#FAF7F4' },
  novaBotao:        { backgroundColor: '#8B4513', margin: 16, borderRadius: 8, padding: 14, alignItems: 'center' },
  novaBotaoTexto:   { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  card:             { backgroundColor: '#fff', borderRadius: 10, padding: 16, marginBottom: 10, elevation: 2 },
  cardEspaco:       { fontWeight: 'bold', color: '#8B4513', fontSize: 15 },
  cardInfo:         { color: '#555', marginTop: 4 },
  cardObs:          { color: '#999', fontSize: 13, marginTop: 4 },
  cancelarBtn:      { alignSelf: 'flex-end', marginTop: 8, padding: 6 },
  cancelarTexto:    { color: '#C0392B', fontWeight: '600' },
  vazio:            { textAlign: 'center', color: '#999', margin: 32 },
  overlay:          { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal:            { backgroundColor: '#FAF7F4', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitulo:      { fontSize: 18, fontWeight: 'bold', color: '#8B4513', marginBottom: 16 },
  label:            { fontWeight: '600', color: '#555', marginBottom: 6 },
  espacoOpcao:      { padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#D4A990', marginBottom: 6 },
  espacoSelecionado: { borderColor: '#8B4513', backgroundColor: '#EDE0D4' },
  input:            { borderWidth: 1, borderColor: '#D4A990', borderRadius: 8, padding: 12, marginBottom: 10, backgroundColor: '#fff' },
  erro:             { color: '#C0392B', marginBottom: 8 },
  modalBotoes:      { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelarModal:    { flex: 1, padding: 14, borderRadius: 8, borderWidth: 1, borderColor: '#D4A990', alignItems: 'center' },
  confirmarModal:   { flex: 1, padding: 14, borderRadius: 8, backgroundColor: '#8B4513', alignItems: 'center' },
});
