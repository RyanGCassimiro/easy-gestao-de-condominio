import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Modal, Alert,
} from 'react-native';
import { assembleiaService } from '../../src/features/assembleias/assembleiaService';
import { useRealtimeVotos } from '../../src/hooks/useRealtime';
import { formatarDataHora } from '../../src/utils/formatters';
import { OpcaoVotoType } from '../../src/features/assembleias/assembleiaSchemas';

type Pauta = { id_pauta: number; titulo: string; descricao?: string; ordem: number };
type Assembleia = {
  id_assembleia: number;
  titulo:        string;
  data_hora:     string;
  local:         string;
  modalidade:    string;
  pautas?:       Pauta[];
};
type Contagem = { sim: number; nao: number; abstencao: number };

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
    Alert.alert('Confirmar voto', `Confirma seu voto: ${opcao.toUpperCase()}?`, [
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
      {loading
        ? <ActivityIndicator color="#8B4513" style={{ marginTop: 32 }} />
        : <FlatList
            data={assembleias}
            keyExtractor={i => String(i.id_assembleia)}
            contentContainerStyle={{ padding: 12 }}
            ListEmptyComponent={<Text style={styles.vazio}>Nenhuma assembleia agendada.</Text>}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Text style={styles.cardTitulo}>{item.titulo}</Text>
                <Text style={styles.cardInfo}>{formatarDataHora(item.data_hora)} · {item.local}</Text>
                <Text style={styles.cardModalidade}>{item.modalidade}</Text>
                {(item.pautas ?? []).map(p => (
                  <TouchableOpacity key={p.id_pauta} style={styles.pauta} onPress={() => abrirVotacao(p)}>
                    <Text style={styles.pautaTexto}>{p.ordem}. {p.titulo}</Text>
                    <Text style={styles.votarLink}>Votar →</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          />}

      {/* Modal de Votação */}
      <Modal visible={!!pautaSel} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitulo}>{pautaSel?.titulo}</Text>
            {pautaSel?.descricao && <Text style={styles.modalDesc}>{pautaSel.descricao}</Text>}

            {/* Resultado em tempo real */}
            <View style={styles.resultado}>
              <Text style={styles.resultadoTitulo}>Resultado (tempo real)</Text>
              {(['sim', 'nao', 'abstencao'] as OpcaoVotoType[]).map(op => {
                const pct = total ? Math.round((contagem[op] / total) * 100) : 0;
                return (
                  <View key={op} style={styles.barraRow}>
                    <Text style={styles.barraLabel}>{op}</Text>
                    <View style={styles.barraFundo}>
                      <View style={[styles.barra, { width: `${pct}%` }]} />
                    </View>
                    <Text style={styles.barraPct}>{pct}% ({contagem[op]})</Text>
                  </View>
                );
              })}
            </View>

            {!jaVotou && (
              <View style={styles.opcoes}>
                {(['sim', 'nao', 'abstencao'] as OpcaoVotoType[]).map(op => (
                  <TouchableOpacity
                    key={op}
                    style={[styles.opcaoBtn, styles[`opcao_${op}` as keyof typeof styles] as any]}
                    onPress={() => votar(op)}
                    disabled={enviando}
                  >
                    <Text style={styles.opcaoBtnTexto}>{op.toUpperCase()}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {jaVotou && <Text style={styles.votado}>✓ Voto computado com sucesso</Text>}

            <TouchableOpacity style={styles.fechar} onPress={() => setPautaSel(null)}>
              <Text style={{ color: '#8B4513' }}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#FAF7F4' },
  card:           { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10, elevation: 2 },
  cardTitulo:     { fontWeight: 'bold', fontSize: 15, color: '#333' },
  cardInfo:       { color: '#666', marginTop: 4, fontSize: 13 },
  cardModalidade: { color: '#8B4513', fontSize: 12, marginTop: 2 },
  pauta:          { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, padding: 8, backgroundColor: '#FAF7F4', borderRadius: 8 },
  pautaTexto:     { color: '#333', flex: 1 },
  votarLink:      { color: '#8B4513', fontWeight: 'bold' },
  vazio:          { textAlign: 'center', color: '#999', margin: 32 },
  overlay:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal:          { backgroundColor: '#FAF7F4', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitulo:    { fontSize: 17, fontWeight: 'bold', color: '#8B4513', marginBottom: 6 },
  modalDesc:      { color: '#666', marginBottom: 16 },
  resultado:      { marginBottom: 16 },
  resultadoTitulo: { fontWeight: '600', marginBottom: 8 },
  barraRow:       { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 8 },
  barraLabel:     { width: 80, color: '#555' },
  barraFundo:     { flex: 1, height: 12, backgroundColor: '#EDE0D4', borderRadius: 6, overflow: 'hidden' },
  barra:          { height: '100%', backgroundColor: '#8B4513', borderRadius: 6 },
  barraPct:       { width: 80, fontSize: 12, color: '#555', textAlign: 'right' },
  opcoes:         { flexDirection: 'row', gap: 10, marginBottom: 16 },
  opcaoBtn:       { flex: 1, padding: 14, borderRadius: 8, alignItems: 'center' },
  opcao_sim:      { backgroundColor: '#27AE60' },
  opcao_nao:      { backgroundColor: '#C0392B' },
  opcao_abstencao: { backgroundColor: '#7F8C8D' },
  opcaoBtnTexto:  { color: '#fff', fontWeight: 'bold' },
  votado:         { color: '#27AE60', textAlign: 'center', fontWeight: '600', marginBottom: 12 },
  fechar:         { alignItems: 'center', padding: 10 },
});
