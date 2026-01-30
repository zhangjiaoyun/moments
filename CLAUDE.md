# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

Moments 是一个使用 Go 后端和 Nuxt3 前端的极简朋友圈应用。该应用使用 SQLite 作为数据库，支持 Memo（动态）发布、评论、点赞、标签管理、图片上传（本地/S3）、以及多种第三方内容嵌入（网易云音乐、B站视频、豆瓣等）。

## 架构结构

### 后端架构 (Go)

后端使用 Echo 框架和 GORM ORM，采用依赖注入（samber/do）管理服务。

**核心模块：**
- `backend/main.go` - 应用入口，配置加载和服务器启动
- `backend/router.go` - API 路由定义，所有 API 端点在 `/api` 前缀下
- `backend/db/` - 数据库模型和数据访问层
  - `db.go` - 数据库连接初始化（SQLite + GORM）
  - `user.go`, `memo.go`, `comment.go`, `sysConfig.go`, `friend.go` - 各实体数据访问
- `backend/handler/` - 业务逻辑处理器
  - `user.go` - 用户登录、注册、个人资料
  - `memo.go` - 动态发布、列表、点赞、置顶等
  - `comment.go` - 评论管理
  - `file.go` - 文件上传（本地/S3）
  - `tag.go` - 标签管理
  - `rss.go` - RSS feed 生成
  - `friend.go` - 友情链接管理
- `backend/middleware/` - 中间件（JWT 认证等）
- `backend/vo/` - 值对象和配置结构体
- `backend/pkg/` - 辅助包（邮件、工具函数等）

**依赖注入容器：** 使用 `samber/do/v2` 管理依赖，所有 handler 通过 injector 获取依赖（DB、Config、Logger）

**数据库：** SQLite，通过 `glebarez/sqlite` 驱动，数据库文件路径由环境变量 `DB` 控制（默认 `/app/data/db.sqlite`）

### 前端架构 (Nuxt3 + Vue3)

前端使用 Nuxt3 (SSR 禁用) + Nuxt UI + TypeScript。

**目录结构：**
- `front/pages/` - 页面路由（基于文件的路由）
  - `index.vue` - 首页（动态列表）
  - `new.vue` - 发布新动态
  - `edit/[id].vue` - 编辑动态
  - `memo/[id].vue` - 动态详情
  - `user/` - 用户相关页面（登录、注册、设置、个人资料）
  - `tags/` - 标签筛选页面
  - `sys/settings.vue` - 系统设置（管理员）
  - `friend.vue` - 友情链接
- `front/layouts/` - 布局组件（`default.vue` 为主布局）
- `front/utils/` - 工具函数
- `front/nuxt.config.ts` - Nuxt 配置，包含开发代理配置

**关键配置：**
- 前端开发时通过 Vite proxy 将 `/api`, `/upload`, `/rss`, `/swagger` 代理到后端（默认 `http://localhost:37892`）
- 使用 Nuxt UI (@nuxt/ui) 作为 UI 框架
- 使用 dayjs-nuxt 处理日期
- 使用 @nuxt/icon 处理图标
- SSR 关闭 (`ssr: false`)

## 开发命令

### 使用 Makefile（推荐）

**后端开发：**
```bash
# 安装后端依赖
make backend-install

# 启动后端开发服务器（开发模式，不嵌入静态文件）
make backend-dev
```

**前端开发：**
```bash
# 安装前端依赖
make frontend-install

# 启动前端开发服务器（localhost:3000）
make frontend-dev
```

**完整构建（生产版本）：**
```bash
# 构建前端 + 后端（多平台二进制）
make build

# 清理构建产物
make clean

# 单独构建前端（生成静态文件到 backend/public）
make frontend

# 单独构建后端（生成多平台二进制到 backend/dist）
make backend
```

### 手动运行

**后端：**
```bash
cd backend
go mod download
go build -ldflags="-X main.version=local -X main.commitId=local" -o ./dist/moments
./dist/moments
```

**前端：**
```bash
cd front
pnpm install
pnpm run dev
```

## 环境变量

后端支持通过 `.env` 文件或环境变量配置：

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `PORT` | 监听端口 | 3000 |
| `CORS_ORIGIN` | 允许的跨域 Origin（逗号分隔） | 空 |
| `JWT_KEY` | JWT 密钥 | 空（随机生成） |
| `DB` | SQLite 数据库路径 | `/app/data/db.sqlite` |
| `UPLOAD_DIR` | 本地上传文件目录 | `/app/data/upload` |
| `LOG_LEVEL` | 日志级别 | `info` |
| `ENABLE_SWAGGER` | 启用 Swagger 文档 | `false` |

**注意：** 后端使用 `github.com/joho/godotenv/autoload` 自动加载 `.env` 文件

## API 设计

所有 API 端点在 `/api` 前缀下，使用 POST 方法，通过 JWT token 认证（header: `X-API-TOKEN`）。

**主要端点组：**
- `/api/user/*` - 用户管理
- `/api/memo/*` - 动态（Memo）管理
- `/api/comment/*` - 评论管理
- `/api/sysConfig/*` - 系统配置
- `/api/file/*` - 文件上传
- `/api/tag/*` - 标签管理
- `/api/friend/*` - 友情链接
- `/rss` - RSS feed（GET）
- `/upload/*` - 静态文件访问
- `/swagger/*` - API 文档（需启用 `ENABLE_SWAGGER`）

## 数据库模型

核心实体：
- `User` - 用户
- `Memo` - 动态（支持图片、标签、点赞、评论、置顶）
- `Comment` - 评论
- `SysConfig` - 系统配置（键值对存储）
- `Friend` - 友情链接

数据库迁移通过 GORM 的 `AutoMigrate` 自动完成。

## 构建说明

**生产构建标签：**
- 后端使用 `-tags prod` 编译时会嵌入前端静态文件（通过 `init_static_files_prod.go` 的 embed）
- 开发模式不嵌入静态文件，前后端分离运行

**注意：** 前端开发时需要修改 `front/nuxt.config.ts` 中的代理目标端口（默认 37892），确保与后端实际监听端口一致。

## 版本信息

后端通过编译时注入版本信息：
```bash
-ldflags="-X main.version=x.x.x -X main.commitId=xxxxx"
```

## 默认账号

首次运行后默认管理员账号：
- 用户名：`admin`
- 密码：`a123456`

**强烈建议登录后立即修改密码。**


生成release.keystore
keytool -genkey -v -keystore release.keystore -alias moments -keyalg RSA -keysize 2048 -validity 10000 -storepass Yzz520530 -keypass Yzz520530 -dname "CN=china, OU=ad, O=liangzhengkeji, L=武汉, ST=湖北, C=CN"
