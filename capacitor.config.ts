import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.4e6a2e2f9fc24f4b96c9f2540c92c62c',
  appName: 'mobile-dig-scope',
  webDir: 'dist',
  // SECURITY: Server config removed for production builds
  // App runs from local bundle only - no remote code execution
  plugins: {
    CapacitorHttp: {
      enabled: true
    }
  }
};

export default config;