import { getAdminUser, getCategories, getSites, getSettings, getSearchEngines, getAiSearchConfig } from "./db"
import type { Category, Site, UserSettings, SearchEngine, AiSearchConfig } from "./types"

export { getAdminUser, getUserById, getCategories, getSites, getSettings, getSearchEngines, getAiSearchConfig, getDefaultSearchEngine } from "./db"

export function getAdminNavData() {
  const admin = getAdminUser()
  if (!admin) return null
  return {
    categories: getCategories(admin.id),
    sites: getSites(admin.id),
    settings: getSettings(admin.id),
    searchEngines: getSearchEngines(admin.id),
    aiSearch: getAiSearchConfig(admin.id),
  }
}

export function getUserNavData(userId: string) {
  return {
    categories: getCategories(userId),
    sites: getSites(userId),
    settings: getSettings(userId),
    searchEngines: getSearchEngines(userId),
    aiSearch: getAiSearchConfig(userId),
  }
}

export type NavDataResponse = {
  categories: Category[]
  sites: Site[]
  settings: UserSettings
  searchEngines: SearchEngine[]
  aiSearch: AiSearchConfig | null
}
