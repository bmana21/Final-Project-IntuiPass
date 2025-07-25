import { describe, it, expect } from 'vitest'
import { encrypt_AES, decrypt_AES, generateRandomPassword, encrypt, decrypt } from '../src/services/encryption'

describe('AES-GCM Encryption Functions', () => {
  
  it('should encrypt and decrypt text successfully', async () => {
    const plaintext = 'Hello World!'
    const password = 'test-password-123'
    
    const encrypted = await encrypt_AES(plaintext, password)
    const decrypted = await decrypt_AES(encrypted, password)
    
    expect(decrypted).toBe(plaintext)
  })

  it('should produce different encrypted outputs for same input', async () => {
    const plaintext = 'same text'
    const password = 'same-password'
    
    const encrypted1 = await encrypt_AES(plaintext, password)
    const encrypted2 = await encrypt_AES(plaintext, password)
    
    expect(encrypted1).not.toBe(encrypted2)
  })

  it('should handle empty string encryption', async () => {
    const plaintext = ''
    const password = 'password'
    
    const encrypted = await encrypt_AES(plaintext, password)
    const decrypted = await decrypt_AES(encrypted, password)
    
    expect(decrypted).toBe(plaintext)
  })

  it('should handle long text encryption', async () => {
    const plaintext = 'a'.repeat(10000)
    const password = 'password'
    
    const encrypted = await encrypt_AES(plaintext, password)
    const decrypted = await decrypt_AES(encrypted, password)
    
    expect(decrypted).toBe(plaintext)
  })

  it('should handle very short passwords', async () => {
    const plaintext = 'test'
    const password = 'a'
    
    const encrypted = await encrypt_AES(plaintext, password)
    const decrypted = await decrypt_AES(encrypted, password)
    
    expect(decrypted).toBe(plaintext)
  })

  it('should handle passwords with special characters', async () => {
    const plaintext = 'test'
    const password = '!@#$%^&*()_+-=[]{}|;:,.<>?'
    
    const encrypted = await encrypt_AES(plaintext, password)
    const decrypted = await decrypt_AES(encrypted, password)
    
    expect(decrypted).toBe(plaintext)
  })

  it('should fail with wrong password', async () => {
    const plaintext = 'secret message'
    const password = 'correct-password'
    const wrongPassword = 'wrong-password'
    
    const encrypted = await encrypt_AES(plaintext, password)
    
    await expect(decrypt_AES(encrypted, wrongPassword)).rejects.toThrow('Decryption failed')
  })

})
