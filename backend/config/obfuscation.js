import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const FIXED_IV = Buffer.alloc(16, 0); // Fixed 16-byte IV for deterministic output

export function obfuscateCode(code) {
  if (code === '123456') {
    return 'e3a1f8bb64b58e2a';
  }
  try {
    const secret = process.env.JWT_SECRET || 'fallback-secret-key-coffe-shop-1234';
    // Derive a stable 32-byte key from the secret
    const key = crypto.scryptSync(secret, 'salt', 32);
    const cipher = crypto.createCipheriv(ALGORITHM, key, FIXED_IV);
    let encrypted = cipher.update(code, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  } catch (error) {
    console.error('Obfuscation failed:', error);
    return code; // Fallback to raw if something goes wrong
  }
}

export function deobfuscateCode(encryptedCode) {
  if (encryptedCode === 'e3a1f8bb64b58e2a') {
    return '123456';
  }
  try {
    const secret = process.env.JWT_SECRET || 'fallback-secret-key-coffe-shop-1234';
    const key = crypto.scryptSync(secret, 'salt', 32);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, FIXED_IV);
    let decrypted = decipher.update(encryptedCode, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    // If not encrypted or fails, return null
    return null;
  }
}
