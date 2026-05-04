import type { CapacitorConfig } from '@capacitor/cli';

const serverUrl = 'https://gosforthtrail.me-5d2.workers.dev/';

const config: CapacitorConfig = {
  appId: 'com.catalufa.gosforthtrail',
  appName: 'Gosforth Trail',
  webDir: 'public',
  server: {
    url: serverUrl,
    cleartext: true
  }
};

export default config;
