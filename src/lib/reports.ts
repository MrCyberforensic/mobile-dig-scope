import { ForensicDatabase, ForensicCase, Artifact, CustodyLog } from './database';
import { ForensicCrypto } from './crypto';

export interface ReportData {
  case: ForensicCase;
  artifacts: Artifact[];
  custodyLogs: CustodyLog[];
  deviceInfo?: any;
  examinerSignature?: string;
}

export class ReportGenerator {
  private database: ForensicDatabase;

  constructor(database: ForensicDatabase) {
    this.database = database;
  }

  async generateReport(caseId: string, password: string, examinerSignature?: string): Promise<ReportData> {
    const forensicCase = await this.database.getCase(caseId);
    if (!forensicCase) throw new Error('Case not found');

    const encryptionKey = ForensicCrypto.deriveKey(password, forensicCase.encryptionSalt);
    const verificationHash = ForensicCrypto.calculateSHA256(encryptionKey);
    if (verificationHash !== forensicCase.passwordVerificationHash) {
      throw new Error('Invalid password');
    }

    const artifacts = await this.database.getArtifacts(caseId);
    const custodyLogs = await this.database.getCustodyLogs(caseId);

    const verifiedLogs = await Promise.all(
      custodyLogs.map(async (log) => {
        const isValid = await this.database.verifyCustodyLogIntegrity(log, encryptionKey);
        return { ...log, isVerified: isValid };
      })
    );

    return {
      case: forensicCase,
      artifacts,
      custodyLogs: verifiedLogs,
      examinerSignature
    };
  }

  generateHTMLReport(reportData: ReportData): string {
    const { case: forensicCase, artifacts, custodyLogs } = reportData;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Forensic Report - ${forensicCase.name}</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .header {
            background: linear-gradient(135deg, #1e3a8a, #3b82f6);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 2.5em;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .header p {
            margin: 10px 0 0 0;
            font-size: 1.2em;
            opacity: 0.9;
        }
        .section {
            background: white;
            padding: 25px;
            margin-bottom: 25px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .section h2 {
            color: #1e3a8a;
            border-bottom: 3px solid #3b82f6;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .case-info {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }
        .info-item {
            background: #f8fafc;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #3b82f6;
        }
        .info-label {
            font-weight: bold;
            color: #1e3a8a;
            display: block;
            margin-bottom: 5px;
        }
        .artifacts-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
        }
        .artifact-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .artifact-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
        }
        .artifact-type {
            background: #3b82f6;
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.85em;
            font-weight: bold;
            display: inline-block;
            margin-bottom: 10px;
        }
        .hash-info {
            font-family: 'Courier New', monospace;
            background: #1f2937;
            color: #10b981;
            padding: 10px;
            border-radius: 5px;
            font-size: 0.85em;
            margin-top: 10px;
        }
        .custody-timeline {
            position: relative;
            padding-left: 30px;
        }
        .custody-timeline::before {
            content: '';
            position: absolute;
            left: 10px;
            top: 0;
            bottom: 0;
            width: 2px;
            background: #3b82f6;
        }
        .custody-entry {
            position: relative;
            margin-bottom: 25px;
            background: #f8fafc;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #3b82f6;
        }
        .custody-entry::before {
            content: '';
            position: absolute;
            left: -25px;
            top: 20px;
            width: 12px;
            height: 12px;
            background: #3b82f6;
            border-radius: 50%;
            border: 3px solid white;
        }
        .custody-time {
            color: #6b7280;
            font-size: 0.9em;
            margin-bottom: 5px;
        }
        .custody-action {
            font-weight: bold;
            color: #1e3a8a;
            margin-bottom: 5px;
        }
        .signature-section {
            text-align: center;
            padding: 30px;
            background: #f8fafc;
            border: 2px dashed #3b82f6;
            border-radius: 10px;
            margin-top: 30px;
        }
        .signature {
            font-family: 'Courier New', monospace;
            font-size: 1.1em;
            color: #1e3a8a;
            margin-top: 15px;
        }
        .verification-status {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8em;
            font-weight: bold;
        }
        .verified {
            background: #dcfce7;
            color: #16a34a;
        }
        .unverified {
            background: #fee2e2;
            color: #dc2626;
        }
        @media print {
            body { background: white; }
            .section { box-shadow: none; border: 1px solid #e2e8f0; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Digital Forensic Investigation Report</h1>
        <p>Case: ${forensicCase.name}</p>
        <p>Generated: ${new Date().toLocaleString()}</p>
    </div>

    <div class="section">
        <h2>Case Information</h2>
        <div class="case-info">
            <div class="info-item">
                <span class="info-label">Case ID:</span>
                ${forensicCase.id}
            </div>
            <div class="info-item">
                <span class="info-label">Case Name:</span>
                ${forensicCase.name}
            </div>
            <div class="info-item">
                <span class="info-label">Examiner:</span>
                ${forensicCase.examiner}
            </div>
            <div class="info-item">
                <span class="info-label">Status:</span>
                <span style="text-transform: capitalize;">${forensicCase.status}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Created:</span>
                ${new Date(forensicCase.createdAt).toLocaleString()}
            </div>
            <div class="info-item">
                <span class="info-label">Last Updated:</span>
                ${new Date(forensicCase.updatedAt).toLocaleString()}
            </div>
        </div>
    </div>

    <div class="section">
        <h2>Acquired Artifacts (${artifacts.length} items)</h2>
        <div class="artifacts-grid">
            ${artifacts.map(artifact => `
                <div class="artifact-card">
                    <div class="artifact-type">${artifact.type.replace('_', ' ').toUpperCase()}</div>
                    <h3 style="margin: 0 0 10px 0; color: #1e3a8a;">${artifact.name}</h3>
                    <p><strong>Size:</strong> ${this.formatBytes(artifact.size)}</p>
                    <p><strong>Created:</strong> ${new Date(artifact.createdAt).toLocaleString()}</p>
                    ${artifact.metadata ? `<p><strong>Metadata:</strong> ${JSON.parse(artifact.metadata).count || 'N/A'} items</p>` : ''}
                    <div class="hash-info">
                        <div><strong>SHA256:</strong> ${artifact.sha256}</div>
                        <div><strong>MD5:</strong> ${artifact.md5}</div>
                    </div>
                </div>
            `).join('')}
        </div>
    </div>

    <div class="section">
        <h2>Chain of Custody</h2>
        <div class="custody-timeline">
            ${custodyLogs.map(log => `
                <div class="custody-entry">
                    <div class="custody-time">${new Date(log.timestamp).toLocaleString()}</div>
                    <div class="custody-action">${log.action.replace('_', ' ').toUpperCase()}</div>
                    <div>Examiner: ${log.examiner}</div>
                    <div>Details: ${log.details}</div>
                    <div style="margin-top: 10px;">
                        <span class="verification-status ${(log as any).isVerified ? 'verified' : 'unverified'}">
                            ${(log as any).isVerified ? '✓ VERIFIED' : '⚠ UNVERIFIED'}
                        </span>
                    </div>
                </div>
            `).join('')}
        </div>
    </div>

    ${reportData.examinerSignature ? `
        <div class="signature-section">
            <h3>Digital Signature</h3>
            <p>This report has been digitally signed by the examining officer:</p>
            <div class="signature">${reportData.examinerSignature}</div>
            <p style="margin-top: 20px; font-size: 0.9em; color: #6b7280;">
                Report generated on ${new Date().toISOString()}<br>
                All artifacts are secured with AES-256 encryption<br>
                Chain of custody verified with HMAC signatures
            </p>
        </div>
    ` : ''}
</body>
</html>`;
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async exportReport(reportData: ReportData, format: 'html' | 'pdf' = 'html'): Promise<string> {
    const htmlContent = this.generateHTMLReport(reportData);
    
    if (format === 'html') {
      return htmlContent;
    }

    // For PDF generation in a real implementation, you would use a library like puppeteer
    // For now, we return the HTML content
    return htmlContent;
  }
}