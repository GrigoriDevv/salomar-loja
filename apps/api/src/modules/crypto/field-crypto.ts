import { createHash, createHmac, createCipheriv, createDecipheriv, hkdfSync, randomBytes } from 'node:crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const KEY_LENGTH = 32

export class FieldCryptoError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'FieldCryptoError'
  }
}

function masterKeyFromEnv(envKey = 'FIELD_ENCRYPTION_KEY'): Buffer {
  const raw = process.env[envKey]?.trim()
  if (!raw) {
    throw new FieldCryptoError(`${envKey} is not set`)
  }
  const key = Buffer.from(raw, 'base64')
  if (key.length !== KEY_LENGTH) {
    throw new FieldCryptoError(
      `${envKey} must be 32 bytes encoded as base64 (got ${key.length} bytes)`,
    )
  }
  return key
}

function deriveKey(master: Buffer, info: string): Buffer {
  return Buffer.from(hkdfSync('sha256', master, Buffer.alloc(0), info, KEY_LENGTH))
}

export function getEncryptionKey(): Buffer {
  return deriveKey(masterKeyFromEnv(), 'salomar-field-encrypt-v1')
}

export function getHmacKey(): Buffer {
  return deriveKey(masterKeyFromEnv(), 'salomar-field-hmac-v1')
}

/** Format: base64(iv).base64(tag).base64(ciphertext) */
export function encryptField(plaintext: string, key = getEncryptionKey()): string {
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ])
  const tag = cipher.getAuthTag()
  return [
    iv.toString('base64'),
    tag.toString('base64'),
    encrypted.toString('base64'),
  ].join('.')
}

export function decryptField(payload: string, key = getEncryptionKey()): string {
  const parts = payload.split('.')
  if (parts.length !== 3) {
    throw new FieldCryptoError('Invalid encrypted payload format')
  }
  const [ivB64, tagB64, dataB64] = parts
  const iv = Buffer.from(ivB64, 'base64')
  const tag = Buffer.from(tagB64, 'base64')
  const data = Buffer.from(dataB64, 'base64')
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8')
}

export function hmacSha256(value: string, key = getHmacKey()): string {
  return createHmac('sha256', key).update(value, 'utf8').digest('hex')
}

/** Deterministic helper for tests that need a valid env key. */
export function generateFieldEncryptionKeyBase64(): string {
  return randomBytes(KEY_LENGTH).toString('base64')
}

export function sha256Hex(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}
