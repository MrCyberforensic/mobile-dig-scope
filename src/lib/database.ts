import { ForensicCrypto } from './crypto';

export interface ForensicCase {
  id: string;
  name: string;
  examiner: string;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'completed' | 'archived';
  deviceInfo?: string;
  legalAuthorization?: string;
  // SECURITY: Encryption key is NEVER stored - only salt for key derivation
  encryptionSalt: string;
  // SECURITY: Hash of derived key for password verification (not the key itself)
  passwordVerificationHash: string;
}

export interface Artifact {
  id: string;
  caseId: string;
  type: 'contact' | 'sms' | 'call_log' | 'app_data' | 'browser_history' | 'photo' | 'video' | 'file' | 'location' | 'deleted_file' | 'device_info';
  name: string;
  filePath: string;
  sha256: string;
  md5: string;
  size: number;
  createdAt: string;
  metadata?: string;
  isEncrypted: boolean;
  iv?: string;
}

export interface CustodyLog {
  id: string;
  caseId: string;
  action: 'case_created' | 'acquisition_started' | 'acquisition_completed' | 'artifact_added' | 'report_generated' | 'case_exported' | 'target_acquisition_started' | 'target_acquisition_completed';
  examiner: string;
  timestamp: string;
  details: string;
  deviceIdentifier?: string;
  hmacSignature: string;
}

export class ForensicDatabase {
  private dbName = 'ForensicDB';
  private version = 1;
  private db?: IDBDatabase;

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Cases store
        if (!db.objectStoreNames.contains('cases')) {
          const casesStore = db.createObjectStore('cases', { keyPath: 'id' });
          casesStore.createIndex('status', 'status');
          casesStore.createIndex('examiner', 'examiner');
        }

        // Artifacts store
        if (!db.objectStoreNames.contains('artifacts')) {
          const artifactsStore = db.createObjectStore('artifacts', { keyPath: 'id' });
          artifactsStore.createIndex('caseId', 'caseId');
          artifactsStore.createIndex('type', 'type');
        }

        // Custody logs store
        if (!db.objectStoreNames.contains('custodyLogs')) {
          const logsStore = db.createObjectStore('custodyLogs', { keyPath: 'id' });
          logsStore.createIndex('caseId', 'caseId');
          logsStore.createIndex('timestamp', 'timestamp');
        }
      };
    });
  }

  /**
   * Create a new forensic case with password-based encryption
   * SECURITY: Password is used to derive encryption key, never stored
   */
  async createCase(
    caseData: Omit<ForensicCase, 'id' | 'createdAt' | 'updatedAt' | 'encryptionSalt' | 'passwordVerificationHash'>,
    password: string
  ): Promise<{ case: ForensicCase; encryptionKey: string }> {
    const now = new Date().toISOString();
    
    // SECURITY: Generate cryptographically secure salt
    const salt = ForensicCrypto.generateSalt();
    
    // SECURITY: Derive key from user password (100,000 PBKDF2 iterations)
    const encryptionKey = ForensicCrypto.deriveKey(password, salt);
    
    // SECURITY: Store hash of key for password verification (not the key itself)
    const passwordVerificationHash = ForensicCrypto.calculateSHA256(encryptionKey);
    
    const forensicCase: ForensicCase = {
      id: crypto.randomUUID(),
      ...caseData,
      createdAt: now,
      updatedAt: now,
      encryptionSalt: salt,
      passwordVerificationHash
    };

    await this.storeData('cases', forensicCase);
    
    // Create custody log (HMAC key passed separately for security)
    const hmacKey = ForensicCrypto.calculateHMAC('hmac_key_derivation', encryptionKey);
    await this.createCustodyLog({
      caseId: forensicCase.id,
      action: 'case_created',
      examiner: caseData.examiner,
      details: `Case "${caseData.name}" created with AES-256 encryption`
    }, hmacKey);

    // Return case and key (key only exists in memory during this operation)
    return { case: forensicCase, encryptionKey };
  }

  async getCases(): Promise<ForensicCase[]> {
    return this.getAllData('cases');
  }

  async getCase(id: string): Promise<ForensicCase | null> {
    return this.getData('cases', id);
  }

  async updateCase(id: string, updates: Partial<ForensicCase>): Promise<void> {
    const existingCase = await this.getCase(id);
    if (!existingCase) throw new Error('Case not found');

    const updatedCase = {
      ...existingCase,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await this.storeData('cases', updatedCase);
  }

  /**
   * Add artifact to case with custody logging
   * SECURITY: Requires encryption key to be provided (not retrieved from storage)
   */
  async addArtifact(
    artifact: Omit<Artifact, 'id' | 'createdAt'>,
    encryptionKey: string
  ): Promise<Artifact> {
    const fullArtifact: Artifact = {
      id: crypto.randomUUID(),
      ...artifact,
      createdAt: new Date().toISOString()
    };

    await this.storeData('artifacts', fullArtifact);

    // Create custody log (HMAC key derived separately)
    const forensicCase = await this.getCase(artifact.caseId);
    if (forensicCase) {
      const hmacKey = ForensicCrypto.calculateHMAC('hmac_key_derivation', encryptionKey);
      await this.createCustodyLog({
        caseId: artifact.caseId,
        action: 'artifact_added',
        examiner: forensicCase.examiner,
        details: `Artifact "${artifact.name}" added (${artifact.type})`
      }, hmacKey);
    }

    return fullArtifact;
  }

  async getArtifacts(caseId: string): Promise<Artifact[]> {
    return this.getDataByIndex('artifacts', 'caseId', caseId);
  }

  async createCustodyLog(
    logData: {
      caseId: string;
      action: CustodyLog['action'];
      examiner: string;
      details: string;
      deviceIdentifier?: string;
    },
    hmacKey: string
  ): Promise<CustodyLog> {
    const timestamp = new Date().toISOString();
    const logEntry = {
      id: crypto.randomUUID(),
      caseId: logData.caseId,
      action: logData.action,
      examiner: logData.examiner,
      timestamp,
      details: logData.details,
      deviceIdentifier: logData.deviceIdentifier,
      hmacSignature: ''
    };

    // Calculate HMAC signature for tamper detection
    const dataToSign = JSON.stringify({
      ...logEntry,
      hmacSignature: undefined
    });
    logEntry.hmacSignature = ForensicCrypto.calculateHMAC(dataToSign, hmacKey);

    await this.storeData('custodyLogs', logEntry);
    return logEntry;
  }

  async getCustodyLogs(caseId: string): Promise<CustodyLog[]> {
    return this.getDataByIndex('custodyLogs', 'caseId', caseId);
  }

  async verifyCustodyLogIntegrity(log: CustodyLog, hmacKey: string): Promise<boolean> {
    const dataToVerify = JSON.stringify({
      ...log,
      hmacSignature: undefined
    });
    return ForensicCrypto.verifyHMAC(dataToVerify, hmacKey, log.hmacSignature);
  }

  private async storeData(storeName: string, data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  private async getData(storeName: string, key: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  private async getAllData(storeName: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  private async getDataByIndex(storeName: string, indexName: string, value: any): Promise<any[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  }
}