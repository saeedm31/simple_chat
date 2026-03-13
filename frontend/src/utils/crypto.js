import CryptoJS from 'crypto-js';

/**
 * AES-256-CBC encryption/decryption using crypto-js.
 * This replaces the Web Crypto API to ensure compatibility in non-secure contexts (like self-signed IPs).
 * The key is a base64-encoded 32-byte random string.
 */

/**
 * Generate a strong 256-bit AES key from a passphrase using PBKDF2.
 * This ensures the same passphrase always results in the same key.
 */
export function deriveKey(passphrase) {
  // We use a fixed salt for simplicity since the security comes from the 
  // passphrase being shared in-person and never stored on the server.
  const salt = CryptoJS.enc.Utf8.parse('simple-chat-v1-salt');
  const key = CryptoJS.PBKDF2(passphrase, salt, {
    keySize: 256 / 32,
    iterations: 1000
  });
  return key.toString(CryptoJS.enc.Base64);
}

/**
 * Generate a random 32-byte AES key as a base64 string.
 * @deprecated Use deriveKey for passphrase-based E2EE.
 */
export function generateKey() {
  const bytes = CryptoJS.lib.WordArray.random(32);
  return bytes.toString(CryptoJS.enc.Base64);
}

/**
 * Encrypt a plaintext string with the given base64 AES key.
 * Returns { ciphertext: base64string, iv: base64string }
 */
export async function encryptMessage(plaintext, base64Key) {
  const key = CryptoJS.enc.Base64.parse(base64Key);
  const iv = CryptoJS.lib.WordArray.random(16);
  
  const encrypted = CryptoJS.AES.encrypt(plaintext, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });

  return {
    ciphertext: encrypted.ciphertext.toString(CryptoJS.enc.Base64),
    iv: iv.toString(CryptoJS.enc.Base64)
  };
}

/**
 * Decrypt a base64 ciphertext using the given base64 AES key and IV.
 * Returns the original plaintext string.
 */
export async function decryptMessage(base64Ciphertext, base64Iv, base64Key) {
  try {
    const key = CryptoJS.enc.Base64.parse(base64Key);
    const iv = CryptoJS.enc.Base64.parse(base64Iv);
    
    const decrypted = CryptoJS.AES.decrypt(base64Ciphertext, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    const result = decrypted.toString(CryptoJS.enc.Utf8);
    if (!result) throw new Error('Decryption resulted in empty string');
    return result;
  } catch (err) {
    console.error('Decryption error:', err);
    return '[decryption failed]';
  }
}
