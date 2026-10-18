<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Nav-Tai 项目指南

## 技术栈
- Next.js 16 App Router + TypeScript
- Tailwind CSS v4 + shadcn/ui (base-nova style)
- better-sqlite3（数据持久化，WAL 模式）
- Motion (motion/react) 动画库
- @dnd-kit 拖拽排序
- jose JWT 库
- next-themes 主题切换

## 项目结构
- `src/app/` - 路由页面（`/`、`/login`、`/register`、`/settings`、`/share`）与 `/api/*` 接口
- `src/components/frontend/` - 前台组件
- `src/components/admin/` - 后台组件（目前 `admin-sidebar.tsx` 未被引用）
- `src/components/shared/` - 共享组件
- `src/components/ui/` - shadcn/ui 组件
- `src/lib/` - 工具函数、类型、数据操作
- `data/nav-tai.db` - SQLite 数据库（运行时会额外产生 `-shm` / `-wal` 文件，已被 gitignore）
- `scripts/init-db.ts|js` - 重建数据库并写入种子数据的脚本
- `src/proxy.ts` - Next.js 16 Proxy (原 middleware)

## 关键约定
- Next.js 16 使用 `proxy.ts` 而非 `middleware.ts`，导出 `proxy` 函数
- shadcn/ui v4 使用 oklch 颜色，Select 的 onValueChange 接收 `(value: string | null, eventDetails)`
- 所有数据库读写集中在 `src/lib/db.ts`，页面/接口通过 `src/lib/data.ts` 获取聚合数据
- 数据库在 `getDb()` 里惰性初始化：首次访问时建表并确保存在 admin 账号（`ADMIN_PASSWORD`）；迁移失败只会抛错，不会删除数据文件
- 涉及单个用户资源的更新/删除/排序（sites、categories、search_engines）必须带上 `userId`，按 `id + user_id` 过滤，避免越权
- AI 配置中的 `apiKey` 只留在服务端；下发给浏览器的一律用 `PublicAiSearchConfig`（`src/lib/data.ts` 的 `toPublicAiSearchConfig`）
- 客户端读取 localStorage 偏好（卡片尺寸、布局密度）使用 `useSyncExternalStore`，不要在 effect 里直接 setState
- 认证使用简单密码 + JWT + HttpOnly Cookie，30天滑动过期
- 颜色系统使用 oklch，`--primary` 为紫色系 (oklch 0.45 0.18 270)
- `globals.css` 里 `--font-sans` 指向 `--font-geist-sans`（layout.tsx 注入），不要写成自引用

## 常用命令
- `pnpm dev` - 启动开发服务器
- `pnpm build` - 构建生产版本
- `pnpm start` - 启动生产服务器
- `pnpm lint` - ESLint 检查

## 环境变量
- `SESSION_SECRET` - JWT 加密密钥
- `ADMIN_PASSWORD` - 管理密码
