import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rozgarsetu.msr',
  appName: 'Rozgar Setu MSR',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: false,
    allowNavigation: [
      '*.firebaseapp.com',
      '*.googleapis.com',
      'accounts.google.com',
      '*.google.com',
    ],
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
};

export default config;
