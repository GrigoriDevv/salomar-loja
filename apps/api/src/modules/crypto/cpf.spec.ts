import {
  decryptCpf,
  encryptCpf,
  hashCpfForLookup,
  InvalidCpfError,
  normalizeCpf,
} from './cpf'
import { generateFieldEncryptionKeyBase64 } from './field-crypto'

describe('cpf crypto', () => {
  const validCpf = '529.982.247-25'

  beforeAll(() => {
    process.env.FIELD_ENCRYPTION_KEY = generateFieldEncryptionKeyBase64()
  })

  it('normaliza e valida CPF', () => {
    expect(normalizeCpf(validCpf)).toBe('52998224725')
    expect(() => normalizeCpf('111.111.111-11')).toThrow(InvalidCpfError)
    expect(() => normalizeCpf('123')).toThrow(InvalidCpfError)
  })

  it('hash de lookup é estável', () => {
    const a = hashCpfForLookup(validCpf)
    const b = hashCpfForLookup('52998224725')
    expect(a).toBe(b)
    expect(a).toHaveLength(64)
  })

  it('encrypt/decrypt roundtrip', () => {
    const cipher = encryptCpf(validCpf)
    expect(cipher.split('.')).toHaveLength(3)
    expect(decryptCpf(cipher)).toBe('52998224725')
  })
})
