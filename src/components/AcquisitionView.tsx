import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Smartphone, 
  Play, 
  Square, 
  Shield, 
  Usb, 
  Cable, 
  Battery, 
  HardDrive,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Search,
  Unplug
} from 'lucide-react';
import { TargetAcquisitionEngine, TargetAcquisitionProgress } from '@/lib/target-acquisition';
import { TargetDeviceInfo } from '@/lib/adb-bridge';
import { ForensicDatabase, ForensicCase } from '@/lib/database';

interface AcquisitionViewProps {
  caseData: ForensicCase;
  database: ForensicDatabase;
  onViewArtifacts: () => void;
}

export default function AcquisitionView({ caseData, database, onViewArtifacts }: AcquisitionViewProps) {
  const [targetDevices, setTargetDevices] = useState<TargetDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<TargetDeviceInfo | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isAcquiring, setIsAcquiring] = useState(false);
  const [acquisitionProgress, setAcquisitionProgress] = useState<TargetAcquisitionProgress | null>(null);
  const [acquisitionEngine] = useState(() => new TargetAcquisitionEngine(database));
  const [acquisitionLogs, setAcquisitionLogs] = useState<string[]>([]);
  const [hasCompleted, setHasCompleted] = useState(false);

  useEffect(() => {
    setupAcquisitionEngine();
  }, []);

  const scanForDevices = async () => {
    setIsScanning(true);
    setAcquisitionLogs(prev => [...prev, `${new Date().toISOString()}: Scanning for USB OTG devices...`]);
    
    try {
      const devices = await acquisitionEngine.scanForTargetDevices();
      setTargetDevices(devices);
      setAcquisitionLogs(prev => [...prev, `${new Date().toISOString()}: Found ${devices.length} device(s)`]);
    } catch (error) {
      setAcquisitionLogs(prev => [...prev, `ERROR: Device scan failed - ${error}`]);
    } finally {
      setIsScanning(false);
    }
  };

  const connectToDevice = async (device: TargetDeviceInfo) => {
    setAcquisitionLogs(prev => [...prev, `${new Date().toISOString()}: Connecting to ${device.manufacturer} ${device.model}...`]);
    
    try {
      const connected = await acquisitionEngine.connectToDevice(device.serial);
      if (connected) {
        setSelectedDevice(device);
        setIsConnected(true);
        setAcquisitionLogs(prev => [...prev, `${new Date().toISOString()}: Connected successfully`]);
      } else {
        setAcquisitionLogs(prev => [...prev, `ERROR: Connection failed`]);
      }
    } catch (error) {
      setAcquisitionLogs(prev => [...prev, `ERROR: ${error}`]);
    }
  };

  const disconnectDevice = async () => {
    await acquisitionEngine.stopAcquisition();
    setIsConnected(false);
    setSelectedDevice(null);
    setAcquisitionLogs(prev => [...prev, `${new Date().toISOString()}: Disconnected from target device`]);
  };

  const setupAcquisitionEngine = () => {
    acquisitionEngine.setProgressCallback((progress) => {
      setAcquisitionProgress(progress);
      setAcquisitionLogs(prev => [...prev, `${new Date().toISOString()}: ${progress.stage}`]);
    });
  };

  const startAcquisition = async () => {
    if (!selectedDevice) return;
    
    setIsAcquiring(true);
    setHasCompleted(false);
    
    try {
      await acquisitionEngine.startLogicalAcquisition(caseData.id, selectedDevice);
      setHasCompleted(true);
    } catch (error) {
      setAcquisitionLogs(prev => [...prev, `ERROR: ${error}`]);
    } finally {
      setIsAcquiring(false);
    }
  };

  const stopAcquisition = async () => {
    await acquisitionEngine.stopAcquisition();
    setIsAcquiring(false);
    setAcquisitionLogs(prev => [...prev, `${new Date().toISOString()}: Acquisition stopped by user`]);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Device Acquisition</h1>
          <p className="text-muted-foreground">Case: {caseData.name}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Target Device Connection */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Usb className="h-5 w-5" />
                Target Device Connection
              </CardTitle>
              <CardDescription>Connect via USB OTG</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-muted-foreground">USB Status</span>
                <Badge variant={isConnected ? 'default' : 'outline'}>
                  {isConnected ? 'Connected' : 'Not Connected'}
                </Badge>
              </div>

              {!isConnected && (
                <Button 
                  onClick={scanForDevices} 
                  className="w-full"
                  disabled={isScanning}
                >
                  <Search className="h-4 w-4 mr-2" />
                  {isScanning ? 'Scanning...' : 'Scan for Devices'}
                </Button>
              )}

              {targetDevices.length > 0 && !isConnected && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-foreground">Available Devices</h4>
                  {targetDevices.map((device) => (
                    <Card 
                      key={device.serial} 
                      className="p-3 cursor-pointer hover:border-primary transition-colors"
                      onClick={() => connectToDevice(device)}
                    >
                      <div className="space-y-1">
                        <div className="font-medium text-foreground">{device.manufacturer} {device.model}</div>
                        <div className="text-xs text-muted-foreground">Android {device.androidVersion}</div>
                        <div className="text-xs text-muted-foreground">Serial: {device.serial}</div>
                        {device.isRooted && (
                          <Badge variant="destructive" className="text-xs">Rooted</Badge>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {selectedDevice && isConnected && (
                <>
                  <div className="space-y-2 p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Cable className="h-4 w-4 text-forensic-success" />
                      <span className="font-semibold text-foreground">Connected Device</span>
                    </div>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Model</span>
                        <span className="font-medium text-foreground">{selectedDevice.model}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Manufacturer</span>
                        <span className="font-medium text-foreground">{selectedDevice.manufacturer}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Android</span>
                        <span className="font-medium text-foreground">{selectedDevice.androidVersion}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Serial</span>
                        <span className="font-mono text-xs text-foreground">{selectedDevice.serial}</span>
                      </div>
                    </div>
                  </div>
                  
                  {!isAcquiring && (
                    <Button 
                      onClick={disconnectDevice} 
                      variant="outline"
                      className="w-full"
                    >
                      <Unplug className="h-4 w-4 mr-2" />
                      Disconnect
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Acquisition Controls */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                Acquisition Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">Acquisition Type</h4>
                <Badge variant="outline" className="mr-2">Logical Acquisition</Badge>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">Data Types</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Badge variant="secondary">Contacts</Badge>
                  <Badge variant="secondary">SMS/MMS</Badge>
                  <Badge variant="secondary">Call Logs</Badge>
                  <Badge variant="secondary">Apps</Badge>
                  <Badge variant="secondary">Photos</Badge>
                  <Badge variant="secondary">Browser</Badge>
                </div>
              </div>

              <div className="pt-4 space-y-2">
                {!isAcquiring && !hasCompleted && (
                  <Button 
                    onClick={startAcquisition} 
                    className="w-full"
                    disabled={!isConnected || !selectedDevice}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Acquisition
                  </Button>
                )}
                
                {isAcquiring && (
                  <Button 
                    onClick={stopAcquisition} 
                    variant="destructive" 
                    className="w-full"
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Stop Acquisition
                  </Button>
                )}

                {hasCompleted && (
                  <Button 
                    onClick={onViewArtifacts} 
                    className="w-full bg-forensic-success hover:bg-forensic-success/90"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Artifacts
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Security Status */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Encryption</span>
                  <Badge className="bg-forensic-success text-white">AES-256</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Hash Verification</span>
                  <Badge className="bg-forensic-success text-white">SHA256+MD5</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Chain of Custody</span>
                  <Badge className="bg-forensic-success text-white">HMAC</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Write Protection</span>
                  <Badge className="bg-forensic-success text-white">Enabled</Badge>
                </div>
              </div>

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  All acquired data is encrypted and cryptographically signed to ensure integrity.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>

        {/* Acquisition Progress */}
        {(isAcquiring || acquisitionProgress) && (
          <Card className="bg-card border-border mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Acquisition Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              {acquisitionProgress && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-foreground">{acquisitionProgress.stage}</span>
                    <span className="text-sm text-muted-foreground">
                      {acquisitionProgress.progress}%
                    </span>
                  </div>
                  
                  <Progress value={acquisitionProgress.progress} className="h-3" />
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Current Item:</span>
                      <div className="font-medium text-foreground">{acquisitionProgress.currentItem}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Items Processed:</span>
                      <div className="font-medium text-foreground">
                        {acquisitionProgress.itemsProcessed} / {acquisitionProgress.totalItems}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <div className="flex items-center gap-2">
                        {isAcquiring ? (
                          <Badge className="bg-forensic-info text-white">In Progress</Badge>
                        ) : hasCompleted ? (
                          <Badge className="bg-forensic-success text-white">Completed</Badge>
                        ) : (
                          <Badge variant="outline">Ready</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Acquisition Logs */}
        {acquisitionLogs.length > 0 && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Acquisition Log</CardTitle>
              <CardDescription>Real-time acquisition activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-lg max-h-64 overflow-y-auto">
                <div className="font-mono text-sm space-y-1">
                  {acquisitionLogs.map((log, index) => (
                    <div key={index} className="text-foreground">
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pre-acquisition Warnings */}
        {!isAcquiring && !hasCompleted && (
          <Card className="bg-card border-border mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-forensic-warning" />
                Pre-Acquisition Checklist
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-forensic-success" />
                  <span className="text-foreground">Enable airplane mode on target device</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-forensic-success" />
                  <span className="text-foreground">Connect target device via USB OTG cable</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-forensic-success" />
                  <span className="text-foreground">Enable USB debugging on target device</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-forensic-success" />
                  <span className="text-foreground">Verify legal authorization is in place</span>
                </div>
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-forensic-warning" />
                  <span className="text-foreground">USB OTG only works on Android host devices</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}