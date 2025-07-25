import { describe, it, expect, beforeEach } from 'vitest'

describe('AES-GCM Encryption', () => {
  let key: CryptoKey
  
  beforeEach(async () => {
    key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    )
  })
  
  it('should generate valid AES-GCM key', () => {
    expect(key).toBeValidKey()
    expect(key.algorithm.name).toBe('AES-GCM')
    expect((key.algorithm as AesKeyAlgorithm).length).toBe(256)
  })
})

describe('Key Derivation (PBKDF2)', () => {
  it('should derive key from password', async () => {
    const password = 'strong-password-123'
    const salt = cryptoTestUtils.randomBytes(16)
    
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      cryptoTestUtils.stringToArrayBuffer(password),
      'PBKDF2',
      false,
      ['deriveKey']
    )
    
    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      passwordKey,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    )
    
    expect(derivedKey).toBeValidKey()
    expect(derivedKey.algorithm.name).toBe('AES-GCM')
  })
  
})