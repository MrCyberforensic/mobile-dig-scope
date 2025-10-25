// Authentication Database - Encrypted User Storage
// SECURITY: User credentials stored in encrypted IndexedDB

import { ForensicCrypto } from './crypto';

export interface AuthUser {
  id: string;
  name: string;
  badgeNumber: string;
  role: 'examiner' | 'supervisor' | 'auditor';
  passwordHash: string;
  salt: string;
  createdAt: Date;
  lastLogin?: Date;
}

export class AuthDatabase {
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'forensic_auth';
  private readonly DB_VERSION = 1;

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains('users')) {
          const userStore = db.createObjectStore('users', { keyPath: 'id' });
          userStore.createIndex('badgeNumber', 'badgeNumber', { unique: true });
        }

        if (!db.objectStoreNames.contains('sessions')) {
          db.createObjectStore('sessions', { keyPath: 'userId' });
        }
      };
    });
  }

  async createUser(userData: Omit<AuthUser, 'id' | 'passwordHash' | 'salt' | 'createdAt'>): Promise<{ user: AuthUser; password: string }> {
    const salt = ForensicCrypto.generateSalt();
    const password = this.generateSecurePassword();
    const passwordHash = ForensicCrypto.deriveKey(password, salt);

    const user: AuthUser = {
      id: crypto.randomUUID(),
      ...userData,
      passwordHash,
      salt,
      createdAt: new Date()
    };

    await this.storeUser(user);
    return { user, password };
  }

  async verifyPassword(badgeNumber: string, password: string): Promise<AuthUser | null> {
    const user = await this.getUserByBadgeNumber(badgeNumber);
    if (!user) return null;

    const passwordHash = ForensicCrypto.deriveKey(password, user.salt);
    if (passwordHash !== user.passwordHash) return null;

    // Update last login
    user.lastLogin = new Date();
    await this.storeUser(user);

    return user;
  }

  async getUserByBadgeNumber(badgeNumber: string): Promise<AuthUser | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['users'], 'readonly');
      const store = transaction.objectStore('users');
      const index = store.index('badgeNumber');
      const request = index.get(badgeNumber);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllUsers(): Promise<AuthUser[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['users'], 'readonly');
      const store = transaction.objectStore('users');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async storeUser(user: AuthUser): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['users'], 'readwrite');
      const store = transaction.objectStore('users');
      const request = store.put(user);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private generateSecurePassword(): string {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    const randomValues = new Uint8Array(length);
    crypto.getRandomValues(randomValues);
    
    for (let i = 0; i < length; i++) {
      password += charset[randomValues[i] % charset.length];
    }
    return password;
  }

  // Session management
  async storeSession(userId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const session = {
      userId,
      timestamp: Date.now(),
      lastActivity: Date.now()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sessions'], 'readwrite');
      const store = transaction.objectStore('sessions');
      const request = store.put(session);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getSession(userId: string): Promise<{ timestamp: number; lastActivity: number } | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sessions'], 'readonly');
      const store = transaction.objectStore('sessions');
      const request = store.get(userId);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async clearSession(userId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sessions'], 'readwrite');
      const store = transaction.objectStore('sessions');
      const request = store.delete(userId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}
