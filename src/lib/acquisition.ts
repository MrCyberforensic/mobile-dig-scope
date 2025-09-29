import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Device } from '@capacitor/device';
import { ForensicCrypto } from './crypto';
import { ForensicDatabase, Artifact } from './database';

export interface AcquisitionProgress {
  stage: string;
  progress: number;
  currentItem: string;
  itemsProcessed: number;
  totalItems: number;
}

export interface DeviceInfo {
  platform: string;
  model: string;
  operatingSystem: string;
  osVersion: string;
  manufacturer: string;
  isVirtual: boolean;
  memUsed?: number;
  diskFree?: number;
  diskTotal?: number;
  batteryLevel?: number;
}

export class AcquisitionEngine {
  private database: ForensicDatabase;
  private onProgress?: (progress: AcquisitionProgress) => void;

  constructor(database: ForensicDatabase) {
    this.database = database;
  }

  setProgressCallback(callback: (progress: AcquisitionProgress) => void) {
    this.onProgress = callback;
  }

  async getDeviceInfo(): Promise<DeviceInfo> {
    const info = await Device.getInfo();
    const batteryInfo = await Device.getBatteryInfo();

    return {
      platform: info.platform,
      model: info.model,
      operatingSystem: info.operatingSystem,
      osVersion: info.osVersion,
      manufacturer: info.manufacturer,
      isVirtual: info.isVirtual,
      batteryLevel: batteryInfo.batteryLevel
    };
  }

  async startLogicalAcquisition(caseId: string): Promise<void> {
    this.updateProgress('Initializing acquisition...', 0, 'Device scan', 0, 100);

    const forensicCase = await this.database.getCase(caseId);
    if (!forensicCase) throw new Error('Case not found');

    try {
      // Create custody log for acquisition start
      await this.database.createCustodyLog({
        caseId,
        action: 'acquisition_started',
        examiner: forensicCase.examiner,
        details: 'Logical acquisition started',
        hmacKey: forensicCase.encryptionKey!
      });

      // Simulate acquisition stages
      await this.acquireContacts(caseId, forensicCase.encryptionKey!);
      await this.acquireMessages(caseId, forensicCase.encryptionKey!);
      await this.acquireCallLogs(caseId, forensicCase.encryptionKey!);
      await this.acquireInstalledApps(caseId, forensicCase.encryptionKey!);
      await this.acquirePhotos(caseId, forensicCase.encryptionKey!);
      await this.acquireBrowserHistory(caseId, forensicCase.encryptionKey!);
      await this.acquireLocationData(caseId, forensicCase.encryptionKey!);

      // Create custody log for acquisition completion
      await this.database.createCustodyLog({
        caseId,
        action: 'acquisition_completed',
        examiner: forensicCase.examiner,
        details: 'Logical acquisition completed successfully',
        hmacKey: forensicCase.encryptionKey!
      });

      this.updateProgress('Acquisition completed', 100, 'Complete', 100, 100);
    } catch (error) {
      throw new Error(`Acquisition failed: ${error}`);
    }
  }

  private async acquireContacts(caseId: string, encryptionKey: string): Promise<void> {
    this.updateProgress('Acquiring contacts...', 10, 'Contacts', 0, 100);

    // Simulate contact acquisition
    const mockContacts = [
      { name: 'John Doe', phone: '+1234567890', email: 'john@example.com' },
      { name: 'Jane Smith', phone: '+0987654321', email: 'jane@example.com' },
      { name: 'Bob Johnson', phone: '+1122334455' }
    ];

    const contactsData = JSON.stringify(mockContacts);
    const filePath = await this.saveEncryptedArtifact(contactsData, `contacts_${Date.now()}.json`, encryptionKey);

    await this.database.addArtifact({
      caseId,
      type: 'contact',
      name: 'Contacts Database',
      filePath,
      sha256: ForensicCrypto.calculateSHA256(contactsData),
      md5: ForensicCrypto.calculateMD5(contactsData),
      size: contactsData.length,
      isEncrypted: true,
      metadata: JSON.stringify({ count: mockContacts.length })
    });

    this.updateProgress('Contacts acquired', 20, 'Contacts', 100, 100);
  }

  private async acquireMessages(caseId: string, encryptionKey: string): Promise<void> {
    this.updateProgress('Acquiring messages...', 30, 'SMS/MMS', 0, 100);

    const mockMessages = [
      { id: 1, sender: '+1234567890', content: 'Hello there!', timestamp: '2024-01-15T10:30:00Z', type: 'sms' },
      { id: 2, sender: '+0987654321', content: 'Meeting at 3 PM', timestamp: '2024-01-15T14:20:00Z', type: 'sms' },
      { id: 3, sender: '+1122334455', content: 'Photo.jpg', timestamp: '2024-01-15T16:45:00Z', type: 'mms' }
    ];

    const messagesData = JSON.stringify(mockMessages);
    const filePath = await this.saveEncryptedArtifact(messagesData, `messages_${Date.now()}.json`, encryptionKey);

    await this.database.addArtifact({
      caseId,
      type: 'sms',
      name: 'SMS/MMS Database',
      filePath,
      sha256: ForensicCrypto.calculateSHA256(messagesData),
      md5: ForensicCrypto.calculateMD5(messagesData),
      size: messagesData.length,
      isEncrypted: true,
      metadata: JSON.stringify({ count: mockMessages.length })
    });

    this.updateProgress('Messages acquired', 40, 'SMS/MMS', 100, 100);
  }

  private async acquireCallLogs(caseId: string, encryptionKey: string): Promise<void> {
    this.updateProgress('Acquiring call logs...', 50, 'Call Logs', 0, 100);

    const mockCallLogs = [
      { number: '+1234567890', type: 'outgoing', duration: 120, timestamp: '2024-01-15T09:15:00Z' },
      { number: '+0987654321', type: 'incoming', duration: 45, timestamp: '2024-01-15T11:30:00Z' },
      { number: '+1122334455', type: 'missed', duration: 0, timestamp: '2024-01-15T13:45:00Z' }
    ];

    const callLogsData = JSON.stringify(mockCallLogs);
    const filePath = await this.saveEncryptedArtifact(callLogsData, `call_logs_${Date.now()}.json`, encryptionKey);

    await this.database.addArtifact({
      caseId,
      type: 'call_log',
      name: 'Call Logs Database',
      filePath,
      sha256: ForensicCrypto.calculateSHA256(callLogsData),
      md5: ForensicCrypto.calculateMD5(callLogsData),
      size: callLogsData.length,
      isEncrypted: true,
      metadata: JSON.stringify({ count: mockCallLogs.length })
    });

    this.updateProgress('Call logs acquired', 60, 'Call Logs', 100, 100);
  }

  private async acquireInstalledApps(caseId: string, encryptionKey: string): Promise<void> {
    this.updateProgress('Acquiring installed apps...', 70, 'Applications', 0, 100);

    const mockApps = [
      { name: 'WhatsApp', packageName: 'com.whatsapp', version: '2.24.1.78', installDate: '2024-01-01T00:00:00Z' },
      { name: 'Signal', packageName: 'org.thoughtcrime.securesms', version: '6.45.8', installDate: '2024-01-02T00:00:00Z' },
      { name: 'Telegram', packageName: 'org.telegram.messenger', version: '10.6.2', installDate: '2024-01-03T00:00:00Z' }
    ];

    const appsData = JSON.stringify(mockApps);
    const filePath = await this.saveEncryptedArtifact(appsData, `installed_apps_${Date.now()}.json`, encryptionKey);

    await this.database.addArtifact({
      caseId,
      type: 'app_data',
      name: 'Installed Applications',
      filePath,
      sha256: ForensicCrypto.calculateSHA256(appsData),
      md5: ForensicCrypto.calculateMD5(appsData),
      size: appsData.length,
      isEncrypted: true,
      metadata: JSON.stringify({ count: mockApps.length })
    });

    this.updateProgress('Applications acquired', 80, 'Applications', 100, 100);
  }

  private async acquirePhotos(caseId: string, encryptionKey: string): Promise<void> {
    this.updateProgress('Acquiring photos...', 85, 'Media Files', 0, 100);

    const mockPhotos = [
      { name: 'IMG_001.jpg', path: '/storage/photos/IMG_001.jpg', size: 2048576, dateTaken: '2024-01-10T15:30:00Z' },
      { name: 'IMG_002.jpg', path: '/storage/photos/IMG_002.jpg', size: 1567890, dateTaken: '2024-01-12T10:15:00Z' }
    ];

    const photosData = JSON.stringify(mockPhotos);
    const filePath = await this.saveEncryptedArtifact(photosData, `photos_${Date.now()}.json`, encryptionKey);

    await this.database.addArtifact({
      caseId,
      type: 'photo',
      name: 'Photo Gallery',
      filePath,
      sha256: ForensicCrypto.calculateSHA256(photosData),
      md5: ForensicCrypto.calculateMD5(photosData),
      size: photosData.length,
      isEncrypted: true,
      metadata: JSON.stringify({ count: mockPhotos.length })
    });

    this.updateProgress('Photos acquired', 90, 'Media Files', 100, 100);
  }

  private async acquireBrowserHistory(caseId: string, encryptionKey: string): Promise<void> {
    this.updateProgress('Acquiring browser history...', 95, 'Browser Data', 0, 100);

    const mockHistory = [
      { url: 'https://example.com', title: 'Example Site', visitTime: '2024-01-15T09:00:00Z', visitCount: 5 },
      { url: 'https://forensics.com', title: 'Digital Forensics', visitTime: '2024-01-15T10:30:00Z', visitCount: 1 }
    ];

    const historyData = JSON.stringify(mockHistory);
    const filePath = await this.saveEncryptedArtifact(historyData, `browser_history_${Date.now()}.json`, encryptionKey);

    await this.database.addArtifact({
      caseId,
      type: 'browser_history',
      name: 'Browser History',
      filePath,
      sha256: ForensicCrypto.calculateSHA256(historyData),
      md5: ForensicCrypto.calculateMD5(historyData),
      size: historyData.length,
      isEncrypted: true,
      metadata: JSON.stringify({ count: mockHistory.length })
    });

    this.updateProgress('Browser history acquired', 98, 'Browser Data', 100, 100);
  }

  private async acquireLocationData(caseId: string, encryptionKey: string): Promise<void> {
    this.updateProgress('Acquiring location data...', 99, 'Location Data', 0, 100);

    const mockLocations = [
      { latitude: 40.7128, longitude: -74.0060, timestamp: '2024-01-15T08:30:00Z', accuracy: 10 },
      { latitude: 34.0522, longitude: -118.2437, timestamp: '2024-01-15T14:15:00Z', accuracy: 15 }
    ];

    const locationsData = JSON.stringify(mockLocations);
    const filePath = await this.saveEncryptedArtifact(locationsData, `locations_${Date.now()}.json`, encryptionKey);

    await this.database.addArtifact({
      caseId,
      type: 'location',
      name: 'Location History',
      filePath,
      sha256: ForensicCrypto.calculateSHA256(locationsData),
      md5: ForensicCrypto.calculateMD5(locationsData),
      size: locationsData.length,
      isEncrypted: true,
      metadata: JSON.stringify({ count: mockLocations.length })
    });

    this.updateProgress('Location data acquired', 100, 'Location Data', 100, 100);
  }

  private async saveEncryptedArtifact(data: string, filename: string, encryptionKey: string): Promise<string> {
    const { encrypted, iv } = ForensicCrypto.encrypt(data, encryptionKey);
    const filePath = `evidence/${filename}`;

    await Filesystem.writeFile({
      path: filePath,
      data: encrypted,
      directory: Directory.Documents,
      encoding: Encoding.UTF8
    });

    // Store IV separately for decryption
    await Filesystem.writeFile({
      path: `evidence/${filename}.iv`,
      data: iv,
      directory: Directory.Documents,
      encoding: Encoding.UTF8
    });

    return filePath;
  }

  private updateProgress(stage: string, progress: number, currentItem: string, itemsProcessed: number, totalItems: number) {
    if (this.onProgress) {
      this.onProgress({
        stage,
        progress,
        currentItem,
        itemsProcessed,
        totalItems
      });
    }
  }
}