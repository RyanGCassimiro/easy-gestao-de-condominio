import { z } from 'zod';
import { validarCPF } from '../../utils/cpfValidator';
import { validarCNPJ } from '../../utils/cnpjValidator';

// T01 — Login
export const loginSchema = z.object({
  email:  z.string().email('E-mail inválido'),
  senha:  z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
  perfil: z.enum(['morador', 'comerciante']),
});

export type LoginInput = z.infer<typeof loginSchema>;

// T02 — Cadastro Morador
export const registerMoradorSchema = z.object({
  nome:           z.string().min(3).max(200).trim(),
  cpf:            z.string().refine(validarCPF, 'CPF inválido'),
  unidade:        z.string().min(1).max(20),
  bloco:          z.string().min(1).max(20),
  email:          z.string().email(),
  senha:          z.string()
                    .min(8, 'Mínimo 8 caracteres')
                    .regex(/[A-Z]/, 'Precisa de uma letra maiúscula')
                    .regex(/[0-9]/, 'Precisa de um número'),
  confirmarSenha: z.string(),
  aceitouTermos:  z.literal(true, {
                    errorMap: () => ({ message: 'Aceite os termos para continuar' }),
                  }),
  timestampAceite: z.string().datetime().optional(),
}).refine(d => d.senha === d.confirmarSenha, {
  path: ['confirmarSenha'],
  message: 'Senhas não conferem',
});

export type RegisterMoradorInput = z.infer<typeof registerMoradorSchema>;

// T02 — Cadastro Comerciante
export const registerComercianteSchema = z.object({
  nomeFantasia:     z.string().min(2).max(200).trim(),
  cnpj:             z.string().refine(validarCNPJ, 'CNPJ inválido'),
  nomeResponsavel:  z.string().min(3).max(200).trim(),
  email:            z.string().email(),
  senha:            z.string()
                      .min(8, 'Mínimo 8 caracteres')
                      .regex(/[A-Z]/, 'Precisa de uma letra maiúscula')
                      .regex(/[0-9]/, 'Precisa de um número'),
  confirmarSenha:   z.string(),
  aceitouTermos:    z.literal(true, {
                      errorMap: () => ({ message: 'Aceite os termos para continuar' }),
                    }),
  timestampAceite:  z.string().datetime().optional(),
}).refine(d => d.senha === d.confirmarSenha, {
  path: ['confirmarSenha'],
  message: 'Senhas não conferem',
});

export type RegisterComercianteInput = z.infer<typeof registerComercianteSchema>;

// T03 — Recuperação de Senha
export const forgotPasswordSchema = z.object({
  email: z.string().email('E-mail inválido').trim().toLowerCase(),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
