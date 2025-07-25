import { describe, it, expect } from 'vitest'
import { encrypt_AES, decrypt_AES, generateRandomPassword, encrypt, decrypt } from '../src/services/encryption'
import { PatternType } from '../src/models/pattern-type'

describe('High-level Encrypt/Decrypt Functions', () => {
  
  it('should encrypt and return UserPatternData with password', async () => {
    const key = 'master-key'
    const userUid = 'user123'
    const username = 'testuser'
    const patternType = PatternType.CONNECT_DOTS
    const websiteUrl = 'https://example.com'
    
    const [userPatternData, password] = await encrypt(key, userUid, username, patternType, websiteUrl)
    
    expect(userPatternData.user_uuid).toBe(userUid)
    expect(userPatternData.pattern_type).toBe(patternType)
    expect(userPatternData.username).toBe(username)
    expect(userPatternData.website_url).toBe(websiteUrl)
    expect(userPatternData.password_encrypted).toBeDefined()
    expect(password).toHaveLength(40)
  })

  it('should decrypt password from UserPatternData', async () => {
    const key = 'master-key'
    const userUid = 'user123'
    const username = 'testuser'
    const patternType = PatternType.CHESS_BOARD
    const websiteUrl = 'https://example.com'
    
    const [userPatternData, originalPassword] = await encrypt(key, userUid, username, patternType, websiteUrl)
    const decryptedPassword = await decrypt(userPatternData, key)
    
    expect(decryptedPassword).toBe(originalPassword)
  })

  it('should fail to decrypt with wrong key', async () => {
    const key = 'master-key'
    const wrongKey = 'wrong-key'
    const userUid = 'user123'
    const username = 'testuser'
    const patternType = PatternType.MATHEMATICAL_FORMULA
    const websiteUrl = 'https://example.com'
    
    const [userPatternData] = await encrypt(key, userUid, username, patternType, websiteUrl)
    
    await expect(decrypt(userPatternData, wrongKey)).rejects.toThrow('Decryption failed')
  })

})