import { Crypto } from '@peculiar/webcrypto'
import { vi, expect } from 'vitest'

// Polyfill Web Crypto API for Node.js environment
if (typeof globalThis.crypto === 'undefined') {
  globalThis.crypto = new Crypto()
}

// Alternative: Use @peculiar/webcrypto for broader compatibility
// globalThis.crypto = new Crypto()

// Setup crypto test utilities
globalThis.cryptoTestUtils = {
  // Generate random bytes
  randomBytes: (length) => {
    const array = new Uint8Array(length)
    crypto.getRandomValues(array)
    return array
  },
  
  // Convert between different formats
  arrayBufferToHex: (buffer) => {
    return Array.from(new Uint8Array(buffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  },
  
  hexToArrayBuffer: (hex) => {
    const bytes = new Uint8Array(hex.length / 2)
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16)
    }
    return bytes.buffer
  },
  
  // String encoding utilities
  stringToArrayBuffer: (str) => {
    return new TextEncoder().encode(str)
  },
  
  arrayBufferToString: (buffer) => {
    return new TextDecoder().decode(buffer)
  }
}

// Global test matchers for crypto
expect.extend({
  toBeValidKey: (received) => {
    const pass = received instanceof CryptoKey
    return {
      message: () => `expected ${received} to be a valid CryptoKey`,
      pass
    }
  },
  
  toHaveByteLength: (received, length) => {
    const actualLength = received.byteLength || received.length
    const pass = actualLength === length
    return {
      message: () => `expected byte length ${actualLength} to equal ${length}`,
      pass
    }
  }
})