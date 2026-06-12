import { z } from 'zod';

// T05 — Feed de Comércio Local
export const postagemSchema = z.object({
  titulo:      z.string().min(3).max(200).trim(),
  conteudo:    z.string().min(10).max(5000).trim(),
  // XSS: conteúdo passará por sanitizeFreeText antes de salvar
  imagemUrl:   z.string().url().optional(),
  isMaior18:   z.boolean().default(false),
  categorias:  z.array(z.string().max(50)).max(5).default([]),
  whatsappUrl: z.string().url().optional(),
});

export type PostagemInput = z.infer<typeof postagemSchema>;

export const curtidaSchema = z.object({
  idPostagem: z.number().int().positive(),
});

export type CurtidaInput = z.infer<typeof curtidaSchema>;

export const filtroFeedSchema = z.object({
  incluirMaior18: z.boolean().default(false),
  categoria:      z.string().max(50).optional(),
  pagina:         z.number().int().min(0).default(0),
  tamanhoPagina:  z.number().int().min(1).max(50).default(20),
});

export type FiltroFeedInput = z.infer<typeof filtroFeedSchema>;
