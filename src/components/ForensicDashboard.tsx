import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Smartphone, 
  Database, 
  FileText, 
  Shield, 
  Download, 
  Search,
  HardDrive,
  MessageSquare,
  Phone,
  Camera,
  Clock,
  MapPin
} from 'lucide-react';

const ForensicDashboard = () => {
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [extractionStatus, setExtractionStatus] = useState<'idle' | 'extracting' | 'complete'>('idle');

  const mockDevices = [
    { id: '1', name: 'iPhone 14 Pro', os: 'iOS 17.1', status: 'connected' },
    { id: '2', name: 'Samsung Galaxy S23', os: 'Android 14', status: 'connected' },
  ];

  const extractionModules = [
    { id: 'messages', name: 'Messages & Chat', icon: MessageSquare, count: 2847 },
    { id: 'calls', name: 'Call Logs', icon: Phone, count: 156 },
    { id: 'contacts', name: 'Contacts', icon: Database, count: 423 },
    { id: 'media', name: 'Photos & Videos', icon: Camera, count: 1293 },
    { id: 'location', name: 'Location Data', icon: MapPin, count: 89 },
    { id: 'files', name: 'File System', icon: HardDrive, count: 0 },
  ];

  const handleExtraction = () => {
    setExtractionStatus('extracting');
    // Simulate extraction process
    setTimeout(() => {
      setExtractionStatus('complete');
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Mobile Forensic Suite</h1>
            <p className="text-muted-foreground">Digital evidence extraction and analysis</p>
          </div>
          <Badge variant="outline" className="text-sm">
            <Shield className="mr-1 h-3 w-3" />
            Secure Mode
          </Badge>
        </div>

        <Tabs defaultValue="devices" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="devices">Devices</TabsTrigger>
            <TabsTrigger value="extraction">Data Extraction</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          {/* Devices Tab */}
          <TabsContent value="devices" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Connected Devices
                </CardTitle>
                <CardDescription>
                  Manage and select devices for forensic analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {mockDevices.map((device) => (
                    <Card 
                      key={device.id} 
                      className={`cursor-pointer transition-all ${
                        selectedDevice === device.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedDevice(device.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{device.name}</h3>
                            <p className="text-sm text-muted-foreground">{device.os}</p>
                          </div>
                          <Badge variant={device.status === 'connected' ? 'default' : 'secondary'}>
                            {device.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Extraction Tab */}
          <TabsContent value="extraction" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Data Extraction
                </CardTitle>
                <CardDescription>
                  Extract data from selected device
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!selectedDevice ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Please select a device first</p>
                  </div>
                ) : (
                  <>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {extractionModules.map((module) => (
                        <Card key={module.id} className="p-4">
                          <div className="flex items-center gap-3">
                            <module.icon className="h-5 w-5 text-primary" />
                            <div className="flex-1">
                              <h4 className="font-medium">{module.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {module.count} items found
                              </p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                    
                    <div className="flex justify-center pt-4">
                      <Button 
                        onClick={handleExtraction}
                        disabled={extractionStatus === 'extracting'}
                        size="lg"
                      >
                        {extractionStatus === 'extracting' ? (
                          <>
                            <Clock className="mr-2 h-4 w-4 animate-spin" />
                            Extracting Data...
                          </>
                        ) : extractionStatus === 'complete' ? (
                          'Extraction Complete'
                        ) : (
                          'Start Extraction'
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analysis Tab */}
          <TabsContent value="analysis" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Forensic Analysis
                </CardTitle>
                <CardDescription>
                  Analyze extracted data for evidence
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="p-4">
                    <h4 className="font-medium mb-2">Timeline Analysis</h4>
                    <p className="text-sm text-muted-foreground">
                      Chronological view of device activity
                    </p>
                  </Card>
                  <Card className="p-4">
                    <h4 className="font-medium mb-2">Communication Patterns</h4>
                    <p className="text-sm text-muted-foreground">
                      Analyze messaging and call patterns
                    </p>
                  </Card>
                  <Card className="p-4">
                    <h4 className="font-medium mb-2">Geolocation Mapping</h4>
                    <p className="text-sm text-muted-foreground">
                      Map location data and movement patterns
                    </p>
                  </Card>
                  <Card className="p-4">
                    <h4 className="font-medium mb-2">Data Recovery</h4>
                    <p className="text-sm text-muted-foreground">
                      Recover deleted files and data
                    </p>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Forensic Reports
                </CardTitle>
                <CardDescription>
                  Generate and manage forensic reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button className="w-full">
                    Generate Comprehensive Report
                  </Button>
                  <Button variant="outline" className="w-full">
                    Export Evidence Package
                  </Button>
                  <Button variant="outline" className="w-full">
                    Create Case Summary
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ForensicDashboard;