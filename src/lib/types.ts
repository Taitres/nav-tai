export interface User {
  id: string
  email: string
  name: string
  role: "admin" | "user"
  avatar: string
  shareCode: string
  createdAt: string
}

export interface Category {
  id: string
  userId: string
  name: string
  slug: string
  icon: string
  description: string
  order: number
  createdAt: string
}

export interface Site {
  id: string
  userId: string
  categoryId: string
  name: string
  url: string
  description: string
  icon: string
  order: number
  tags: string[]
  createdAt: string
}

export interface SearchEngine {
  id: string
  userId: string
  name: string
  icon: string
  urlTemplate: string
  isDefault: boolean
  enabled: boolean
  order: number
}

export interface AiSearchConfig {
  provider: "openai" | "anthropic" | "custom"
  apiUrl: string
  apiKey: string
  model: string
  promptTemplate: string
}

export interface UserSettings {
  siteName: string
  siteDescription: string
  heroTitle: string
  heroSubtitle: string
  defaultEngineId: string | null
  theme: string
  wallpaper: string
}

export interface SharedCollection {
  id: string
  shareCode: string
  userId: string
  name: string
  data: SharedCollectionData
  createdAt: string
}

export interface SharedCollectionData {
  categories: Omit<Category, "userId">[]
  sites: Omit<Site, "userId">[]
}

export interface SessionPayload {
  userId: string
  expiresAt: number
}
