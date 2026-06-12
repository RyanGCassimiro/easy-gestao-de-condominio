import { z } from 'zod';
import crypto from 'crypto';

// T08 — Assembleias e Votações
export const assembleiaSchema = z.object({
  titulo:       z.string().min(5).max(300).trim(),
  descricao:    z.string().max(2000).trim().optional(),
  dataHora:     z.string().datetime(),
  local:        z.string().max(200).trim(),
  modalidade:   z.enum(['presencial', 'online', 'hibrida']),
});

export type AssembleiaInput = z.infer<typeof assembleiaSchema>;

export const pautaSchema = z.object({
  idAssembleia: z.number().int().positive(),
  titulo:       z.string().min(5).max(300).trim(),
  descricao:    z.string().max(2000).trim().optional(),
  ordem:        z.number().int().min(1),
});

export type PautaInput = z.infer<typeof pautaSchema>;

export const OpcaoVoto = z.enum(['sim', 'nao', 'abstencao']);
export type OpcaoVotoType = z.infer<typeof OpcaoVoto>;

export const votoSchema = z.object({
  idPauta:  z.number().int().positive(),
  opcao:    OpcaoVoto,
});

export type VotoInput = z.infer<typeof votoSchema>;

// hash_verificacao = SHA-256(idVoto + idPauta + idUsuario + timestamp)
export function gerarHashVoto(params: {
  idVoto:    number;
  idPauta:   number;
  idUsuario: string;
  timestamp: string;
}): string {
  const raw = `${params.idVoto}|${params.idPauta}|${params.idUsuario}|${params.timestamp}`;
  return crypto.createHash('sha256').update(raw).digest('hex');
}
