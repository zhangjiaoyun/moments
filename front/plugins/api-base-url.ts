export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  let apiBaseUrl = config.public.apiBaseUrl as string

  // 如果没有通过环境变量配置，直接使用后端地址
  // 注意：这对 Capacitor 应用至关重要，因为相对路径在 WebView 中无法工作
  if (!apiBaseUrl) {
    // 在生产环境中，使用后端服务的完整地址
    // 根据 capacitor.config.ts 中的 hostname 配置
    apiBaseUrl = 'https://x.tkdan.cn'
  }

  // 拦截 fetch 请求，为 API 路径添加前缀
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
})
