import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.maroonapron.app",
  appName: "Maroon Apron - For Home Chefs",
  webDir: "dist",

  server: {
    hostname: "android.maroonapron.com",
    androidScheme: "https",
  },

  plugins: {
     SplashScreen: {
    launchShowDuration: 2000,
    launchAutoHide: true,
    launchFadeOutDuration: 200,
  },
  },
};

export default config;
