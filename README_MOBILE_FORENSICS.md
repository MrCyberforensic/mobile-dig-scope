# Mobile Forensic Imaging App - USB OTG Edition

## Overview

This is a fully offline mobile forensic imaging application designed for law enforcement and forensic investigators. The app runs on an **Android host device** and connects to **target Android devices** via **USB OTG** to extract forensic data.

## Architecture

### Host-to-Target Model

- **Host Device**: The investigator's Android device running this app
- **Target Device**: The Android device being examined (connected via USB OTG)
- **Connection Method**: USB OTG ADB (Android Debug Bridge)

### Key Components

1. **ADB Bridge** (`src/lib/adb-bridge.ts`)
   - Native communication layer for USB OTG ADB
   - Device scanning and connection management
   - Command execution on target device

2. **Target Acquisition Engine** (`src/lib/target-acquisition.ts`)
   - Logical data acquisition from target device
   - Extracts: contacts, SMS, call logs, apps, media, browser data, location
   - Real-time progress reporting

3. **Forensic Database** (`src/lib/database.ts`)
   - IndexedDB-based local storage
   - Cases, artifacts, and custody logs
   - Tamper-proof HMAC signatures

4. **Cryptography Module** (`src/lib/crypto.ts`)
   - AES-256 encryption for all artifacts
   - SHA256 + MD5 hash generation
   - HMAC signatures for chain of custody

5. **Report Generator** (`src/lib/reports.ts`)
   - Court-ready PDF/HTML reports
   - Hash manifests and custody timelines
   - Completely offline generation

## Technical Requirements

### Host Device Requirements

- **Platform**: Android only (iOS cannot act as USB host for ADB)
- **Android Version**: 6.0+ recommended
- **USB OTG**: Device must support USB OTG host mode
- **Storage**: Sufficient space for acquired evidence
- **Permissions**: USB access, file storage

### Target Device Requirements

- **Platform**: Android
- **USB Debugging**: Must be enabled
- **Connection**: USB OTG cable
- **Airplane Mode**: Recommended for evidence integrity
- **Root Access**: Optional (enables deeper data extraction)

## Installation & Setup

### 1. Export to GitHub

```bash
# Use Lovable's "Export to GitHub" button
# Then clone your repository
git clone <your-repo-url>
cd mobile-dig-scope
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Initialize Capacitor for Android

```bash
# Add Android platform
npx cap add android

# Update native dependencies
npx cap update android

# Sync web code to native
npx cap sync android
```

### 4. Configure Native ADB Module

The native Android ADB bridge module is located at:
```
android/app/src/main/java/app/lovable/mobiledigscope/ADBBridgeModule.kt
```

**Important**: This is a skeleton implementation. Full ADB protocol support requires:

1. **ADB Protocol Library**: Integrate a third-party ADB library or implement the protocol
   - Recommended: `adblib` or `jadb` (Java ADB library)
   - Alternative: Implement ADB protocol from scratch (complex)

2. **USB Permissions**: Handle Android USB permission dialogs
   ```kotlin
   // Add to AndroidManifest.xml
   <uses-feature android:name="android.hardware.usb.host" />
   ```

3. **Register Plugin**: Add to `MainActivity.java`
   ```java
   import app.lovable.mobiledigscope.ADBBridgeModule;
   
   this.init(savedInstanceState, new ArrayList<Class<? extends Plugin>>() {{
     add(ADBBridgeModule.class);
   }});
   ```

### 5. Build & Run

```bash
# Build web assets
npm run build

# Sync to Android
npx cap sync android

# Open in Android Studio
npx cap open android

# Or run directly
npx cap run android
```

## Usage Workflow

### 1. Create New Case

1. Launch app on host device
2. Click "New Case"
3. Enter case metadata (name, examiner, authorization)
4. Set encryption passphrase

### 2. Connect Target Device

1. Enable USB debugging on target device
2. Connect target to host via USB OTG cable
3. Click "Scan for Devices" in app
4. Select discovered target device
5. Approve USB debugging authorization on target

### 3. Acquire Data

1. Review pre-acquisition checklist
2. Click "Start Acquisition"
3. Monitor real-time progress
4. Wait for completion (logs are updated live)

### 4. View Artifacts

1. Click "View Artifacts" after completion
2. Browse extracted data by type
3. View metadata, hashes, timestamps
4. All data is encrypted locally

### 5. Generate Reports

1. Navigate to Reports section
2. Select report type (PDF or HTML)
3. Report includes:
   - Case metadata
   - Device information
   - Artifact listing with hashes
   - Chain of custody timeline
   - HMAC verification status

## Security Features

### Encryption

- **Algorithm**: AES-256-CBC
- **Key Derivation**: PBKDF2 (10,000 iterations)
- **Scope**: All acquired artifacts encrypted at rest
- **Keys**: Stored securely using Android Keystore (when implemented)

### Hash Verification

- **Algorithms**: SHA256 (primary) + MD5 (legacy compatibility)
- **Scope**: Every artifact and exported file
- **Purpose**: Integrity verification in court

### Chain of Custody

- **Logs**: All actions timestamped and logged
- **Signatures**: HMAC-SHA256 for tamper detection
- **Examiner**: Tracked with every action
- **Immutable**: Cannot be modified without breaking HMAC

## Limitations & Considerations

### Platform Limitations

❌ **iOS Host**: iOS devices cannot act as USB OTG host for ADB
✅ **Android Host**: Full functionality available

### Connection Limitations

- USB OTG only (Wi-Fi ADB removed for security)
- Requires physical cable connection
- Target device must have USB debugging enabled
- May require manual USB authorization on target

### Data Extraction Limitations

| Data Type | Availability | Root Required? |
|-----------|-------------|----------------|
| Contacts | ✅ Available | No |
| SMS/MMS | ✅ Available | Yes (typically) |
| Call Logs | ✅ Available | Yes (typically) |
| Installed Apps List | ✅ Available | No |
| App Data (WhatsApp, etc.) | ⚠️ Limited | Yes (required) |
| Photos/Media (public) | ✅ Available | No |
| Browser History | ⚠️ Limited | Yes (recommended) |
| Location Data | ⚠️ Limited | Yes (recommended) |
| System Files | ❌ Restricted | Yes (required) |

### Legal & Forensic Considerations

⚠️ **Important**: 
- Enabling USB debugging on target device modifies its state
- May not meet forensic "write-blocking" standards in all jurisdictions
- Consult local laws and forensic standards before use
- Always document any changes made to target device
- Maintain proper legal authorization for all acquisitions

## Development Roadmap

### Phase 1: Core Functionality (Current)
- [x] USB OTG device scanning UI
- [x] Target device connection interface
- [x] Logical acquisition framework
- [x] AES-256 encryption
- [x] SHA256/MD5 hashing
- [x] HMAC chain of custody
- [ ] Native ADB bridge implementation

### Phase 2: Enhanced Acquisition
- [ ] Full ADB protocol implementation
- [ ] Root detection and utilization
- [ ] Advanced app data parsing (WhatsApp, Signal, Telegram)
- [ ] Deleted file recovery
- [ ] File system imaging (rooted devices)

### Phase 3: Analysis & Reporting
- [ ] Artifact parsers (SQLite, JSON, XML)
- [ ] Media thumbnail generation
- [ ] Timeline visualization
- [ ] Enhanced PDF reports with charts
- [ ] Export to E01/RAW formats

### Phase 4: Security & Compliance
- [ ] Android Keystore integration
- [ ] Multi-factor authentication
- [ ] Role-based access control
- [ ] Audit trail export
- [ ] NIST compliance validation

## Troubleshooting

### Device Not Detected

1. Verify USB OTG support on host device
2. Check USB cable (must support data, not just charging)
3. Enable USB debugging on target device
4. Try different USB port/cable
5. Check host device Settings > Developer Options

### Connection Failed

1. Approve USB debugging authorization on target
2. Revoke and re-approve authorization if needed
3. Restart ADB on target: `adb kill-server && adb start-server`
4. Check native module logs in Android Logcat

### Extraction Failures

1. Verify root access if required
2. Check target device storage permissions
3. Ensure target device is not locked/encrypted
4. Review acquisition logs for specific errors

## Contributing

This is a forensic tool - contributions should prioritize:
1. Evidence integrity
2. Security and encryption
3. Chain of custody accuracy
4. Court admissibility
5. Compliance with forensic standards

## License

[Add appropriate license for forensic software]

## Disclaimer

This tool is intended for legitimate forensic investigation by authorized law enforcement and legal professionals only. Users are responsible for ensuring compliance with all applicable laws, regulations, and forensic standards in their jurisdiction.

## Support

For issues, questions, or contributions:
- GitHub Issues: [your-repo-url]/issues
- Documentation: See `/docs` folder
- Lovable Community: https://discord.com/channels/1119885301872070706/1280461670979993613
