import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.tkdan.moments',
  appName: 'Moments',
  webDir: 'front/.output/public',
  bundledWebRuntime: false,
  server: {
    // Android App 使用的后端 URL
    androidScheme: 'https',
    hostname: 'x.tkdan.cn',
    androidNavigationMode: 'history',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#ffffff',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
    },
  },
}

export default config