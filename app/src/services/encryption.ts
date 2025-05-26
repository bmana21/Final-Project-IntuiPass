const charSets = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  special: '!@#$%^&*()_+-=[]{}|;:,.<>?'
};

function getRandomString(length: number): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => ('0' + byte.toString(16)).slice(-2)).join('');
}

export async function encryptWithSalt(input: string, salt?: string, randomChars?: string) {
  if (!salt) {
    salt = getRandomString(16);
  }

  if (!randomChars) {
    randomChars =
      charSets.uppercase.charAt(Math.floor(Math.random() * charSets.uppercase.length)) +
      charSets.lowercase.charAt(Math.floor(Math.random() * charSets.lowercase.length)) +
      charSets.numbers.charAt(Math.floor(Math.random() * charSets.numbers.length)) +
      charSets.special.charAt(Math.floor(Math.random() * charSets.special.length));
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(input + randomChars + salt);

  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return { hash: hashHex, salt, randomChars };
}

export async function verifyHash(
  input: string,
  storedHash: string,
  storedSalt: string,
  storedRandomChars: string
) {
  const { hash } = await encryptWithSalt(input, storedSalt, storedRandomChars);
  return hash === storedHash;
}
