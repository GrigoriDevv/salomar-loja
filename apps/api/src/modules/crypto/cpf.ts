import {
  FieldCryptoError,
  decryptField,
  encryptField,
  hmacSha256,
} from './field-crypto'

export class InvalidCpfError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidCpfError'
  }
}

/** Digits only; rejects wrong length / all-same-digit / invalid check digits. */
export function normalizeCpf(input: string): string {
  const digits = input.replace(/\D/g, '')
  if (digits.length !== 11) {
    throw new InvalidCpfError('CPF must have 11 digits')
  }
  if (/^(\d)\1{10}$/.test(digits)) {
    throw new InvalidCpfError('CPF has invalid repeated digits')
  }

  const calcCheck = (base: string, factorStart: number): number => {
    let sum = 0
    for (let i = 0; i < base.length; i += 1) {
      sum += Number(base[i]) * (factorStart - i)
    }
    const mod = (sum * 10) % 11
    return mod === 10 ? 0 : mod
  }

  const d1 = calcCheck(digits.slice(0, 9), 10)
  const d2 = calcCheck(digits.slice(0, 10), 11)
  if (d1 !== Number(digits[9]) || d2 !== Number(digits[10])) {
    throw new InvalidCpfError('CPF check digits are invalid')
  }

  return digits
}

export function hashCpfForLookup(cpf: string): string {
  const normalized = normalizeCpf(cpf)
  return hmacSha256(normalized)
}

export function encryptCpf(cpf: string): string {
  const normalized = normalizeCpf(cpf)
  return encryptField(normalized)
}

export function decryptCpf(ciphertext: string): string {
  try {
    return decryptField(ciphertext)
  } catch (error) {
    if (error instanceof FieldCryptoError) {
      throw error
    }
    throw new FieldCryptoError('Failed to decrypt CPF')
  }
}

export type EncryptedCpfFields = {
  cpfEncrypted: string
  cpfLookupHash: string
}

export function buildEncryptedCpfFields(cpf: string): EncryptedCpfFields {
  const normalized = normalizeCpf(cpf)
  return {
    cpfEncrypted: encryptField(normalized),
    cpfLookupHash: hmacSha256(normalized),
  }
}
