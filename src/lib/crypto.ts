import CryptoJS from 'crypto-js';

export class ForensicCrypto {
  private static readonly SALT_LENGTH = 32;
  private static readonly IV_LENGTH = 16;

  static generateSalt(): string {
    return CryptoJS.lib.WordArray.random(this.SALT_LENGTH).toString();
  }

  static generateIV(): string {
    return CryptoJS.lib.WordArray.random(this.IV_LENGTH).toString();
  }

  static deriveKey(password: string, salt: string): string {
    // SECURITY: Increased to 100,000 iterations for better protection against brute force
    return CryptoJS.PBKDF2(password, salt, {
      keySize: 256 / 32,
      iterations: 100000
    }).toString();
  }

  static encrypt(data: string, key: string): { encrypted: string; iv: string } {
    const iv = this.generateIV();
    const encrypted = CryptoJS.AES.encrypt(data, key, {
      iv: CryptoJS.enc.Hex.parse(iv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    }).toString();

    return { encrypted, iv };
  }

  static decrypt(encryptedData: string, key: string, iv: string): string {
    const decrypted = CryptoJS.AES.decrypt(encryptedData, key, {
      iv: CryptoJS.enc.Hex.parse(iv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    return decrypted.toString(CryptoJS.enc.Utf8);
  }

  static calculateSHA256(data: string): string {
    return CryptoJS.SHA256(data).toString();
  }

  static calculateMD5(data: string): string {
    return CryptoJS.MD5(data).toString();
  }

  static calculateHMAC(data: string, key: string): string {
    return CryptoJS.HmacSHA256(data, key).toString();
  }

  static verifyHMAC(data: string, key: string, signature: string): boolean {
    const calculatedSignature = this.calculateHMAC(data, key);
    return calculatedSignature === signature;
  }
}