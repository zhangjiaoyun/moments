# Moments Android App 构建指南

本文档说明如何使用 GitHub Actions 自动构建 Moments Android App。

## 概述

本项目支持通过 GitHub Actions 自动构建 Android APK，构建过程中会将前端打包并嵌入到 Android App 中，同时支持配置 API Base URL。

## 架构说明

### API Base URL 注入机制

项目使用以下机制实现 API Base URL 的动态配置：

1. **Nuxt 配置** (`front/nuxt.config.ts`)
   - 添加了 `runtimeConfig.public.apiBaseUrl` 配置项
   - 从环境变量 `NUXT_PUBLIC_API_BASE_URL` 读取（默认为空字符串）

2. **API 请求拦截插件** (`front/plugins/api-base-url.ts`)
   - 拦截所有 `fetch` 请求
   - 当配置了 `apiBaseUrl` 时，自动为 `/api`、`/upload`、`/rss` 等相对路径添加前缀
   - 本地开发时使用相对路径（通过 Vite proxy）
   - Android App 中使用完整 URL（如 `https://x.tkdan.cn/api/...`）

3. **Capacitor 配置** (`capacitor.config.ts`)
   - `appId`: `com.tkdan.moments`
   - `webDir`: `front/.output/public` - 指向 Nuxt generate 生成的静态文件
   - `server.hostname`: `x.tkdan.cn` - Android App 默认后端域名

## 前置准备

### 1. 生成 Android 签名密钥

如果您还没有 Android Keystore，请先生成：

```bash
keytool -genkey -v -keystore moments-release.jks \
  -alias moments-key \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

按提示输入信息：
- 密钥库密码（store password）
- 密钥密码（key password）
- 组织信息（CN, OU, O, L, ST, C）

### 2. 配置 GitHub Secrets

将 keystore 转换为 Base64：

```bash
base64 -w 0 moments-release.jks > keystore-base64.txt
```

在 GitHub 仓库中配置以下 Secrets（**Settings** → **Secrets and variables** → **Actions**）：

| Secret 名称 | 说明 | 示例 |
|------------|------|------|
| `ANDROID_KEYSTORE_BASE64` | keystore 文件的 Base64 编码 | `keystore-base64.txt` 文件内容 |
| `ANDROID_KEY_PASSWORD` | 密钥密码 | 创建 keystore 时设置的 key password |
| `ANDROID_STORE_PASSWORD` | 密钥库密码 | 创建 keystore 时设置的 store password |

### 3. 初始化 Android 项目（本地开发）

首次开发时需要初始化 Android 项目：

```bash
# 1. 安装前端依赖
cd front
pnpm install

# 2. 构建前端静态文件
pnpm run generate

# 3. 初始化 Capacitor Android 项目
cd ..
npx cap add android

# 4. 同步前端到 Android 项目
npx cap sync android
```

## 使用 GitHub Actions 构建

### 触发构建

1. 前往 GitHub 仓库页面
2. 点击 **Actions** 标签
3. 选择 **Build Android App** workflow
4. 点击 **Run workflow**
5. 配置参数：
   - **API Base URL**: 后端 API 地址（默认 `https://x.tkdan.cn`）
   - **App Version**: 应用版本号（默认 `1.0.0`）
6. 点击 **Run workflow** 开始构建

### 构建流程

GitHub Actions 会自动执行以下步骤：

1. ✅ 检出代码
2. ✅ 安装 Node.js 20 + pnpm 8
3. ✅ 安装 Java 17 + Android SDK
4. ✅ 安装前端依赖 (`pnpm install`)
5. ✅ 构建前端静态文件 (`pnpm run generate`，注入 `NUXT_PUBLIC_API_BASE_URL`)
6. ✅ 同步 Capacitor Android 项目 (`npx cap sync android`)
7. ✅ 使用 keystore 签名并构建 APK (`./gradlew assembleRelease`)
8. ✅ 上传 APK 为 Artifact（保留 30 天）
9. ✅ 创建 GitHub Release 并附带 APK 文件

### 下载构建产物

**方式 1：从 Artifacts 下载**
- 构建完成后，在 Actions 运行详情页面可以下载 APK
- Artifact 名称：`moments-{version}-release`

**方式 2：从 Releases 下载**
- 构建成功后会自动创建一个 GitHub Release
- Release 标签：`v{version}`
- 可在 **Releases** 页面下载 APK 文件

## 本地开发

### 前端开发

```bash
cd front
pnpm install
pnpm run dev
```

前端会在 `http://localhost:3000` 启动，API 请求会通过 Vite proxy 转发到后端。

### Android 开发

使用 Android Studio 打开 `android` 目录进行开发：

```bash
# 构建前端
cd front
pnpm run generate

# 同步到 Android 项目
cd ..
npx cap sync android

# 使用 Android Studio 打开
npx cap open android
```

在 Android Studio 中可以：
- 运行和调试 App
- 查看日志
- 使用模拟器或真机测试

### 本地构建 APK

```bash
# 1. 构建前端
cd front
NUXT_PUBLIC_API_BASE_URL=https://x.tkdan.cn pnpm run generate

# 2. 同步到 Android
cd ..
npx cap sync android

# 3. 构建签名 APK
cd android
./gradlew assembleRelease \
  -Pandroid.injected.signing.store.file=/path/to/your/keystore.jks \
  -Pandroid.injected.signing.store.password=your_store_password \
  -Pandroid.injected.signing.key.alias=your_key_alias \
  -Pandroid.injected.signing.key.password=your_key_password

# APK 输出路径：android/app/build/outputs/apk/release/app-release.apk
```

## 环境变量说明

| 环境变量 | 说明 | 默认值 | 使用场景 |
|---------|------|--------|---------|
| `NUXT_PUBLIC_API_BASE_URL` | API 基础 URL | 空字符串 | Android 构建时必须设置 |

## 技术栈

- **前端**: Nuxt 3 + Vue 3 + Nuxt UI
- **移动端**: Capacitor 6
- **构建工具**: GitHub Actions
- **Android**: Gradle + Java 17

## 常见问题

### Q: 构建失败，提示签名错误？
A: 请检查 GitHub Secrets 配置是否正确，确保：
- `ANDROID_KEYSTORE_BASE64` 是有效的 Base64 编码
- `ANDROID_KEY_ALIAS` 与 keystore 中的别名一致
- 密码正确

### Q: APK 安装后无法连接后端？
A: 请检查：
- 构建时是否正确设置了 `API Base URL` 参数
- 后端服务是否正常运行
- 后端是否配置了正确的 CORS 策略

### Q: 如何修改 App 的包名和名称？
A: 修改以下文件：
- `capacitor.config.ts` 中的 `appId` 和 `appName`
- 重新运行 `npx cap sync android`

### Q: 如何添加 App 图标和启动画面？
A:
1. 在 `android/app/src/main/res` 目录下添加图标资源
2. 配置 `capacitor.config.ts` 中的 `SplashScreen` 插件选项

## 许可证

与主项目保持一致。
