import { z } from 'zod';

// T06 — Reservas de Espaços Comuns
export const reservaSchema = z.object({
  idEspaco:   z.number().int().positive({ message: 'Selecione um espaço comum' }),
  data:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (YYYY-MM-DD)'),
  horaInicio: z.string().regex(/^\d{2}:\d{2}$/, 'Hora inválida (HH:MM)'),
  horaFim:    z.string().regex(/^\d{2}:\d{2}$/, 'Hora inválida (HH:MM)'),
  observacao: z.string().max(500).trim().optional(),
}).refine(
  d => d.horaInicio < d.horaFim,
  { path: ['horaFim'], message: 'Hora fim deve ser maior que hora início' },
);

export type ReservaInput = z.infer<typeof reservaSchema>;

export const cancelarReservaSchema = z.object({
  idReserva: z.number().int().positive(),
  motivo:    z.string().max(300).trim().optional(),
});

export type CancelarReservaInput = z.infer<typeof cancelarReservaSchema>;
