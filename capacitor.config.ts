import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mxventurelab.app',
  appName: 'MX Venture Lab',
  webDir: 'public',
  server: {
    url: 'https://rc-site-xi.vercel.app',
    cleartext: false
  },
  android: {
    buildOptions: {
      releaseType: 'APK'
    }
  }
};

export default config;
