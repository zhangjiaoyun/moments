export default defineNuxtPlugin(async () => {
  const config = useRuntimeConfig()
  let apiBaseUrl = config.public.apiBaseUrl as string

  // 如果没有配置 apiBaseUrl，检查是否在 Capacitor 环境中
  if (!apiBaseUrl) {
    // 检查是否在 Capacitor 环境
    if (typeof window !== 'undefined' && (window as any).Capacitor) {
      const Capacitor = (window as any).Capacitor
      const isNative = Capacitor.isNativePlatform()

      if (isNative) {
        // 在 Capacitor 环境中，使用 capacitor.config.ts 中配置的 hostname
        // 构建完整的 API URL
        const protocol = 'https'
        const hostname = 'x.tkdan.cn'  // 与 capacitor.config.ts 中的 hostname 保持一致
        apiBaseUrl = `${protocol}://${hostname}`
      }
    }
  }

  // 如果配置了 apiBaseUrl，则拦截 fetch 请求，为 API 路径添加前缀
  if (apiBaseUrl) {
    const originalFetch = window.fetch

    window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
      let url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url

      // 只处理相对路径的 API 请求（以 /api、/upload、/rss 开头）
      if (url.startsWith('/api') || url.startsWith('/upload') || url.startsWith('/rss')) {
        url = apiBaseUrl + url
      }

      // 使用修改后的 URL 调用原始 fetch
      const newInput = typeof input === 'string' ? url : new Request(url, input)
      return originalFetch.call(this, newInput, init)
    }
  }
})
