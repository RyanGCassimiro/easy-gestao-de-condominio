import { z } from 'zod';

// T10 — Fofuras (Pets)
// LGPD Art.14: se o responsável for menor de 18 anos,
// exigir consentimento de responsável legal.
export const petSchema = z.object({
  nome:       z.string().min(1).max(100).trim(),
  raca:       z.string().min(1).max(100).trim(),
  especie:    z.enum(['cachorro', 'gato', 'ave', 'outro']),
  // imagemUrl: EXIF removido antes do upload
  imagemUrl:  z.string().url().optional(),
  dataNasc:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  observacao: z.string().max(500).trim().optional(),
  // LGPD Art.14 — minimização: apenas campos obrigatórios ao negócio
  consentimentoLGPD: z.literal(true, {
    errorMap: () => ({ message: 'Consentimento LGPD obrigatório' }),
  }),
});

export type PetInput = z.infer<typeof petSchema>;

export const editarPetSchema = petSchema.partial().extend({
  idPet: z.number().int().positive(),
  consentimentoLGPD: z.literal(true).optional(),
});

export type EditarPetInput = z.infer<typeof editarPetSchema>;
