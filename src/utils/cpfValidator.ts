import * as Crypto from 'expo-crypto';

export function validarCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;

  const calc = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += parseInt(digits[i]) * (len + 1 - i);
    const rem = (sum * 10) % 11;
    return rem === 10 || rem === 11 ? 0 : rem;
  };

  return calc(9) === parseInt(digits[9]) && calc(10) === parseInt(digits[10]);
}

export async function hashCPF(cpf: string, salt: string): Promise<string> {
  const digits = cpf.replace(/\D/g, '');
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, digits + salt);
}
