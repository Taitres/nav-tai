import Database from "better-sqlite3"
import path from "path"
import fs from "fs"
import bcrypt from "bcryptjs"

const DB_DIR = path.join(process.cwd(), "data")
const DB_FILE = path.join(DB_DIR, "nav-tai.db")

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true })

if (fs.existsSync(DB_FILE)) {
  fs.unlinkSync(DB_FILE)
  console.log("Removed old DB")
}

const db = new Database(DB_FILE)
db.pragma("journal_mode = WAL")
db.pragma("foreign_keys = ON")

db.exec(`
  CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    avatar TEXT NOT NULL DEFAULT '',
    share_code TEXT UNIQUE NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE categories (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    "order" INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
  CREATE TABLE sites (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    category_id TEXT NOT NULL,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    icon TEXT NOT NULL DEFAULT '',
    "order" INTEGER NOT NULL DEFAULT 0,
    tags TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
  );
  CREATE TABLE search_engines (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT '',
    url_template TEXT NOT NULL,
    is_default INTEGER NOT NULL DEFAULT 0,
    enabled INTEGER NOT NULL DEFAULT 1,
    "order" INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
  CREATE TABLE ai_search_config (
    user_id TEXT PRIMARY KEY,
    provider TEXT NOT NULL DEFAULT 'openai',
    api_url TEXT NOT NULL DEFAULT '',
    api_key TEXT NOT NULL DEFAULT '',
    model TEXT NOT NULL DEFAULT '',
    prompt_template TEXT NOT NULL DEFAULT '',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
  CREATE TABLE user_settings (
    user_id TEXT PRIMARY KEY,
    site_name TEXT NOT NULL DEFAULT 'Nav-Tai',
    site_description TEXT NOT NULL DEFAULT '',
    hero_title TEXT NOT NULL DEFAULT '发现优质网站',
    hero_subtitle TEXT NOT NULL DEFAULT '',
    default_engine_id TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
  CREATE TABLE shared_collections (
    id TEXT PRIMARY KEY,
    share_code TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL DEFAULT '',
    data TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`)

const adminPassword = process.env.ADMIN_PASSWORD || "admin123"
const hash = bcrypt.hashSync(adminPassword, 10)
const adminId = "user-admin"

db.transaction(() => {
  db.prepare("INSERT INTO users (id, email, password_hash, name, role, avatar, share_code) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run(adminId, "admin@nav-tai.com", hash, "Admin", "admin", "", "admin-" + Math.random().toString(36).substring(2, 8))

  db.prepare("INSERT INTO user_settings (user_id, site_name, site_description, hero_title, hero_subtitle, default_engine_id) VALUES (?, ?, ?, ?, ?, ?)")
    .run(adminId, "Nav-Tai", "现代化导航站", "发现优质网站", "精心整理的互联网资源导航，助你高效工作与学习", "se-google")

  const cats = [
    { id: "cat-1", name: "AI 工具", slug: "ai-tools", icon: "🤖", description: "人工智能相关工具与服务", order: 1 },
    { id: "cat-2", name: "开发工具", slug: "dev-tools", icon: "💻", description: "开发者常用工具与资源", order: 2 },
    { id: "cat-3", name: "设计资源", slug: "design", icon: "🎨", description: "UI/UX 设计工具与灵感", order: 3 },
    { id: "cat-4", name: "效率工具", slug: "productivity", icon: "⚡", description: "提升工作效率的工具", order: 4 },
    { id: "cat-5", name: "学习资源", slug: "learning", icon: "📚", description: "在线学习与知识平台", order: 5 },
  ]
  const insertCat = db.prepare('INSERT INTO categories (id, user_id, name, slug, icon, description, "order") VALUES (?, ?, ?, ?, ?, ?, ?)')
  cats.forEach((c) => insertCat.run(c.id, adminId, c.name, c.slug, c.icon, c.description, c.order))

  const sites = [
    { id: "site-1", categoryId: "cat-1", name: "ChatGPT", url: "https://chat.openai.com", description: "OpenAI 推出的智能对话助手", order: 1, tags: ["AI", "对话", "OpenAI"] },
    { id: "site-2", categoryId: "cat-1", name: "Claude", url: "https://claude.ai", description: "Anthropic 推出的 AI 助手", order: 2, tags: ["AI", "对话", "Anthropic"] },
    { id: "site-3", categoryId: "cat-1", name: "Midjourney", url: "https://midjourney.com", description: "AI 图像生成工具", order: 3, tags: ["AI", "图像", "创作"] },
    { id: "site-4", categoryId: "cat-2", name: "GitHub", url: "https://github.com", description: "全球最大的代码托管平台", order: 1, tags: ["代码", "Git", "开源"] },
    { id: "site-5", categoryId: "cat-2", name: "VS Code", url: "https://code.visualstudio.com", description: "微软开源代码编辑器", order: 2, tags: ["编辑器", "IDE", "微软"] },
    { id: "site-6", categoryId: "cat-2", name: "Vercel", url: "https://vercel.com", description: "前端应用部署平台", order: 3, tags: ["部署", "Serverless", "Next.js"] },
    { id: "site-7", categoryId: "cat-3", name: "Figma", url: "https://figma.com", description: "协作式 UI 设计工具", order: 1, tags: ["设计", "UI", "协作"] },
    { id: "site-8", categoryId: "cat-3", name: "Dribbble", url: "https://dribbble.com", description: "设计师作品展示社区", order: 2, tags: ["设计", "灵感", "社区"] },
    { id: "site-9", categoryId: "cat-4", name: "Notion", url: "https://notion.so", description: "一体化协作与笔记工具", order: 1, tags: ["笔记", "协作", "知识库"] },
    { id: "site-10", categoryId: "cat-4", name: "Raycast", url: "https://raycast.com", description: "macOS 效率启动器", order: 2, tags: ["效率", "启动器", "macOS"] },
    { id: "site-11", categoryId: "cat-5", name: "MDN", url: "https://developer.mozilla.org", description: "Web 技术权威文档", order: 1, tags: ["文档", "Web", "Mozilla"] },
    { id: "site-12", categoryId: "cat-5", name: "Coursera", url: "https://coursera.org", description: "全球顶尖大学在线课程", order: 2, tags: ["课程", "大学", "在线学习"] },
  ]
  const insertSite = db.prepare('INSERT INTO sites (id, user_id, category_id, name, url, description, icon, "order", tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
  sites.forEach((s) => insertSite.run(s.id, adminId, s.categoryId, s.name, s.url, s.description, "", s.order, JSON.stringify(s.tags)))

  const engines = [
    { id: "se-google", name: "Google", icon: "🔍", urlTemplate: "https://www.google.com/search?q={query}", isDefault: 1, enabled: 1, order: 1 },
    { id: "se-bing", name: "Bing", icon: "🔎", urlTemplate: "https://www.bing.com/search?q={query}", isDefault: 0, enabled: 1, order: 2 },
    { id: "se-duckduckgo", name: "DuckDuckGo", icon: "🦆", urlTemplate: "https://duckduckgo.com/?q={query}", isDefault: 0, enabled: 1, order: 3 },
  ]
  const insertEngine = db.prepare('INSERT INTO search_engines (id, user_id, name, icon, url_template, is_default, enabled, "order") VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
  engines.forEach((e) => insertEngine.run(e.id, adminId, e.name, e.icon, e.urlTemplate, e.isDefault, e.enabled, e.order))
})()

db.close()
console.log("DB initialized successfully!")
console.log("Admin: admin@nav-tai.com / " + adminPassword)
