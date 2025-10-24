import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, FileText, Shield, User } from 'lucide-react';
import { ForensicCase } from '@/lib/database';

interface CaseWizardProps {
  onCaseCreate: (caseData: Omit<ForensicCase, 'id' | 'createdAt' | 'updatedAt' | 'encryptionSalt' | 'passwordVerificationHash'>, password: string) => void;
  onCancel: () => void;
}

export default function CaseWizard({ onCaseCreate, onCancel }: CaseWizardProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    examiner: '',
    deviceInfo: '',
    legalAuthorization: '',
    password: '',
    confirmPassword: '',
    status: 'active' as const
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handlePrevious = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = () => {
    const { password, confirmPassword, ...caseData } = formData;
    onCaseCreate(caseData, password);
  };

  const isStep1Valid = formData.name.trim() && formData.examiner.trim();
  const isStep2Valid = formData.deviceInfo.trim();
  const isStep3Valid = 
    formData.legalAuthorization.trim() && 
    formData.password.length >= 8 && 
    formData.password === formData.confirmPassword;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">New Case Wizard</h1>
          <p className="text-muted-foreground">Create a new forensic investigation case</p>
          
          {/* Progress indicator */}
          <div className="flex justify-center mt-6 space-x-4">
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  stepNum <= step 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {stepNum}
                </div>
                {stepNum < 3 && (
                  <div className={`w-16 h-0.5 ml-2 ${
                    stepNum < step ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {step === 1 && <><User className="h-5 w-5" /> Case Information</>}
              {step === 2 && <><Shield className="h-5 w-5" /> Device Information</>}
              {step === 3 && <><FileText className="h-5 w-5" /> Legal Authorization</>}
            </CardTitle>
            <CardDescription>
              {step === 1 && "Enter the basic case and examiner information"}
              {step === 2 && "Provide details about the target device"}
              {step === 3 && "Upload or describe legal authorization for the investigation"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="case-name" className="text-foreground">Case Name *</Label>
                  <Input
                    id="case-name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter case name (e.g., Investigation-2024-001)"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="examiner" className="text-foreground">Examiner Name *</Label>
                  <Input
                    id="examiner"
                    value={formData.examiner}
                    onChange={(e) => handleInputChange('examiner', e.target.value)}
                    placeholder="Enter lead examiner name"
                    className="mt-1"
                  />
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-forensic-warning" />
                    <span className="font-semibold text-foreground">Security Notice</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    This case will be secured with AES-256 encryption. All artifacts will be 
                    protected with cryptographic hashes and tamper-evident custody logs.
                  </p>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="device-info" className="text-foreground">Device Information *</Label>
                  <Textarea
                    id="device-info"
                    value={formData.deviceInfo}
                    onChange={(e) => handleInputChange('deviceInfo', e.target.value)}
                    placeholder="Describe the target device (model, OS version, IMEI, serial number, etc.)"
                    rows={4}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">Acquisition Methods</h4>
                    <div className="space-y-1">
                      <Badge variant="secondary">Logical Acquisition</Badge>
                      <Badge variant="secondary">Physical Acquisition</Badge>
                      <Badge variant="secondary">File System Access</Badge>
                    </div>
                  </div>
                  
                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">Supported Data Types</h4>
                    <div className="space-y-1">
                      <Badge variant="outline">Contacts</Badge>
                      <Badge variant="outline">Messages</Badge>
                      <Badge variant="outline">Call Logs</Badge>
                      <Badge variant="outline">App Data</Badge>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="legal-auth" className="text-foreground">Legal Authorization *</Label>
                  <Textarea
                    id="legal-auth"
                    value={formData.legalAuthorization}
                    onChange={(e) => handleInputChange('legalAuthorization', e.target.value)}
                    placeholder="Enter warrant number, court order details, or other legal authorization information"
                    rows={4}
                    className="mt-1"
                  />
                </div>

                <div className="border-t border-border pt-4">
                  <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-forensic-secure" />
                    Case Encryption Password
                  </h4>
                  
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="password" className="text-foreground">Password *</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        placeholder="Enter strong password (min. 8 characters)"
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        This password encrypts all case data. Store it securely - it cannot be recovered.
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="confirm-password" className="text-foreground">Confirm Password *</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        placeholder="Re-enter password"
                        className="mt-1"
                      />
                      {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                        <p className="text-xs text-destructive mt-1">Passwords do not match</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-forensic-secure/10 border border-forensic-secure/30 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-forensic-secure" />
                    <span className="font-semibold text-foreground">Security Information</span>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Evidence encrypted with AES-256 using PBKDF2 (100,000 iterations)</li>
                    <li>• Encryption keys derived from your password, never stored</li>
                    <li>• Password required for all case access and operations</li>
                    <li>• Tamper-evident HMAC signatures on custody logs</li>
                  </ul>
                </div>

                <div className="bg-card border border-border p-4 rounded-lg">
                  <h4 className="font-semibold text-foreground mb-3">Case Summary</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Case Name:</span>
                      <div className="font-medium text-foreground">{formData.name}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Examiner:</span>
                      <div className="font-medium text-foreground">{formData.examiner}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between pt-6">
              <div>
                {step > 1 && (
                  <Button variant="outline" onClick={handlePrevious}>
                    Previous
                  </Button>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="ghost" onClick={onCancel}>
                  Cancel
                </Button>
                
                {step < 3 ? (
                  <Button 
                    onClick={handleNext}
                    disabled={
                      (step === 1 && !isStep1Valid) ||
                      (step === 2 && !isStep2Valid)
                    }
                  >
                    Next
                  </Button>
                ) : (
                  <Button 
                    onClick={handleSubmit}
                    disabled={!isStep3Valid}
                    className="bg-primary hover:bg-primary/90"
                  >
                    Create Case
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}