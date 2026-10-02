import { createCipheriv, pbkdf2Sync, randomBytes } from 'node:crypto';

export const ITERATIONS = 300_000;

export function newSalt() {
  return randomBytes(16).toString('base64');
}

export function sealPayload(payload, flag, salt, iterations = ITERATIONS) {
  const key = pbkdf2Sync(flag, Buffer.from(salt, 'base64'), iterations, 32, 'sha256');
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const body = Buffer.concat([cipher.update(JSON.stringify(payload), 'utf8'), cipher.final()]);
  // WebCrypto expects the GCM tag appended to the ciphertext.
  const data = Buffer.concat([body, cipher.getAuthTag()]);
  return { iv: iv.toString('base64'), data: data.toString('base64') };
}
