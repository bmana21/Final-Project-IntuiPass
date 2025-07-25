import 'vitest'

declare global {
  var cryptoTestUtils: {
    randomBytes: (length: number) => Uint8Array
    arrayBufferToHex: (buffer: ArrayBuffer) => string
    hexToArrayBuffer: (hex: string) => ArrayBuffer
    stringToArrayBuffer: (str: string) => Uint8Array
    arrayBufferToString: (buffer: ArrayBuffer) => string
  }
}

interface CustomMatchers<R = unknown> {
  toBeValidKey(): R
  toHaveByteLength(length: number): R
}

declare module 'vitest' {
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}