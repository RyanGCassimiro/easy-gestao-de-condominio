import { z } from 'zod';

export const StatusItem = z.enum(['disponivel', 'retirado', 'descartado']);
export type StatusItemType = z.infer<typeof StatusItem>;

// T09 — Achados e Perdidos (criado pelo porteiro)
export const itemAchadoSchema = z.object({
  descricao:    z.string().min(5).max(500).trim(),
  localAchado:  z.string().min(2).max(200).trim(),
  // imagemUrl: EXIF já removido antes do upload via exifRemover.ts
  imagemUrl:    z.string().url().optional(),
  dataAchado:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (YYYY-MM-DD)'),
  status:       StatusItem.default('disponivel'),
});

export type ItemAchadoInput = z.infer<typeof itemAchadoSchema>;

export const solicitarRetiradaSchema = z.object({
  idItem:            z.number().int().positive(),
  // Assinatura digital simulada: nome completo + CPF (mascarado na UI)
  nomeRetirada:      z.string().min(3).max(200).trim(),
  documentoRetirada: z.string().min(11).max(14),
  observacao:        z.string().max(300).trim().optional(),
});

export type SolicitarRetiradaInput = z.infer<typeof solicitarRetiradaSchema>;
