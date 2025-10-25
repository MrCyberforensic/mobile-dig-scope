import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthDatabase, AuthUser } from '@/lib/auth-database';
import { Capacitor } from '@capacitor/core';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (badgeNumber: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  authenticateWithBiometric: () => Promise<boolean>;
  checkSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authDb] = useState(() => new AuthDatabase());

  useEffect(() => {
    initializeAuth();
  }, []);

  // Check session timeout periodically
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      checkSession();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [user]);

  async function initializeAuth() {
    try {
      await authDb.initialize();
      
      // Check for existing users - if none, create default examiner
      const users = await authDb.getAllUsers();
      if (users.length === 0) {
        const { user: defaultUser, password } = await authDb.createUser({
          name: 'Default Examiner',
          badgeNumber: 'EX001',
          role: 'examiner'
        });
        console.log('Default user created. Badge: EX001, Password:', password);
        console.log('IMPORTANT: Change this password immediately in production!');
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      setIsLoading(false);
    }
  }

  async function login(badgeNumber: string, password: string): Promise<boolean> {
    try {
      const authenticatedUser = await authDb.verifyPassword(badgeNumber, password);
      if (!authenticatedUser) return false;

      setUser(authenticatedUser);
      await authDb.storeSession(authenticatedUser.id);
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  }

  async function authenticateWithBiometric(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return false;
    }

    try {
      // Biometric auth will be added when @capacitor-community/biometric-auth is available
      // For now, return false to use password authentication
      console.log('Biometric authentication requires @capacitor-community/biometric-auth package');
      return false;
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      return false;
    }
  }

  async function checkSession(): Promise<boolean> {
    if (!user) return false;

    try {
      const session = await authDb.getSession(user.id);
      if (!session) {
        await logout();
        return false;
      }

      const timeSinceLastActivity = Date.now() - session.lastActivity;
      if (timeSinceLastActivity > SESSION_TIMEOUT) {
        await logout();
        return false;
      }

      // Update last activity
      await authDb.storeSession(user.id);
      return true;
    } catch (error) {
      console.error('Session check failed:', error);
      return false;
    }
  }

  async function logout(): Promise<void> {
    if (user) {
      await authDb.clearSession(user.id);
    }
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        authenticateWithBiometric,
        checkSession
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
