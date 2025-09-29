import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  FolderOpen, 
  Plus, 
  Shield, 
  FileText, 
  Clock, 
  Database,
  Eye,
  Download
} from 'lucide-react';
import { ForensicCase } from '@/lib/database';

interface DashboardProps {
  cases: ForensicCase[];
  onNewCase: () => void;
  onOpenCase: (caseId: string) => void;
}

export default function Dashboard({ cases, onNewCase, onOpenCase }: DashboardProps) {
  const activeCases = cases.filter(c => c.status === 'active');
  const completedCases = cases.filter(c => c.status === 'completed');
  const totalCases = cases.length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-forensic-info text-white';
      case 'completed': return 'bg-forensic-success text-white';
      case 'archived': return 'bg-muted text-muted-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `${diffDays} days ago`;
    if (diffHours > 0) return `${diffHours} hours ago`;
    return 'Just now';
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Forensic Dashboard</h1>
            <p className="text-muted-foreground">Secure mobile device investigation platform</p>
          </div>
          <Button onClick={onNewCase} className="mt-4 md:mt-0">
            <Plus className="h-4 w-4 mr-2" />
            New Case
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Cases</CardTitle>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{totalCases}</div>
              <p className="text-xs text-muted-foreground">
                All investigations
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Cases</CardTitle>
              <Clock className="h-4 w-4 text-forensic-info" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-forensic-info">{activeCases.length}</div>
              <p className="text-xs text-muted-foreground">
                In progress
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
              <FileText className="h-4 w-4 text-forensic-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-forensic-success">{completedCases.length}</div>
              <p className="text-xs text-muted-foreground">
                Reports generated
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Security Status</CardTitle>
              <Shield className="h-4 w-4 text-forensic-secure" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-forensic-secure">AES-256</div>
              <p className="text-xs text-muted-foreground">
                Encrypted storage
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Cases List */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Recent Cases
            </CardTitle>
            <CardDescription>
              Manage your forensic investigations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {cases.length === 0 ? (
              <div className="text-center py-12">
                <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No cases yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first forensic investigation case to get started
                </p>
                <Button onClick={onNewCase}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Case
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {cases.map((forensicCase) => (
                  <div
                    key={forensicCase.id}
                    className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-foreground truncate">
                            {forensicCase.name}
                          </h3>
                          <Badge className={getStatusColor(forensicCase.status)}>
                            {forensicCase.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Examiner:</span>
                            <div className="font-medium text-foreground">{forensicCase.examiner}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Created:</span>
                            <div className="font-medium text-foreground">
                              {getTimeAgo(forensicCase.createdAt)}
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Last Updated:</span>
                            <div className="font-medium text-foreground">
                              {getTimeAgo(forensicCase.updatedAt)}
                            </div>
                          </div>
                        </div>
                        
                        {forensicCase.deviceInfo && (
                          <div className="mt-2">
                            <span className="text-muted-foreground text-sm">Device:</span>
                            <div className="text-sm text-foreground mt-1 bg-muted p-2 rounded">
                              {forensicCase.deviceInfo.substring(0, 100)}
                              {forensicCase.deviceInfo.length > 100 ? '...' : ''}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onOpenCase(forensicCase.id)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Open
                        </Button>
                        
                        {forensicCase.status === 'completed' && (
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Export
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {forensicCase.status === 'active' && (
                      <div className="mt-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Investigation Progress</span>
                          <span className="text-muted-foreground">75%</span>
                        </div>
                        <Progress value={75} className="h-2" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}