import { PatternType } from '../models/pattern-type';
import { UserPatternData } from '../models/user-pattern-data';


function getRandomString(length: number): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => ('0' + byte.toString(16)).slice(-2)).join('');
}

/**
 * Encrypts plaintext using AES-GCM (without salt)
 * @param plaintext - The text to encrypt
 * @param password - The password/key as string
 * @returns Promise that resolves to base64 encoded encrypted data with IV
 * @throws Error if encryption fails
 */
export async function encrypt_AES(plaintext: string, password: string): Promise<string> {
  try {
    // Convert password directly to key (no salt)
    const encoder = new TextEncoder();
    const keyData = await crypto.subtle.digest('SHA-256', encoder.encode(password));
    const key: CryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );

    // Generate IV
    const iv: Uint8Array = crypto.getRandomValues(new Uint8Array(12));
    
    // Encrypt the plaintext
    const encodedPlaintext: Uint8Array = encoder.encode(plaintext);
    const ciphertext: ArrayBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encodedPlaintext
    );

    // Combine iv + ciphertext (no salt)
    const combined: Uint8Array = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertext), iv.length);

    // Return base64 encoded result
    return btoa(String.fromCharCode.apply(null, Array.from(combined)));
  } catch (error) {
    throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Decrypts ciphertext using AES-GCM (without salt)
 * @param encryptedData - Base64 encoded encrypted data
 * @param password - The password/key as string
 * @returns Promise that resolves to the decrypted plaintext
 * @throws Error if decryption fails
 */
export async function decrypt_AES(encryptedData: string, password: string): Promise<string> {
  try {
    // Decode base64
    const combined: Uint8Array = new Uint8Array(
      atob(encryptedData).split('').map((char: string) => char.charCodeAt(0))
    );

    // Extract iv and ciphertext (no salt)
    const iv: Uint8Array = combined.slice(0, 12);
    const ciphertext: Uint8Array = combined.slice(12);

    // Convert password directly to key (same as encryption)
    const encoder = new TextEncoder();
    const keyData = await crypto.subtle.digest('SHA-256', encoder.encode(password));
    const key: CryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );

    // Decrypt the ciphertext
    const decryptedBuffer: ArrayBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      ciphertext
    );

    // Convert back to string
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

const charSets = {
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    special: '!@#$%^&*()_+-=[]{}|;:,.<>?'
};

function getRandomChars(charset: string, count: number): string {
  let result = '';
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    result += charset[randomIndex];
  }
  return result;
}


export async function encrypt(key: string, user_uid: string, pattern_type: PatternType, website_url: string): Promise<[UserPatternData, string]> {
  
  const uppercaseChars = getRandomChars(charSets.uppercase, 2);
  const lowercaseChars = getRandomChars(charSets.lowercase, 2);
  const numberChars = getRandomChars(charSets.numbers, 2);
  const specialChars = getRandomChars(charSets.special, 2);
  
  const hexString = getRandomString(16);
  const randomChars = (uppercaseChars + lowercaseChars + numberChars + specialChars)
  const password = randomChars + hexString;

  const encrypted_password = await encrypt_AES(password, key);

  const userPatternData = new UserPatternData(
    user_uid,
    pattern_type,
    website_url,
    encrypted_password
  );

  return [userPatternData, password];
}

export async function decrypt(userPatternData: UserPatternData, key: string): Promise<string> {
  const encryptionKey = key;
  return await decrypt_AES(userPatternData.password_encrypted, encryptionKey);
}
