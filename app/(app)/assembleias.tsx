import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Modal, Alert, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { assembleiaService } from '../../src/features/assembleias/assembleiaService';
import { useRealtimeVotos } from '../../src/hooks/useRealtime';
import { formatarDataHora } from '../../src/utils/formatters';
import { OpcaoVotoType } from '../../src/features/assembleias/assembleiaSchemas';
import { COLORS, RADIUS } from '../../src/constants/theme';

type Pauta = { id_pauta: number; titulo: string; descricao?: string | null; ordem: number };
type Assembleia = {
  id_assembleia: number;
  titulo:        string;
  data_hora:     string;
  local:         string;
  modalidade:    string;
  pautas?:       Pauta[];
};
type Contagem = { sim: number; nao: number; abstencao: number };

const OPCAO_COR: Record<string, string> = {
  sim:       COLORS.verde,
  nao:       COLORS.error,
  abstencao: '#7F8C8D',
};

const OPCAO_LABEL: Record<string, string> = {
  sim:       'Sim',
  nao:       'Não',
  abstencao: 'Abstenção',
};

export default function AssembleiasScreen() {
  const [assembleias, setAssembleias] = useState<Assembleia[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [pautaSel,    setPautaSel]    = useState<Pauta | null>(null);
  const [contagem,    setContagem]    = useState<Contagem>({ sim: 0, nao: 0, abstencao: 0 });
  const [jaVotou,     setJaVotou]     = useState(false);
  const [enviando,    setEnviando]    = useState(false);

  useEffect(() => {
    assembleiaService.listar().then(d => { setAssembleias(d ?? []); setLoading(false); });
  }, []);

  async function abrirVotacao(pauta: Pauta) {
    setPautaSel(pauta);
    const [c, v] = await Promise.all([
      assembleiaService.contarVotos(pauta.id_pauta),
      assembleiaService.jaVotou(pauta.id_pauta),
    ]);
    setContagem(c);
    setJaVotou(v);
  }

  useRealtimeVotos(pautaSel?.id_pauta ?? 0, async () => {
    if (!pautaSel) return;
    const c = await assembleiaService.contarVotos(pautaSel.id_pauta);
    setContagem(c);
  });

  async function votar(opcao: OpcaoVotoType) {
    if (!pautaSel) return;
    Alert.alert('Confirmar voto', `Confirma seu voto: ${OPCAO_LABEL[opcao]}?`, [
      { text: 'Não', style: 'cancel' },
      {
        text: 'Confirmar',
        onPress: async () => {
          setEnviando(true);
          try {
            await assembleiaService.votar({ idPauta: pautaSel.id_pauta, opcao });
            setJaVotou(true);
            const c = await assembleiaService.contarVotos(pautaSel.id_pauta);
            setContagem(c);
          } catch (e: any) {
            Alert.alert('Erro', e.message);
          } finally {
            setEnviando(false);
          }
        },
      },
    ]);
  }

  const total = contagem.sim + contagem.nao + contagem.abstencao;

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => require('expo-router').router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.topTitulo}>Assembleias</Text>
        <View style={{ width: 22 }} />
      </View>

      {loading
        ? <ActivityIndicator color={COLORS.terracota} style={{ marginTop: 32 }} />
        : <FlatList
            data={assembleias}
            keyExtractor={i => String(i.id_assembleia)}
            contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
            ListEmptyComponent={(
              <View style={styles.vazioBox}>
                <Ionicons name="people-outline" size={48} color={COLORS.inputBorder} />
                <Text style={styles.vazioTexto}>Nenhuma assembleia agendada.</Text>
              </View>
            )}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Text style={styles.cardTitulo}>{item.titulo}</Text>
                <View style={styles.cardInfoRow}>
                  <Ionicons name="calendar-outline" size={13} color={COLORS.textSecondary} />
                  <Text style={styles.cardInfo}>{formatarDataHora(item.data_hora)}</Text>
                </View>
                <View style={styles.cardInfoRow}>
                  <Ionicons name="location-outline" size={13} color={COLORS.textSecondary} />
                  <Text style={styles.cardInfo}>{item.local}</Text>
                </View>
                <View style={[styles.modalidadeChip]}>
                  <Text style={styles.modalidadeTexto}>{item.modalidade}</Text>
                </View>

                {(item.pautas ?? []).length > 0 && (
                  <View style={styles.pautasBox}>
                    <Text style={styles.pautasHeader}>Pautas</Text>
                    {(item.pautas ?? []).map(p => (
                      <TouchableOpacity key={p.id_pauta} style={styles.pauta} onPress={() => abrirVotacao(p)}>
                        <Text style={styles.pautaTexto}>{p.ordem}. {p.titulo}</Text>
                        <View style={styles.votarChip}>
                          <Text style={styles.votarTexto}>Votar</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}
          />}

      {/* Modal de Votação */}
      <Modal visible={!!pautaSel} animationType="slide" transparent>
        <View style={styles.overlay}>
          <ScrollView style={styles.modal} bounces={false}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitulo}>{pautaSel?.titulo}</Text>
            {pautaSel?.descricao && <Text style={styles.modalDesc}>{pautaSel.descricao}</Text>}

            <Text style={styles.resultadoHeader}>Resultado em tempo real</Text>
            {(['sim', 'nao', 'abstencao'] as OpcaoVotoType[]).map(op => {
              const pct = total ? Math.round((contagem[op] / total) * 100) : 0;
              return (
                <View key={op} style={styles.barraRow}>
                  <Text style={[styles.barraLabel, { color: OPCAO_COR[op] }]}>{OPCAO_LABEL[op]}</Text>
                  <View style={styles.barraFundo}>
                    <View style={[styles.barra, { width: `${pct}%`, backgroundColor: OPCAO_COR[op] }]} />
                  </View>
                  <Text style={styles.barraPct}>{pct}%</Text>
                </View>
              );
            })}

            {!jaVotou ? (
              <View style={styles.opcoes}>
                {(['sim', 'nao', 'abstencao'] as OpcaoVotoType[]).map(op => (
                  <TouchableOpacity
                    key={op}
                    style={[styles.opcaoBtn, { backgroundColor: OPCAO_COR[op] }]}
                    onPress={() => votar(op)}
                    disabled={enviando}
                  >
                    <Text style={styles.opcaoBtnTexto}>{OPCAO_LABEL[op]}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.votadoBox}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.verde} />
                <Text style={styles.votadoTexto}>Voto computado com sucesso</Text>
              </View>
            )}

            <TouchableOpacity style={styles.fechar} onPress={() => setPautaSel(null)}>
              <Text style={styles.fecharTexto}>Fechar</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: COLORS.background },
  topBar:         { backgroundColor: COLORS.terracota, paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topTitulo:      { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  card:           { backgroundColor: COLORS.card, borderRadius: RADIUS.md, padding: 16, marginBottom: 10, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  cardTitulo:     { fontWeight: 'bold', fontSize: 15, color: COLORS.textPrimary, marginBottom: 6 },
  cardInfoRow:    { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 3 },
  cardInfo:       { color: COLORS.textSecondary, fontSize: 12 },
  modalidadeChip: { alignSelf: 'flex-start', backgroundColor: COLORS.toggleBg, paddingHorizontal: 10, paddingVertical: 3, borderRadius: RADIUS.pill, marginTop: 6 },
  modalidadeTexto: { color: COLORS.terracota, fontSize: 11, fontWeight: '600' },
  pautasBox:      { marginTop: 12, borderTopWidth: 1, borderTopColor: COLORS.background, paddingTop: 10 },
  pautasHeader:   { fontSize: 12, fontWeight: '600', color: COLORS.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  pauta:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 10, backgroundColor: COLORS.background, borderRadius: RADIUS.sm, marginBottom: 6 },
  pautaTexto:     { color: COLORS.textPrimary, flex: 1, fontSize: 13 },
  votarChip:      { backgroundColor: COLORS.terracota, paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.pill },
  votarTexto:     { color: '#fff', fontSize: 11, fontWeight: '600' },

  vazioBox:       { alignItems: 'center', marginTop: 60, gap: 12 },
  vazioTexto:     { color: COLORS.textMuted, fontSize: 14 },

  overlay:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal:          { backgroundColor: COLORS.background, borderTopLeftRadius: RADIUS.lg, borderTopRightRadius: RADIUS.lg, padding: 24, maxHeight: '85%' },
  modalHandle:    { width: 40, height: 4, backgroundColor: '#DDD', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitulo:    { fontSize: 17, fontWeight: 'bold', color: COLORS.terracota, marginBottom: 6 },
  modalDesc:      { color: COLORS.textSecondary, marginBottom: 16, lineHeight: 20 },

  resultadoHeader: { fontWeight: '600', color: COLORS.textPrimary, marginBottom: 10, marginTop: 4 },
  barraRow:       { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  barraLabel:     { width: 76, fontWeight: '600', fontSize: 13 },
  barraFundo:     { flex: 1, height: 10, backgroundColor: COLORS.toggleBg, borderRadius: 5, overflow: 'hidden' },
  barra:          { height: '100%', borderRadius: 5 },
  barraPct:       { width: 36, fontSize: 12, color: COLORS.textSecondary, textAlign: 'right' },

  opcoes:         { flexDirection: 'row', gap: 10, marginTop: 20, marginBottom: 16 },
  opcaoBtn:       { flex: 1, padding: 13, borderRadius: RADIUS.pill, alignItems: 'center' },
  opcaoBtnTexto:  { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  votadoBox:      { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center', marginVertical: 20 },
  votadoTexto:    { color: COLORS.verde, fontWeight: '600' },
  fechar:         { alignItems: 'center', padding: 14, marginBottom: 8 },
  fecharTexto:    { color: COLORS.terracota, fontWeight: '600' },
});
