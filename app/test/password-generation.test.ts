import { describe, it, expect } from 'vitest'
import { generateRandomPassword } from '../src/services/encryption'

describe('Password Generation', () => {
  
  it('should generate password with correct length', () => {
    const password = generateRandomPassword()
    
    expect(password).toHaveLength(40)
  })

  it('should generate different passwords each time', () => {
    const password1 = generateRandomPassword()
    const password2 = generateRandomPassword()
    
    expect(password1).not.toBe(password2)
  })

  it('should contain required character types', () => {
    const password = generateRandomPassword()
    
    expect(password).toMatch(/[A-Z]/)
    expect(password).toMatch(/[a-z]/)
    expect(password).toMatch(/[0-9]/)
    expect(password).toMatch(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/)
  })

})