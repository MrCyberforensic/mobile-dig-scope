import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.4e6a2e2f9fc24f4b96c9f2540c92c62c',
  appName: 'mobile-dig-scope',
  webDir: 'dist',
  server: {
    url: 'https://4e6a2e2f-9fc2-4f4b-96c9-f2540c92c62c.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    CapacitorHttp: {
      enabled: true
    }
  }
};

export default config;