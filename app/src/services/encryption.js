
import { randomBytes, createHash } from 'crypto';
    
const charSets = {
        uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        lowercase: 'abcdefghijklmnopqrstuvwxyz',
        numbers: '0123456789',
        special: '!@#$%^&*()_+-=[]{}|;:,.<>?'
  };

function encryptWithSalt(input, salt = null, randomChars = null) {
    // Generate a random salt if none provided
    if (salt == null) {
        salt = randomBytes(16).toString('hex');
    }
    

    if (randomChars == null) {
        randomChars = charSets.uppercase.charAt(Math.floor(Math.random() * charSets.uppercase.length));
        randomChars += charSets.lowercase.charAt(Math.floor(Math.random() * charSets.lowercase.length));
        randomChars += charSets.numbers.charAt(Math.floor(Math.random() * charSets.numbers.length));
        randomChars += charSets.special.charAt(Math.floor(Math.random() * charSets.special.length));
    }
    
    // Create hash using the input and salt
    const hash = createHash('sha256')
      .update(input + randomChars + salt)
      .digest('hex');
    
    return {
      hash,
      salt: salt,
      randomChars: randomChars
    };
}


function verifyHash(input, storedHash, storedSalt, storedRandomChars) {
    const { hash } = encryptWithSalt(input, storedSalt, storedRandomChars);
    return hash === storedHash;
}

const password = "mySecurePassword123";
// Encrypt the password (for storage)
const encrypted = encryptWithSalt(password);
console.log("Hash:", encrypted.hash);
console.log("Salt:", encrypted.salt);
console.log("Random Chars:", encrypted.randomChars);

// Later, verify a login attempt
const loginAttempt = "mySecurePassword123";
const isValid = verifyHash(loginAttempt, encrypted.hash, encrypted.salt, encrypted.randomChars);
console.log("Valid password:", isValid);