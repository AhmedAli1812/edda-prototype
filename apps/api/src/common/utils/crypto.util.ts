import * as crypto from 'crypto';

/**
 * Computes an HMAC-SHA256 digest for an OTP code using the dedicated OTP_PEPPER.
 */
export function hashOtp(code: string, pepper: string): string {
  if (!pepper || pepper.length < 32) {
    throw new Error('OTP_PEPPER must be configured and at least 32 characters long');
  }
  return crypto.createHmac('sha256', pepper).update(code.trim()).digest('hex');
}

/**
 * Constant-time comparison between candidate OTP code and stored HMAC-SHA256 hash.
 */
export function verifyOtpHash(candidate: string, storedHash: string, pepper: string): boolean {
  if (!candidate || !storedHash || !pepper) return false;
  const candidateHash = hashOtp(candidate, pepper);
  const bufA = Buffer.from(candidateHash, 'hex');
  const bufB = Buffer.from(storedHash, 'hex');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Encrypts sensitive data (e.g. National ID) using AES-256-GCM.
 * Key must be a 32-byte key encoded in Base64.
 * Output format: iv_hex:auth_tag_hex:ciphertext_hex
 */
export function encryptAesGcm(plainText: string, base64Key: string): string {
  const key = Buffer.from(base64Key, 'base64');
  if (key.length !== 32) {
    throw new Error('AES-256-GCM encryption key must decode to exactly 32 bytes');
  }

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts AES-256-GCM encrypted payload.
 */
export function decryptAesGcm(encryptedPayload: string, base64Key: string): string {
  const key = Buffer.from(base64Key, 'base64');
  if (key.length !== 32) {
    throw new Error('AES-256-GCM encryption key must decode to exactly 32 bytes');
  }

  const parts = encryptedPayload.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted payload format');
  }

  const [ivHex, tagHex, cipherHex] = parts;
  const iv = Buffer.from(ivHex!, 'hex');
  const tag = Buffer.from(tagHex!, 'hex');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(cipherHex!, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Computes deterministic HMAC-SHA256 fingerprint of National ID for uniqueness checks.
 */
export function computeNationalIdFingerprint(nationalId: string, hmacKey: string): string {
  if (!hmacKey || hmacKey.length < 32) {
    throw new Error('NATIONAL_ID_HMAC_KEY must be configured and at least 32 characters long');
  }
  return crypto.createHmac('sha256', hmacKey).update(nationalId.trim()).digest('hex');
}

/**
 * Masks National ID for logs and safe display: only shows last 4 digits.
 * Example: 29801010101234 -> **********1234
 */
export function maskNationalId(nationalId: string): string {
  if (!nationalId || nationalId.length <= 4) return '****';
  const lastFour = nationalId.slice(-4);
  return '*'.repeat(nationalId.length - 4) + lastFour;
}

/**
 * Hashes an IP address with a salt for privacy-safe rate limiting and audit storage.
 */
export function hashIp(ip: string, salt: string): string {
  return crypto.createHash('sha256').update(`${ip}:${salt}`).digest('hex').substring(0, 32);
}

/**
 * Constant-time comparison for refresh token verifiers.
 */
export function verifyVerifierHash(rawVerifier: string, storedHash: string, secret: string): boolean {
  if (!rawVerifier || !storedHash || !secret) return false;
  const candidateHash = crypto.createHmac('sha256', secret).update(rawVerifier).digest('hex');
  const bufA = Buffer.from(candidateHash, 'hex');
  const bufB = Buffer.from(storedHash, 'hex');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}
