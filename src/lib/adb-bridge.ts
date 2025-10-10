// ADB Bridge for USB OTG device-to-device communication
// Requires native Android module implementation

export interface TargetDeviceInfo {
  serial: string;
  model: string;
  manufacturer: string;
  androidVersion: string;
  buildNumber: string;
  isRooted: boolean;
  adbEnabled: boolean;
}

export interface ADBConnectionStatus {
  connected: boolean;
  deviceSerial?: string;
  connectionMethod: 'usb_otg';
  error?: string;
}

export class ADBBridge {
  private isAndroid: boolean;
  
  constructor() {
    this.isAndroid = this.detectPlatform();
  }

  private detectPlatform(): boolean {
    // Check if running on Android
    const userAgent = navigator.userAgent.toLowerCase();
    return /android/.test(userAgent);
  }

  /**
   * Check if USB OTG ADB is available on this device
   */
  async isADBAvailable(): Promise<boolean> {
    if (!this.isAndroid) {
      console.warn('USB OTG ADB is only available on Android host devices');
      return false;
    }

    try {
      // Call native Android module to check ADB availability
      // @ts-ignore - Native module will be implemented
      if (window.AndroidADBBridge) {
        // @ts-ignore
        return await window.AndroidADBBridge.isAvailable();
      }
      
      // Fallback for development/testing
      console.warn('Native ADB bridge not available. Running in simulation mode.');
      return true;
    } catch (error) {
      console.error('Failed to check ADB availability:', error);
      return false;
    }
  }

  /**
   * Scan for connected USB OTG devices
   */
  async scanForDevices(): Promise<TargetDeviceInfo[]> {
    if (!this.isAndroid) {
      throw new Error('USB OTG device scanning is only available on Android');
    }

    try {
      // @ts-ignore - Native module
      if (window.AndroidADBBridge) {
        // @ts-ignore
        const devices = await window.AndroidADBBridge.scanDevices();
        return devices;
      }

      // Mock data for development
      return [
        {
          serial: 'ABC123456789',
          model: 'Galaxy S21',
          manufacturer: 'Samsung',
          androidVersion: '13',
          buildNumber: 'TP1A.220624.014',
          isRooted: false,
          adbEnabled: true
        }
      ];
    } catch (error) {
      console.error('Failed to scan for devices:', error);
      throw error;
    }
  }

  /**
   * Connect to a target device via USB OTG
   */
  async connect(deviceSerial: string): Promise<ADBConnectionStatus> {
    if (!this.isAndroid) {
      return {
        connected: false,
        connectionMethod: 'usb_otg',
        error: 'USB OTG ADB is only supported on Android host devices'
      };
    }

    try {
      // @ts-ignore
      if (window.AndroidADBBridge) {
        // @ts-ignore
        const result = await window.AndroidADBBridge.connect(deviceSerial);
        return {
          connected: result.success,
          deviceSerial: result.success ? deviceSerial : undefined,
          connectionMethod: 'usb_otg',
          error: result.error
        };
      }

      // Mock success for development
      return {
        connected: true,
        deviceSerial,
        connectionMethod: 'usb_otg'
      };
    } catch (error) {
      return {
        connected: false,
        connectionMethod: 'usb_otg',
        error: `Connection failed: ${error}`
      };
    }
  }

  /**
   * Execute ADB shell command on target device
   */
  async executeCommand(command: string): Promise<string> {
    try {
      // @ts-ignore
      if (window.AndroidADBBridge) {
        // @ts-ignore
        return await window.AndroidADBBridge.executeCommand(command);
      }

      // Mock response for development
      console.log(`[ADB MOCK] Executing: ${command}`);
      return `Mock output for: ${command}`;
    } catch (error) {
      throw new Error(`Command execution failed: ${error}`);
    }
  }

  /**
   * Pull file from target device
   */
  async pullFile(remotePath: string, localPath: string): Promise<boolean> {
    try {
      // @ts-ignore
      if (window.AndroidADBBridge) {
        // @ts-ignore
        return await window.AndroidADBBridge.pullFile(remotePath, localPath);
      }

      // Mock success
      console.log(`[ADB MOCK] Pulling ${remotePath} to ${localPath}`);
      return true;
    } catch (error) {
      console.error(`Failed to pull file: ${error}`);
      return false;
    }
  }

  /**
   * List directory contents on target device
   */
  async listDirectory(path: string): Promise<string[]> {
    try {
      const output = await this.executeCommand(`ls -la ${path}`);
      // Parse ls output
      return output.split('\n').filter(line => line.trim().length > 0);
    } catch (error) {
      console.error(`Failed to list directory: ${error}`);
      return [];
    }
  }

  /**
   * Check if target device is rooted
   */
  async checkRootAccess(): Promise<boolean> {
    try {
      const output = await this.executeCommand('su -c "id"');
      return output.includes('uid=0');
    } catch (error) {
      return false;
    }
  }

  /**
   * Disconnect from target device
   */
  async disconnect(): Promise<void> {
    try {
      // @ts-ignore
      if (window.AndroidADBBridge) {
        // @ts-ignore
        await window.AndroidADBBridge.disconnect();
      }
      console.log('[ADB] Disconnected from target device');
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  }

  /**
   * Get detailed device information
   */
  async getDeviceInfo(): Promise<TargetDeviceInfo | null> {
    try {
      const model = await this.executeCommand('getprop ro.product.model');
      const manufacturer = await this.executeCommand('getprop ro.product.manufacturer');
      const androidVersion = await this.executeCommand('getprop ro.build.version.release');
      const buildNumber = await this.executeCommand('getprop ro.build.display.id');
      const serial = await this.executeCommand('getprop ro.serialno');
      const isRooted = await this.checkRootAccess();

      return {
        serial: serial.trim(),
        model: model.trim(),
        manufacturer: manufacturer.trim(),
        androidVersion: androidVersion.trim(),
        buildNumber: buildNumber.trim(),
        isRooted,
        adbEnabled: true
      };
    } catch (error) {
      console.error('Failed to get device info:', error);
      return null;
    }
  }
}
