import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: "com.crimson.app",
  appName: "crimson-admin-android-v3",
  webDir: "dist",

  server: {
    hostname: "android.crimsoncastle.biz",
    androidScheme: "https",
  },
};



export default config;
