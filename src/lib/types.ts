export interface Category {
  id: string
  name: string
  slug: string
  icon: string
  description: string
  order: number
  createdAt: string
}

export interface Site {
  id: string
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
  name: string
  icon: string
  urlTemplate: string
  enabled: boolean
}

export interface AiSearchConfig {
  provider: "openai" | "anthropic" | "custom"
  apiUrl: string
  apiKey: string
  model: string
  promptTemplate: string
}

export interface Settings {
  siteName: string
  siteDescription: string
  heroTitle: string
  heroSubtitle: string
  searchEngines: SearchEngine[]
  aiSearch: AiSearchConfig | null
}

export interface NavData {
  categories: Category[]
  sites: Site[]
  settings: Settings
}

export interface SessionPayload {
  userId: string
  expiresAt: number
}
