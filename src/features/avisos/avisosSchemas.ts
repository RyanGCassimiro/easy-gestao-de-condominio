import { z } from 'zod';

export const PrioridadeAviso = z.enum(['normal', 'urgente', 'info']);
export type PrioridadeAvisoType = z.infer<typeof PrioridadeAviso>;

// T07 — Mural de Avisos (escrita pelo síndico)
export const avisoSchema = z.object({
  titulo:      z.string().min(3).max(200).trim(),
  conteudo:    z.string().min(10).max(3000).trim(),
  prioridade:  PrioridadeAviso.default('normal'),
  // Segmentação opcional — null = todos
  bloco:       z.string().max(20).nullable().default(null),
  andar:       z.number().int().min(1).max(100).nullable().default(null),
  expiraEm:    z.string().datetime().nullable().default(null),
});

export type AvisoInput = z.infer<typeof avisoSchema>;

export const marcarLidoSchema = z.object({
  idAviso: z.number().int().positive(),
});

export type MarcarLidoInput = z.infer<typeof marcarLidoSchema>;
