import Database from "better-sqlite3"
import path from "path"
import fs from "fs"
import bcrypt from "bcryptjs"
import type { User, Category, Site, SearchEngine, AiSearchConfig, UserSettings, SharedCollection, SharedCollectionData } from "./types"

const DB_DIR = path.join(process.cwd(), "data")
const DB_FILE = path.join(DB_DIR, "nav-tai.db")

let _db: Database.Database | null = null

function getDb(): Database.Database {
  if (_db) return _db
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true })
  _db = new Database(DB_FILE)
  _db.pragma("journal_mode = WAL")
  _db.pragma("foreign_keys = ON")
  try {
    migrate(_db)
  } catch (err) {
    console.error("[db] Migration failed, recreating DB:", err)
    _db.close()
    if (fs.existsSync(DB_FILE)) fs.unlinkSync(DB_FILE)
    _db = new Database(DB_FILE)
    _db.pragma("journal_mode = WAL")
    _db.pragma("foreign_keys = ON")
    migrate(_db)
  }
  return _db
}

function migrate(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      avatar TEXT NOT NULL DEFAULT '',
      share_code TEXT UNIQUE NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS categories (
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

    CREATE TABLE IF NOT EXISTS sites (
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

    CREATE TABLE IF NOT EXISTS search_engines (
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

    CREATE TABLE IF NOT EXISTS ai_search_config (
      user_id TEXT PRIMARY KEY,
      provider TEXT NOT NULL DEFAULT 'openai',
      api_url TEXT NOT NULL DEFAULT '',
      api_key TEXT NOT NULL DEFAULT '',
      model TEXT NOT NULL DEFAULT '',
      prompt_template TEXT NOT NULL DEFAULT '',
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_settings (
      user_id TEXT PRIMARY KEY,
      site_name TEXT NOT NULL DEFAULT 'Nav-Tai',
      site_description TEXT NOT NULL DEFAULT '',
      hero_title TEXT NOT NULL DEFAULT '发现优质网站',
      hero_subtitle TEXT NOT NULL DEFAULT '',
      default_engine_id TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS shared_collections (
      id TEXT PRIMARY KEY,
      share_code TEXT UNIQUE NOT NULL,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL DEFAULT '',
      data TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id);
    CREATE INDEX IF NOT EXISTS idx_sites_user ON sites(user_id);
    CREATE INDEX IF NOT EXISTS idx_sites_category ON sites(category_id);
    CREATE INDEX IF NOT EXISTS idx_search_engines_user ON search_engines(user_id);
    CREATE INDEX IF NOT EXISTS idx_shared_collections_code ON shared_collections(share_code);
  `)

  ensureAdminExists(db)
}

function ensureAdminExists(db: Database.Database) {
  const existing = db.prepare("SELECT id FROM users WHERE role = 'admin'").get()
  if (existing) return

  const adminPassword = process.env.ADMIN_PASSWORD || "admin123"
  const hash = bcrypt.hashSync(adminPassword, 10)
  const adminId = "user-admin"
  const shareCode = "admin-" + Math.random().toString(36).substring(2, 8)

  db.transaction(() => {
    db.prepare(`
      INSERT INTO users (id, email, password_hash, name, role, avatar, share_code)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(adminId, "admin@nav-tai.com", hash, "Admin", "admin", "", shareCode)

    db.prepare(`
      INSERT INTO user_settings (user_id, site_name, site_description, hero_title, hero_subtitle)
      VALUES (?, ?, ?, ?, ?)
    `).run(adminId, "Nav-Tai", "现代化导航站", "发现优质网站", "精心整理的互联网资源导航，助你高效工作与学习")

    const cats = [
      { id: "cat-1", name: "AI 工具", slug: "ai-tools", icon: "🤖", description: "人工智能相关工具与服务", order: 1 },
      { id: "cat-2", name: "开发工具", slug: "dev-tools", icon: "💻", description: "开发者常用工具与资源", order: 2 },
      { id: "cat-3", name: "设计资源", slug: "design", icon: "🎨", description: "UI/UX 设计工具与灵感", order: 3 },
      { id: "cat-4", name: "效率工具", slug: "productivity", icon: "⚡", description: "提升工作效率的工具", order: 4 },
      { id: "cat-5", name: "学习资源", slug: "learning", icon: "📚", description: "在线学习与知识平台", order: 5 },
    ]
    const insertCat = db.prepare(`
      INSERT INTO categories (id, user_id, name, slug, icon, description, "order")
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
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
    const insertSite = db.prepare(`
      INSERT INTO sites (id, user_id, category_id, name, url, description, icon, "order", tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    sites.forEach((s) => insertSite.run(s.id, adminId, s.categoryId, s.name, s.url, s.description, "", s.order, JSON.stringify(s.tags)))

    const engines = [
      { id: "se-google", name: "Google", icon: "🔍", urlTemplate: "https://www.google.com/search?q={query}", isDefault: 1, enabled: 1, order: 1 },
      { id: "se-bing", name: "Bing", icon: "🔎", urlTemplate: "https://www.bing.com/search?q={query}", isDefault: 0, enabled: 1, order: 2 },
      { id: "se-duckduckgo", name: "DuckDuckGo", icon: "🦆", urlTemplate: "https://duckduckgo.com/?q={query}", isDefault: 0, enabled: 1, order: 3 },
    ]
    const insertEngine = db.prepare(`
      INSERT INTO search_engines (id, user_id, name, icon, url_template, is_default, enabled, "order")
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    engines.forEach((e) => insertEngine.run(e.id, adminId, e.name, e.icon, e.urlTemplate, e.isDefault, e.enabled, e.order))

    db.prepare(`
      INSERT INTO user_settings (user_id, default_engine_id)
      VALUES (?, ?)
    `).run(adminId, "se-google")
  })()
}

function rowToUser(row: Record<string, unknown>): User {
  return {
    id: row.id as string,
    email: row.email as string,
    name: row.name as string,
    role: row.role as "admin" | "user",
    avatar: row.avatar as string,
    shareCode: row.share_code as string,
    createdAt: row.created_at as string,
  }
}

function rowToCategory(row: Record<string, unknown>): Category {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    name: row.name as string,
    slug: row.slug as string,
    icon: row.icon as string,
    description: row.description as string,
    order: row.order as number,
    createdAt: row.created_at as string,
  }
}

function rowToSite(row: Record<string, unknown>): Site {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    categoryId: row.category_id as string,
    name: row.name as string,
    url: row.url as string,
    description: row.description as string,
    icon: row.icon as string,
    order: row.order as number,
    tags: JSON.parse(row.tags as string || "[]"),
    createdAt: row.created_at as string,
  }
}

function rowToSearchEngine(row: Record<string, unknown>): SearchEngine {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    name: row.name as string,
    icon: row.icon as string,
    urlTemplate: row.url_template as string,
    isDefault: Boolean(row.is_default),
    enabled: Boolean(row.enabled),
    order: row.order as number,
  }
}

function rowToSettings(row: Record<string, unknown>): UserSettings {
  return {
    siteName: row.site_name as string,
    siteDescription: row.site_description as string,
    heroTitle: row.hero_title as string,
    heroSubtitle: row.hero_subtitle as string,
    defaultEngineId: row.default_engine_id as string | null,
  }
}

export function getAdminUser(): User | null {
  const db = getDb()
  const row = db.prepare("SELECT * FROM users WHERE role = 'admin' LIMIT 1").get() as Record<string, unknown> | undefined
  return row ? rowToUser(row) : null
}

export function getUserById(id: string): User | null {
  const db = getDb()
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as Record<string, unknown> | undefined
  return row ? rowToUser(row) : null
}

export function getUserByEmail(email: string): (User & { passwordHash: string }) | null {
  const db = getDb()
  const row = db.prepare("SELECT *, password_hash FROM users WHERE email = ?").get(email) as Record<string, unknown> | undefined
  if (!row) return null
  return { ...rowToUser(row), passwordHash: row.password_hash as string }
}

export function createUser(data: { email: string; passwordHash: string; name: string; role?: "admin" | "user" }): User {
  const db = getDb()
  const id = `user-${Date.now()}`
  const shareCode = Math.random().toString(36).substring(2, 10)
  const role = data.role || "user"
  db.prepare(`
    INSERT INTO users (id, email, password_hash, name, role, avatar, share_code)
    VALUES (?, ?, ?, ?, ?, '', ?)
  `).run(id, data.email, data.passwordHash, data.name, role, shareCode)

  db.prepare(`
    INSERT INTO user_settings (user_id, site_name, site_description, hero_title, hero_subtitle)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, "我的导航", "个人专属导航页", "我的导航", "收藏我常用的网站和工具")

  return getUserById(id)!
}

export function updateUser(id: string, updates: Partial<Pick<User, "name" | "avatar" | "shareCode">>): User | null {
  const db = getDb()
  const sets: string[] = []
  const values: unknown[] = []
  if (updates.name !== undefined) { sets.push("name = ?"); values.push(updates.name) }
  if (updates.avatar !== undefined) { sets.push("avatar = ?"); values.push(updates.avatar) }
  if (updates.shareCode !== undefined) { sets.push("share_code = ?"); values.push(updates.shareCode) }
  if (sets.length === 0) return getUserById(id)
  values.push(id)
  db.prepare(`UPDATE users SET ${sets.join(", ")} WHERE id = ?`).run(...values)
  return getUserById(id)
}

export function updateUserPassword(id: string, newPasswordHash: string): boolean {
  const db = getDb()
  const result = db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(newPasswordHash, id)
  return result.changes > 0
}

export function getCategories(userId: string): Category[] {
  const db = getDb()
  const rows = db.prepare('SELECT * FROM categories WHERE user_id = ? ORDER BY "order" ASC').all(userId) as Record<string, unknown>[]
  return rows.map(rowToCategory)
}

export function getCategoryById(id: string): Category | null {
  const db = getDb()
  const row = db.prepare("SELECT * FROM categories WHERE id = ?").get(id) as Record<string, unknown> | undefined
  return row ? rowToCategory(row) : null
}

export function addCategory(data: Omit<Category, "id" | "createdAt">): Category {
  const db = getDb()
  const id = `cat-${Date.now()}`
  const createdAt = new Date().toISOString()
  db.prepare(`
    INSERT INTO categories (id, user_id, name, slug, icon, description, "order", created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, data.userId, data.name, data.slug, data.icon, data.description, data.order, createdAt)
  return getCategoryById(id)!
}

export function updateCategory(id: string, updates: Partial<Omit<Category, "id" | "userId" | "createdAt">>): Category | null {
  const db = getDb()
  const sets: string[] = []
  const values: unknown[] = []
  if (updates.name !== undefined) { sets.push("name = ?"); values.push(updates.name) }
  if (updates.slug !== undefined) { sets.push("slug = ?"); values.push(updates.slug) }
  if (updates.icon !== undefined) { sets.push("icon = ?"); values.push(updates.icon) }
  if (updates.description !== undefined) { sets.push("description = ?"); values.push(updates.description) }
  if (updates.order !== undefined) { sets.push('"order" = ?'); values.push(updates.order) }
  if (sets.length === 0) return getCategoryById(id)
  values.push(id)
  db.prepare(`UPDATE categories SET ${sets.join(", ")} WHERE id = ?`).run(...values)
  return getCategoryById(id)
}

export function deleteCategory(id: string): boolean {
  const db = getDb()
  const result = db.prepare("DELETE FROM categories WHERE id = ?").run(id)
  return result.changes > 0
}

export function reorderCategories(orderedIds: string[]): boolean {
  const db = getDb()
  const stmt = db.prepare('UPDATE categories SET "order" = ? WHERE id = ?')
  db.transaction(() => {
    orderedIds.forEach((id, index) => stmt.run(index, id))
  })()
  return true
}

export function getSites(userId: string): Site[] {
  const db = getDb()
  const rows = db.prepare('SELECT * FROM sites WHERE user_id = ? ORDER BY "order" ASC').all(userId) as Record<string, unknown>[]
  return rows.map(rowToSite)
}

export function getSitesByCategory(userId: string, categoryId: string): Site[] {
  const db = getDb()
  const rows = db.prepare('SELECT * FROM sites WHERE user_id = ? AND category_id = ? ORDER BY "order" ASC').all(userId, categoryId) as Record<string, unknown>[]
  return rows.map(rowToSite)
}

export function getSiteById(id: string): Site | null {
  const db = getDb()
  const row = db.prepare("SELECT * FROM sites WHERE id = ?").get(id) as Record<string, unknown> | undefined
  return row ? rowToSite(row) : null
}

export function addSite(data: Omit<Site, "id" | "createdAt">): Site {
  const db = getDb()
  const id = `site-${Date.now()}`
  const createdAt = new Date().toISOString()
  db.prepare(`
    INSERT INTO sites (id, user_id, category_id, name, url, description, icon, "order", tags, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, data.userId, data.categoryId, data.name, data.url, data.description, data.icon, data.order, JSON.stringify(data.tags), createdAt)
  return getSiteById(id)!
}

export function updateSite(id: string, updates: Partial<Omit<Site, "id" | "userId" | "createdAt">>): Site | null {
  const db = getDb()
  const sets: string[] = []
  const values: unknown[] = []
  if (updates.categoryId !== undefined) { sets.push("category_id = ?"); values.push(updates.categoryId) }
  if (updates.name !== undefined) { sets.push("name = ?"); values.push(updates.name) }
  if (updates.url !== undefined) { sets.push("url = ?"); values.push(updates.url) }
  if (updates.description !== undefined) { sets.push("description = ?"); values.push(updates.description) }
  if (updates.icon !== undefined) { sets.push("icon = ?"); values.push(updates.icon) }
  if (updates.order !== undefined) { sets.push('"order" = ?'); values.push(updates.order) }
  if (updates.tags !== undefined) { sets.push("tags = ?"); values.push(JSON.stringify(updates.tags)) }
  if (sets.length === 0) return getSiteById(id)
  values.push(id)
  db.prepare(`UPDATE sites SET ${sets.join(", ")} WHERE id = ?`).run(...values)
  return getSiteById(id)
}

export function deleteSite(id: string): boolean {
  const db = getDb()
  const result = db.prepare("DELETE FROM sites WHERE id = ?").run(id)
  return result.changes > 0
}

export function reorderSites(orderedIds: string[]): boolean {
  const db = getDb()
  const stmt = db.prepare('UPDATE sites SET "order" = ? WHERE id = ?')
  db.transaction(() => {
    orderedIds.forEach((id, index) => stmt.run(index, id))
  })()
  return true
}

export function getSearchEngines(userId: string): SearchEngine[] {
  const db = getDb()
  const rows = db.prepare('SELECT * FROM search_engines WHERE user_id = ? ORDER BY "order" ASC').all(userId) as Record<string, unknown>[]
  return rows.map(rowToSearchEngine)
}

export function getDefaultSearchEngine(userId: string): SearchEngine | null {
  const db = getDb()
  const row = db.prepare("SELECT * FROM search_engines WHERE user_id = ? AND is_default = 1 AND enabled = 1 LIMIT 1").get(userId) as Record<string, unknown> | undefined
  return row ? rowToSearchEngine(row) : null
}

export function addSearchEngine(data: Omit<SearchEngine, "id">): SearchEngine {
  const db = getDb()
  const id = `se-${Date.now()}`
  db.prepare(`
    INSERT INTO search_engines (id, user_id, name, icon, url_template, is_default, enabled, "order")
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, data.userId, data.name, data.icon, data.urlTemplate, data.isDefault ? 1 : 0, data.enabled ? 1 : 0, data.order)
  const row = db.prepare("SELECT * FROM search_engines WHERE id = ?").get(id) as Record<string, unknown>
  return rowToSearchEngine(row)
}

export function updateSearchEngine(id: string, updates: Partial<Omit<SearchEngine, "id" | "userId">>): SearchEngine | null {
  const db = getDb()
  const sets: string[] = []
  const values: unknown[] = []
  if (updates.name !== undefined) { sets.push("name = ?"); values.push(updates.name) }
  if (updates.icon !== undefined) { sets.push("icon = ?"); values.push(updates.icon) }
  if (updates.urlTemplate !== undefined) { sets.push("url_template = ?"); values.push(updates.urlTemplate) }
  if (updates.isDefault !== undefined) { sets.push("is_default = ?"); values.push(updates.isDefault ? 1 : 0) }
  if (updates.enabled !== undefined) { sets.push("enabled = ?"); values.push(updates.enabled ? 1 : 0) }
  if (updates.order !== undefined) { sets.push('"order" = ?'); values.push(updates.order) }
  if (sets.length === 0) return null
  values.push(id)

  db.transaction(() => {
    if (updates.isDefault) {
      const engine = db.prepare("SELECT user_id FROM search_engines WHERE id = ?").get(id) as Record<string, unknown> | undefined
      if (engine) {
        db.prepare("UPDATE search_engines SET is_default = 0 WHERE user_id = ?").run(engine.user_id)
      }
    }
    db.prepare(`UPDATE search_engines SET ${sets.join(", ")} WHERE id = ?`).run(...values)
  })()

  const row = db.prepare("SELECT * FROM search_engines WHERE id = ?").get(id) as Record<string, unknown> | undefined
  return row ? rowToSearchEngine(row) : null
}

export function deleteSearchEngine(id: string): boolean {
  const db = getDb()
  const result = db.prepare("DELETE FROM search_engines WHERE id = ?").run(id)
  return result.changes > 0
}

export function getAiSearchConfig(userId: string): AiSearchConfig | null {
  const db = getDb()
  const row = db.prepare("SELECT * FROM ai_search_config WHERE user_id = ?").get(userId) as Record<string, unknown> | undefined
  if (!row) return null
  return {
    provider: row.provider as AiSearchConfig["provider"],
    apiUrl: row.api_url as string,
    apiKey: row.api_key as string,
    model: row.model as string,
    promptTemplate: row.prompt_template as string,
  }
}

export function setAiSearchConfig(userId: string, config: AiSearchConfig | null): AiSearchConfig | null {
  const db = getDb()
  if (!config) {
    db.prepare("DELETE FROM ai_search_config WHERE user_id = ?").run(userId)
    return null
  }
  db.prepare(`
    INSERT INTO ai_search_config (user_id, provider, api_url, api_key, model, prompt_template)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      provider = excluded.provider,
      api_url = excluded.api_url,
      api_key = excluded.api_key,
      model = excluded.model,
      prompt_template = excluded.prompt_template
  `).run(userId, config.provider, config.apiUrl, config.apiKey, config.model, config.promptTemplate)
  return getAiSearchConfig(userId)
}

export function getSettings(userId: string): UserSettings {
  const db = getDb()
  const row = db.prepare("SELECT * FROM user_settings WHERE user_id = ?").get(userId) as Record<string, unknown> | undefined
  if (!row) {
    db.prepare(`
      INSERT INTO user_settings (user_id, site_name, site_description, hero_title, hero_subtitle)
      VALUES (?, '我的导航', '', '我的导航', '')
    `).run(userId)
    return getSettings(userId)
  }
  return rowToSettings(row)
}

export function updateSettings(userId: string, updates: Partial<UserSettings>): UserSettings {
  const db = getDb()
  const sets: string[] = []
  const values: unknown[] = []
  if (updates.siteName !== undefined) { sets.push("site_name = ?"); values.push(updates.siteName) }
  if (updates.siteDescription !== undefined) { sets.push("site_description = ?"); values.push(updates.siteDescription) }
  if (updates.heroTitle !== undefined) { sets.push("hero_title = ?"); values.push(updates.heroTitle) }
  if (updates.heroSubtitle !== undefined) { sets.push("hero_subtitle = ?"); values.push(updates.heroSubtitle) }
  if (updates.defaultEngineId !== undefined) { sets.push("default_engine_id = ?"); values.push(updates.defaultEngineId) }
  if (sets.length === 0) return getSettings(userId)
  values.push(userId)
  db.prepare(`UPDATE user_settings SET ${sets.join(", ")} WHERE user_id = ?`).run(...values)
  return getSettings(userId)
}

export function createSharedCollection(userId: string, name: string): SharedCollection {
  const db = getDb()
  const id = `share-${Date.now()}`
  const shareCode = Math.random().toString(36).substring(2, 10)
  const categories = getCategories(userId)
  const sites = getSites(userId)
  function stripUserId<T extends { userId: string }>(item: T): Omit<T, 'userId'> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { userId: _, ...rest } = item
    return rest as Omit<T, 'userId'>
  }

  
  const data: SharedCollectionData = {
    categories: categories.map(stripUserId),
    sites: sites.map(stripUserId),
  }
  db.prepare(`
    INSERT INTO shared_collections (id, share_code, user_id, name, data)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, shareCode, userId, name, JSON.stringify(data))
  const row = db.prepare("SELECT * FROM shared_collections WHERE id = ?").get(id) as Record<string, unknown>
  return {
    id: row.id as string,
    shareCode: row.share_code as string,
    userId: row.user_id as string,
    name: row.name as string,
    data: JSON.parse(row.data as string),
    createdAt: row.created_at as string,
  }
}

export function getSharedCollection(shareCode: string): SharedCollection | null {
  const db = getDb()
  const row = db.prepare("SELECT * FROM shared_collections WHERE share_code = ?").get(shareCode) as Record<string, unknown> | undefined
  if (!row) return null
  return {
    id: row.id as string,
    shareCode: row.share_code as string,
    userId: row.user_id as string,
    name: row.name as string,
    data: JSON.parse(row.data as string),
    createdAt: row.created_at as string,
  }
}

export function importSharedCollection(userId: string, shareCode: string, selectedCategoryIds?: string[]): { categories: Category[]; sites: Site[] } | null {
  const collection = getSharedCollection(shareCode)
  if (!collection) return null

  const db = getDb()
  const result: { categories: Category[]; sites: Site[] } = { categories: [], sites: [] }

  db.transaction(() => {
    const catIdMap = new Map<string, string>()
    const existingCats = getCategories(userId)
    let nextOrder = existingCats.length

    collection.data.categories.forEach((cat) => {
      if (selectedCategoryIds && !selectedCategoryIds.includes(cat.id)) return
      const newCat = addCategory({
        userId,
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
        description: cat.description,
        order: nextOrder++,
      })
      catIdMap.set(cat.id, newCat.id)
      result.categories.push(newCat)
    })

    const existingSites = getSites(userId)
    let nextSiteOrder = existingSites.length

    collection.data.sites.forEach((site) => {
      const newCatId = catIdMap.get(site.categoryId)
      if (!newCatId) return
      const newSite = addSite({
        userId,
        categoryId: newCatId,
        name: site.name,
        url: site.url,
        description: site.description,
        icon: site.icon,
        order: nextSiteOrder++,
        tags: site.tags,
      })
      result.sites.push(newSite)
    })
  })()

  return result
}
