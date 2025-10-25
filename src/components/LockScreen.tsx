import { useState } from 'react';
import { Shield, Fingerprint, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Capacitor } from '@capacitor/core';

export function LockScreen() {
  const [badgeNumber, setBadgeNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const { login, authenticateWithBiometric } = useAuth();
  const { toast } = useToast();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setIsAuthenticating(true);

    try {
      const success = await login(badgeNumber, password);
      if (!success) {
        toast({
          title: 'Authentication Failed',
          description: 'Invalid badge number or password',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Authentication error occurred',
        variant: 'destructive'
      });
    } finally {
      setIsAuthenticating(false);
    }
  }

  async function handleBiometric() {
    setIsAuthenticating(true);
    try {
      const success = await authenticateWithBiometric();
      if (success && badgeNumber) {
        // After biometric success, still need password for first login
        toast({
          title: 'Biometric Verified',
          description: 'Please enter your credentials',
        });
      } else if (!success) {
        toast({
          title: 'Authentication Failed',
          description: 'Biometric authentication was cancelled or failed',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Biometric authentication not available',
        variant: 'destructive'
      });
    } finally {
      setIsAuthenticating(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted to-background p-4">
      <Card className="w-full max-w-md border-2 shadow-lg">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Forensic Access Control</CardTitle>
          <CardDescription>
            Authentication required to access forensic cases
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="badgeNumber">Badge Number</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="badgeNumber"
                  type="text"
                  placeholder="Enter badge number"
                  value={badgeNumber}
                  onChange={(e) => setBadgeNumber(e.target.value)}
                  className="pl-10"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isAuthenticating || !badgeNumber || !password}
            >
              {isAuthenticating ? 'Authenticating...' : 'Authenticate'}
            </Button>
          </form>

          {Capacitor.isNativePlatform() && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleBiometric}
                disabled={isAuthenticating}
              >
                <Fingerprint className="mr-2 h-4 w-4" />
                Use Biometric
              </Button>
            </>
          )}

          <div className="mt-6 p-3 bg-muted rounded-lg text-xs text-muted-foreground">
            <p className="font-medium mb-1">Default Credentials:</p>
            <p>Badge: EX001</p>
            <p>Check console for password (first launch only)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
