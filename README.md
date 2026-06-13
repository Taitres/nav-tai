# Nav-Tai

现代化导航站，基于 Next.js 16 + TypeScript + Tailwind CSS v4 + shadcn/ui 构建。

## 功能

- **网站导航** — 分类管理、卡片展示、拖拽排序
- **搜索引擎** — 自定义多搜索引擎切换
- **AI 找网站** — 编辑模式下 AI 搜索推荐网站，结果可拖拽添加到分类
- **分享导入/导出** — 生成分享码，导入他人收藏
- **暗色主题** — oklch 色彩系统，一键切换
- **响应式** — 适配桌面与移动端

## 技术栈

- Next.js 16 (App Router, Turbopack, `proxy.ts`)
- TypeScript
- Tailwind CSS v4 + shadcn/ui (base-nova)
- Motion (motion/react) 动画
- @dnd-kit 拖拽排序
- better-sqlite3 数据存储
- jose JWT 认证
- next-themes 主题

## 快速开始

```bash
pnpm install
pnpm dev
```

访问 http://localhost:3000，默认管理员账号 `admin@nav-tai.com`，密码 `admin123`。

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `SESSION_SECRET` | JWT 加密密钥 | `nav-tai-default-secret-change-me` |
| `ADMIN_PASSWORD` | 管理员初始密码 | `admin123` |

## 项目结构

```
src/
  app/              # 路由页面
    api/             # API 路由
    settings/        # 设置页
  components/
    frontend/        # 前台组件
      search-bar.tsx      # 搜索栏（引擎搜索 + 本地匹配）
      ai-site-panel.tsx   # AI 找网站侧边面板（编辑模式）
      site-card.tsx       # 网站卡片
      category-section.tsx # 分类区块
    shared/          # 共享组件
    ui/              # shadcn/ui 组件
  lib/               # 工具函数、类型、数据操作
  data/              # JSON 数据文件
  proxy.ts           # Next.js 16 Proxy（原 middleware）
```

## AI 找网站

编辑模式下点击顶栏 ✨ 按钮打开 AI 搜索面板：

1. 输入关键词（如 "webdav"、"AI 工具"）
2. AI 返回推荐网站列表
3. 选择目标分类，点击"添加"或拖拽卡片到左侧分类
4. 网站立即出现在对应分类中

AI 配置在 **设置 → AI 搜索** 中填写 API URL、Key 和模型名。支持 OpenAI 兼容接口和 Anthropic。

## 常用命令

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 启动开发服务器 |
| `pnpm build` | 构建生产版本 |
| `pnpm start` | 启动生产服务器 |
| `pnpm lint` | ESLint 检查 |

## 部署

```bash
pnpm build
pnpm start
```

支持 Node.js 服务器部署，数据存储在 `data/nav-tai.db`（SQLite）。
