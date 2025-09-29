import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Users, 
  MessageSquare, 
  Phone, 
  Image, 
  Globe, 
  MapPin,
  Download,
  Shield,
  Clock
} from 'lucide-react';
import { ForensicDatabase, Artifact, ForensicCase } from '@/lib/database';

interface ArtifactViewerProps {
  caseData: ForensicCase;
  database: ForensicDatabase;
  onGenerateReport: () => void;
}

export default function ArtifactViewer({ caseData, database, onGenerateReport }: ArtifactViewerProps) {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [selectedType, setSelectedType] = useState<string>('all');

  useEffect(() => {
    loadArtifacts();
  }, [caseData.id]);

  const loadArtifacts = async () => {
    try {
      const caseArtifacts = await database.getArtifacts(caseData.id);
      setArtifacts(caseArtifacts);
    } catch (error) {
      console.error('Failed to load artifacts:', error);
    }
  };

  const getArtifactIcon = (type: string) => {
    switch (type) {
      case 'contact': return Users;
      case 'sms': return MessageSquare;
      case 'call_log': return Phone;
      case 'photo': return Image;
      case 'browser_history': return Globe;
      case 'location': return MapPin;
      default: return FileText;
    }
  };

  const filteredArtifacts = selectedType === 'all' 
    ? artifacts 
    : artifacts.filter(a => a.type === selectedType);

  const artifactTypes = [...new Set(artifacts.map(a => a.type))];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Artifact Viewer</h1>
            <p className="text-muted-foreground">Case: {caseData.name} • {artifacts.length} artifacts</p>
          </div>
          <Button onClick={onGenerateReport} className="bg-primary">
            <FileText className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>

        <Tabs value={selectedType} onValueChange={setSelectedType} className="space-y-6">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="contact">Contacts</TabsTrigger>
            <TabsTrigger value="sms">Messages</TabsTrigger>
            <TabsTrigger value="call_log">Calls</TabsTrigger>
            <TabsTrigger value="photo">Photos</TabsTrigger>
            <TabsTrigger value="browser_history">Browser</TabsTrigger>
            <TabsTrigger value="location">Location</TabsTrigger>
          </TabsList>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArtifacts.map((artifact) => {
              const IconComponent = getArtifactIcon(artifact.type);
              return (
                <Card key={artifact.id} className="bg-card border-border hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <IconComponent className="h-5 w-5 text-primary" />
                      {artifact.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Badge variant="secondary">
                        {artifact.type.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className="bg-forensic-secure/10 text-forensic-secure border-forensic-secure">
                        <Shield className="h-3 w-3 mr-1" />
                        Encrypted
                      </Badge>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Size:</span>
                        <span className="font-mono text-foreground">{(artifact.size / 1024).toFixed(2)} KB</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Created:</span>
                        <span className="text-foreground">{new Date(artifact.createdAt).toLocaleDateString()}</span>
                      </div>
                      {artifact.metadata && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Items:</span>
                          <span className="text-foreground">{JSON.parse(artifact.metadata).count || 'N/A'}</span>
                        </div>
                      )}
                    </div>

                    <div className="bg-muted p-3 rounded-lg">
                      <div className="text-xs font-mono space-y-1">
                        <div className="text-muted-foreground">SHA256:</div>
                        <div className="text-foreground break-all">{artifact.sha256.substring(0, 32)}...</div>
                        <div className="text-muted-foreground">MD5:</div>
                        <div className="text-foreground break-all">{artifact.md5}</div>
                      </div>
                    </div>

                    <Button variant="outline" size="sm" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredArtifacts.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No artifacts found</h3>
              <p className="text-muted-foreground">
                {selectedType === 'all' 
                  ? 'Start an acquisition to extract artifacts from the device'
                  : `No ${selectedType.replace('_', ' ')} artifacts available`
                }
              </p>
            </div>
          )}
        </Tabs>
      </div>
    </div>
  );
}