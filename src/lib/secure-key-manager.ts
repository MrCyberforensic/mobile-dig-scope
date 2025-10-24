// Secure Key Manager for Forensic Cases
// SECURITY: Keys are derived from user passwords and never stored in plaintext

import { ForensicCrypto } from './crypto';
import { ForensicDatabase } from './database';

export class SecureKeyManager {
  private database: ForensicDatabase;
  // In-memory cache of derived keys (cleared on session end)
  private keyCache: Map<string, { key: string; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes

  constructor(database: ForensicDatabase) {
    this.database = database;
  }

  /**
   * Derive encryption key from password and case salt
   * SECURITY: Key is derived on-demand, never stored permanently
   */
  async deriveKeyForCase(caseId: string, password: string): Promise<string> {
    const forensicCase = await this.database.getCase(caseId);
    if (!forensicCase) {
      throw new Error('Case not found');
    }

    if (!forensicCase.encryptionSalt) {
      throw new Error('Case encryption salt not found');
    }

    // Check cache first (for performance during active session)
    const cached = this.keyCache.get(caseId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.key;
    }

    // Derive key from password + salt
    const key = ForensicCrypto.deriveKey(password, forensicCase.encryptionSalt);

    // Cache for session
    this.keyCache.set(caseId, {
      key,
      timestamp: Date.now()
    });

    return key;
  }

  /**
   * Verify password is correct for a case
   * SECURITY: Uses stored verification hash
   */
  async verifyPassword(caseId: string, password: string): Promise<boolean> {
    try {
      const forensicCase = await this.database.getCase(caseId);
      if (!forensicCase?.passwordVerificationHash || !forensicCase.encryptionSalt) {
        return false;
      }

      // Derive key and compare hash
      const derivedKey = ForensicCrypto.deriveKey(password, forensicCase.encryptionSalt);
      const verificationHash = ForensicCrypto.calculateSHA256(derivedKey);

      return verificationHash === forensicCase.passwordVerificationHash;
    } catch (error) {
      console.error('Password verification failed:', error);
      return false;
    }
  }

  /**
   * Clear cached keys (call on logout/session end)
   * SECURITY: Ensures keys don't persist in memory
   */
  clearCache(): void {
    this.keyCache.clear();
  }

  /**
   * Clear specific case key from cache
   */
  clearCaseKey(caseId: string): void {
    this.keyCache.delete(caseId);
  }

  /**
   * Get encryption key for custody log operations
   * SECURITY: Retrieves key from cache or requires password
   */
  async getKeyForCustodyLog(caseId: string, password?: string): Promise<string> {
    // Try cache first
    const cached = this.keyCache.get(caseId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.key;
    }

    // If not cached and no password provided, throw error
    if (!password) {
      throw new Error('Password required to access case encryption key');
    }

    // Derive and cache
    return await this.deriveKeyForCase(caseId, password);
  }
}
