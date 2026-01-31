import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.tkdan.moments',
  appName: 'Moments',
  webDir: 'front/.output/public',
  bundledWebRuntime: false,
  server: {
    // Android App 使用的后端 URL
    androidScheme: 'https',
    // 移除 hostname 配置以避免 Capacitor 将所有请求视为静态资产
    // 这允许应用正确向外部 API 端点发送请求
    // hostname: 'x.tkdan.cn',
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