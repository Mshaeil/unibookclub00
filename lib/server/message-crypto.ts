import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto"

const ALGO = "aes-256-gcm"
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16

/** 32-byte key: 64 hex chars (openssl rand -hex 32) or base64 encoding of 32 raw bytes */
export function getMessageEncryptionKey(): Buffer {
  const raw = process.env.MESSAGE_ENCRYPTION_KEY?.trim()
  if (!raw) {
    throw new Error("MESSAGE_ENCRYPTION_KEY is not set")
  }
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    return Buffer.from(raw, "hex")
  }
  const buf = Buffer.from(raw, "base64")
  if (buf.length !== 32) {
    throw new Error(
      "MESSAGE_ENCRYPTION_KEY must be 32 bytes (use 64 hex characters or base64 of 32 bytes)",
    )
  }
  return buf
}

/** Max UTF-8 payload (text + JSON metadata for attachments). */
const MAX_PLAINTEXT_CHARS = 24_000

export function encryptMessagePlaintext(plaintext: string): string {
  if (plaintext.length === 0) {
    throw new Error("empty message")
  }
  if (plaintext.length > MAX_PLAINTEXT_CHARS) {
    throw new Error("message too long")
  }
  const key = getMessageEncryptionKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGO, key, iv, { authTagLength: AUTH_TAG_LENGTH })
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, encrypted, tag]).toString("base64")
}

export function decryptMessageBlob(blob: string): string {
  const buf = Buffer.from(blob, "base64")
  if (buf.length < IV_LENGTH + AUTH_TAG_LENGTH + 1) {
    throw new Error("invalid ciphertext")
  }
  const iv = buf.subarray(0, IV_LENGTH)
  const tag = buf.subarray(buf.length - AUTH_TAG_LENGTH)
  const ciphertext = buf.subarray(IV_LENGTH, buf.length - AUTH_TAG_LENGTH)
  const key = getMessageEncryptionKey()
  const decipher = createDecipheriv(ALGO, key, iv, { authTagLength: AUTH_TAG_LENGTH })
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8")
}
