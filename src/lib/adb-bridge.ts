// ADB Bridge for USB OTG device-to-device communication
// Requires native Android module implementation

// SECURITY: Allowed paths for forensic acquisition - prevents path traversal and command injection
const ALLOWED_PATH_PATTERNS = [
  /^\/sdcard\/[a-zA-Z0-9_\-\/\.]+$/, // SD card storage
  /^\/storage\/emulated\/0\/[a-zA-Z0-9_\-\/\.]+$/, // Emulated storage
  /^\/data\/data\/[a-z][a-z0-9._]*\/databases\/[a-zA-Z0-9_\-\.]+\.db$/, // App databases
  /^\/data\/data\/[a-z][a-z0-9._]*\/files\/[a-zA-Z0-9_\-\/\.]+$/, // App files
];

// SECURITY: Whitelist of allowed ADB commands for forensic purposes
const ALLOWED_COMMANDS = {
  getprop: /^getprop ro\.[a-z0-9._]+$/,
  pm_list: /^pm list packages(?:\s+-[a-z])?$/,
  su_id: /^su -c "id"$/,
  ls: /^ls -la ([a-zA-Z0-9_\-\/\.]+)$/,
} as const;

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
   * Validate and sanitize ADB command before execution
   * SECURITY: Prevents command injection attacks
   */
  private validateCommand(command: string): void {
    // Check if command matches any allowed pattern
    const isAllowed = Object.values(ALLOWED_COMMANDS).some(pattern => pattern.test(command));
    
    if (!isAllowed) {
      throw new Error(`Security: Command not allowed for forensic acquisition: ${command}`);
    }

    // Additional checks for dangerous characters
    const dangerousChars = /[;&|<>$`(){}[\]\\]/;
    if (dangerousChars.test(command)) {
      throw new Error('Security: Command contains forbidden characters');
    }
  }

  /**
   * Execute ADB shell command on target device with validation
   * SECURITY: All commands are validated against whitelist before execution
   */
  private async executeCommandInternal(command: string): Promise<string> {
    this.validateCommand(command);
    
    try {
      // @ts-ignore
      if (window.AndroidADBBridge) {
        // @ts-ignore
        return await window.AndroidADBBridge.executeCommand(command);
      }

      // Mock response for development
      console.log(`[ADB MOCK] Executing validated command: ${command}`);
      return `Mock output for: ${command}`;
    } catch (error) {
      throw new Error(`Command execution failed: ${error}`);
    }
  }

  /**
   * Execute validated getprop command
   */
  async executeGetProp(property: string): Promise<string> {
    // Validate property name format
    if (!/^ro\.[a-z0-9._]+$/.test(property)) {
      throw new Error(`Invalid property name: ${property}`);
    }
    return await this.executeCommandInternal(`getprop ${property}`);
  }

  /**
   * Execute validated package manager list command
   */
  async executePackageList(flags?: string): Promise<string> {
    const command = flags ? `pm list packages ${flags}` : 'pm list packages';
    return await this.executeCommandInternal(command);
  }

  /**
   * Validate path for forensic acquisition
   * SECURITY: Prevents path traversal and unauthorized file access
   */
  private validatePath(path: string): void {
    // Check for path traversal attempts
    if (path.includes('..')) {
      throw new Error('Security: Path traversal not allowed');
    }

    // Check if path matches any allowed pattern
    const isAllowed = ALLOWED_PATH_PATTERNS.some(pattern => pattern.test(path));
    if (!isAllowed) {
      throw new Error(`Security: Path not allowed for forensic acquisition: ${path}`);
    }

    // Additional security checks
    const dangerousChars = /[;&|<>$`(){}[\]\\]/;
    if (dangerousChars.test(path)) {
      throw new Error('Security: Path contains forbidden characters');
    }
  }

  /**
   * Pull file from target device with path validation
   * SECURITY: Validates remote path before file transfer
   */
  async pullFile(remotePath: string, localPath: string): Promise<boolean> {
    // Validate remote path
    this.validatePath(remotePath);
    
    try {
      // @ts-ignore
      if (window.AndroidADBBridge) {
        // @ts-ignore
        return await window.AndroidADBBridge.pullFile(remotePath, localPath);
      }

      // Mock success
      console.log(`[ADB MOCK] Pulling validated path: ${remotePath} to ${localPath}`);
      return true;
    } catch (error) {
      console.error(`Failed to pull file: ${error}`);
      return false;
    }
  }

  /**
   * List directory contents on target device with validation
   * SECURITY: Validates and sanitizes path to prevent command injection
   */
  async listDirectory(path: string): Promise<string[]> {
    // Validate path before using in command
    this.validatePath(path);
    
    try {
      // Execute validated ls command
      const output = await this.executeCommandInternal(`ls -la ${path}`);
      // Parse ls output
      return output.split('\n').filter(line => line.trim().length > 0);
    } catch (error) {
      console.error(`Failed to list directory: ${error}`);
      return [];
    }
  }

  /**
   * Check if target device is rooted
   * SECURITY: Uses whitelisted command
   */
  async checkRootAccess(): Promise<boolean> {
    try {
      const output = await this.executeCommandInternal('su -c "id"');
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
   * SECURITY: Uses validated getprop commands
   */
  async getDeviceInfo(): Promise<TargetDeviceInfo | null> {
    try {
      const model = await this.executeGetProp('ro.product.model');
      const manufacturer = await this.executeGetProp('ro.product.manufacturer');
      const androidVersion = await this.executeGetProp('ro.build.version.release');
      const buildNumber = await this.executeGetProp('ro.build.display.id');
      const serial = await this.executeGetProp('ro.serialno');
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
