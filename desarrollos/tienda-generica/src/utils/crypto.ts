/**
 * Cryptographic utility for securing credentials and sensitive hashes
 * Uses browser-native Web Crypto API (SHA-256) with zero external dependencies
 */

const SALT_PREFIX = 'titufaris_sec_v2026_';

export async function hashCredential(plaintext: string): Promise<string> {
  if (!plaintext) return '';
  // If it's already a 64-character SHA-256 hex string, return it as-is
  if (/^[a-f0-9]{64}$/i.test(plaintext)) {
    return plaintext;
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(SALT_PREFIX + plaintext);
  
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Fallback for non-crypto environments (SSR/Worker)
  let hash = 0;
  for (let i = 0; i < plaintext.length; i++) {
    const char = plaintext.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return 'fallback_' + Math.abs(hash).toString(16);
}

export async function verifyCredential(plaintext: string, storedHashOrPlain: string): Promise<boolean> {
  if (!plaintext || !storedHashOrPlain) return false;
  
  // Direct match for legacy plaintext migration
  if (plaintext === storedHashOrPlain) return true;

  // SHA-256 comparison
  const calculated = await hashCredential(plaintext);
  return calculated.toLowerCase() === storedHashOrPlain.toLowerCase();
}
