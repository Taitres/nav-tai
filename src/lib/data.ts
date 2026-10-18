import { getAdminUser, getCategories, getSites, getSettings, getSearchEngines, getAiSearchConfig } from "./db"
import type { Category, Site, UserSettings, SearchEngine, AiSearchConfig, PublicAiSearchConfig } from "./types"

export { getAdminUser, getUserById, getCategories, getSites, getSettings, getSearchEngines, getAiSearchConfig, getDefaultSearchEngine } from "./db"

/**
 * 把 AI 配置转成可以安全下发给浏览器的形式。
 * 主页是公开渲染的（未登录访客也能拿到 admin 的数据），apiKey 绝不能出现在其中。
 */
function toPublicAiSearchConfig(config: AiSearchConfig | null): PublicAiSearchConfig | null {
  if (!config) return null
  const { apiKey, ...rest } = config
  return { ...rest, hasApiKey: apiKey.length > 0 }
}

export function getAdminNavData() {
  const admin = getAdminUser()
  if (!admin) return null
  return {
    categories: getCategories(admin.id),
    sites: getSites(admin.id),
    settings: getSettings(admin.id),
    searchEngines: getSearchEngines(admin.id),
    aiSearch: toPublicAiSearchConfig(getAiSearchConfig(admin.id)),
  }
}

export function getUserNavData(userId: string) {
  return {
    categories: getCategories(userId),
    sites: getSites(userId),
    settings: getSettings(userId),
    searchEngines: getSearchEngines(userId),
    aiSearch: toPublicAiSearchConfig(getAiSearchConfig(userId)),
  }
}

export type NavDataResponse = {
  categories: Category[]
  sites: Site[]
  settings: UserSettings
  searchEngines: SearchEngine[]
  aiSearch: PublicAiSearchConfig | null
}
