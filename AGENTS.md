<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Nav-Tai 项目指南

## 技术栈
- Next.js 16 App Router + TypeScript
- Tailwind CSS v4 + shadcn/ui (base-nova style)
- Motion (motion/react) 动画库
- @dnd-kit 拖拽排序
- jose JWT 库
- next-themes 主题切换

## 项目结构
- `src/app/` - 路由页面
- `src/components/frontend/` - 前台组件
- `src/components/admin/` - 后台组件
- `src/components/shared/` - 共享组件
- `src/components/ui/` - shadcn/ui 组件
- `src/lib/` - 工具函数、类型、数据操作
- `src/data/` - JSON 数据文件
- `src/proxy.ts` - Next.js 16 Proxy (原 middleware)

## 关键约定
- Next.js 16 使用 `proxy.ts` 而非 `middleware.ts`，导出 `proxy` 函数
- shadcn/ui v4 使用 oklch 颜色，Select 的 onValueChange 接收 `(value: string | null, eventDetails)`
- 数据存储在 `src/data/nav-data.json`，通过 `src/lib/data.ts` 读写
- 认证使用简单密码 + JWT + HttpOnly Cookie，30天滑动过期
- 颜色系统使用 oklch，`--primary` 为紫色系 (oklch 0.45 0.18 270)

## 常用命令
- `pnpm dev` - 启动开发服务器
- `pnpm build` - 构建生产版本
- `pnpm start` - 启动生产服务器
- `pnpm lint` - ESLint 检查

## 环境变量
- `SESSION_SECRET` - JWT 加密密钥
- `ADMIN_PASSWORD` - 管理密码
