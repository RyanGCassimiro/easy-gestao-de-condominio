import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Modal, TextInput, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { reservasService } from '../../src/features/reservas/reservasService';
import { reservaSchema } from '../../src/features/reservas/reservasSchemas';
import { formatarData } from '../../src/utils/formatters';
import { COLORS, RADIUS } from '../../src/constants/theme';

type Reserva = {
  id_reserva:  number;
  data:        string;
  hora_inicio: string;
  hora_fim:    string;
  status:      string;
  observacao?: string | null;
  espaco?:     { nome: string } | null;
};
type Espaco = { id_espaco: number; nome: string };

const STATUS_COR: Record<string, string> = {
  confirmada: '#D4EDDA',
  pendente:   '#FFF3CD',
  cancelada:  '#F8D7DA',
};

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
      setIdEspaco(''); setData(''); setHoraInicio(''); setHoraFim(''); setObs('');
      buscarDados();
    } catch (e: any) {
      setErro(e.message ?? 'Erro ao criar reserva.');
    }
  }

  async function handleCancelar(id: number) {
    Alert.alert('Cancelar Reserva', 'Deseja cancelar esta reserva?', [
      { text: 'Não', style: 'cancel' },
      {
        text: 'Sim, cancelar',
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
      <View style={styles.cardTop}>
        <View style={styles.cardEspacoRow}>
          <Ionicons name="location-outline" size={14} color={COLORS.terracota} />
          <Text style={styles.cardEspaco}>{item.espaco?.nome ?? 'Espaço'}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COR[item.status] ?? STATUS_COR.pendente }]}>
          <Text style={styles.statusTexto}>{item.status.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.cardInfoRow}>
        <Ionicons name="calendar-outline" size={13} color={COLORS.textSecondary} />
        <Text style={styles.cardInfo}>{formatarData(item.data)}</Text>
        <Ionicons name="time-outline" size={13} color={COLORS.textSecondary} />
        <Text style={styles.cardInfo}>{item.hora_inicio} – {item.hora_fim}</Text>
      </View>

      {item.observacao && (
        <Text style={styles.cardObs}>{item.observacao}</Text>
      )}

      {item.status !== 'cancelada' && (
        <TouchableOpacity style={styles.cancelarBtn} onPress={() => handleCancelar(item.id_reserva)}>
          <Text style={styles.cancelarTexto}>Cancelar reserva</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.topTitulo}>Minhas Reservas</Text>
        <TouchableOpacity
          style={[styles.novaBotao, loading && { opacity: 0.5 }]}
          onPress={() => setModalOpen(true)}
          disabled={loading}
        >
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.novaBotaoTexto}>Nova Reserva</Text>
        </TouchableOpacity>
      </View>

      {loading
        ? <ActivityIndicator color={COLORS.terracota} style={{ marginTop: 32 }} />
        : <FlatList
            data={reservas}
            keyExtractor={i => String(i.id_reserva)}
            renderItem={renderReserva}
            contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
            onRefresh={buscarDados}
            refreshing={loading}
            ListEmptyComponent={(
              <View style={styles.vazioBox}>
                <Ionicons name="calendar-outline" size={48} color={COLORS.inputBorder} />
                <Text style={styles.vazioTexto}>Nenhuma reserva ativa.</Text>
              </View>
            )}
          />}

      <Modal visible={modalOpen} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitulo}>Nova Reserva</Text>

            <Text style={styles.label}>Espaço comum</Text>
            {loading
              ? <ActivityIndicator color={COLORS.terracota} style={{ marginBottom: 14 }} />
              : espacos.length === 0
              ? <Text style={styles.semEspacos}>Nenhum espaço cadastrado no condomínio ainda.</Text>
              : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                  <View style={styles.espacosRow}>
                    {espacos.map(e => (
                      <TouchableOpacity
                        key={e.id_espaco}
                        style={[styles.espacoChip, idEspaco === String(e.id_espaco) && styles.espacoChipAtivo]}
                        onPress={() => setIdEspaco(String(e.id_espaco))}
                      >
                        <Text style={[styles.espacoChipTexto, idEspaco === String(e.id_espaco) && styles.espacoChipTextoAtivo]}>
                          {e.nome}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              )}

            <Text style={styles.label}>Data</Text>

            <TextInput style={styles.input} placeholder="AAAA-MM-DD" placeholderTextColor="#BBB" value={data} onChangeText={setData} />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Início</Text>
                <TextInput style={styles.input} placeholder="HH:MM" placeholderTextColor="#BBB" value={horaInicio} onChangeText={setHoraInicio} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Fim</Text>
                <TextInput style={styles.input} placeholder="HH:MM" placeholderTextColor="#BBB" value={horaFim} onChangeText={setHoraFim} />
              </View>
            </View>

            <Text style={styles.label}>Observação (opcional)</Text>
            <TextInput style={styles.input} placeholder="Ex: Festa de aniversário" placeholderTextColor="#BBB" value={obs} onChangeText={setObs} />

            {erro && <Text style={styles.erro}>{erro}</Text>}

            <View style={styles.modalBotoes}>
              <TouchableOpacity style={styles.cancelarModal} onPress={() => { setModalOpen(false); setErro(null); }}>
                <Text style={styles.cancelarModalTexto}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmarModal} onPress={handleNova}>
                <Text style={styles.confirmarModalTexto}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:           { flex: 1, backgroundColor: COLORS.background },
  topBar:              { backgroundColor: COLORS.terracota, paddingTop: 56, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  topTitulo:           { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  novaBotao:           { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: RADIUS.pill },
  novaBotaoTexto:      { color: '#fff', fontWeight: '600', fontSize: 13 },

  card:                { backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: 16, marginBottom: 10, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  cardTop:             { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardEspacoRow:       { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardEspaco:          { fontWeight: 'bold', color: COLORS.terracota, fontSize: 14 },
  statusBadge:         { paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.pill },
  statusTexto:         { fontSize: 10, fontWeight: 'bold', color: '#333' },
  cardInfoRow:         { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  cardInfo:            { color: COLORS.textSecondary, fontSize: 13 },
  cardObs:             { color: COLORS.textMuted, fontSize: 12, marginTop: 6 },
  cancelarBtn:         { alignSelf: 'flex-end', marginTop: 10, paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.pill, borderWidth: 1, borderColor: COLORS.error },
  cancelarTexto:       { color: COLORS.error, fontWeight: '600', fontSize: 12 },

  vazioBox:            { alignItems: 'center', marginTop: 60, gap: 12 },
  vazioTexto:          { color: COLORS.textMuted, fontSize: 14 },

  overlay:             { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal:               { backgroundColor: COLORS.background, borderTopLeftRadius: RADIUS.lg, borderTopRightRadius: RADIUS.lg, padding: 24, paddingBottom: 36 },
  modalHandle:         { width: 40, height: 4, backgroundColor: '#DDD', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitulo:         { fontSize: 18, fontWeight: 'bold', color: COLORS.terracota, marginBottom: 16 },
  label:               { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 5 },
  espacosRow:          { flexDirection: 'row', gap: 8, paddingRight: 8 },
  espacoChip:          { paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.pill, borderWidth: 1, borderColor: COLORS.inputBorder, backgroundColor: COLORS.card },
  espacoChipAtivo:     { borderColor: COLORS.terracota, backgroundColor: '#EDE0D4' },
  espacoChipTexto:     { color: COLORS.textSecondary, fontSize: 13 },
  espacoChipTextoAtivo: { color: COLORS.terracota, fontWeight: '600' },
  semEspacos:          { color: COLORS.textMuted, fontSize: 13, fontStyle: 'italic', marginBottom: 14 },
  row:                 { flexDirection: 'row', gap: 10 },
  input:               { borderWidth: 1, borderColor: COLORS.inputBorder, borderRadius: RADIUS.sm, padding: 12, marginBottom: 12, backgroundColor: COLORS.card, fontSize: 14, color: COLORS.textPrimary },
  erro:                { color: COLORS.error, marginBottom: 8, fontSize: 13 },
  modalBotoes:         { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelarModal:       { flex: 1, padding: 14, borderRadius: RADIUS.pill, borderWidth: 1, borderColor: COLORS.inputBorder, alignItems: 'center' },
  cancelarModalTexto:  { color: COLORS.textSecondary, fontWeight: '600' },
  confirmarModal:      { flex: 1, padding: 14, borderRadius: RADIUS.pill, backgroundColor: COLORS.terracota, alignItems: 'center' },
  confirmarModalTexto: { color: '#fff', fontWeight: 'bold' },
});
