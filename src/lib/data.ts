import fs from "fs"
import path from "path"
import type { NavData, Category, Site, Settings } from "./types"

const DATA_FILE = path.join(process.cwd(), "src", "data", "nav-data.json")

function readData(): NavData {
  const raw = fs.readFileSync(DATA_FILE, "utf-8")
  return JSON.parse(raw) as NavData
}

function writeData(data: NavData): void {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8")
}

export function getCategories(): Category[] {
  return readData().categories.sort((a, b) => a.order - b.order)
}

export function getSites(): Site[] {
  return readData().sites.sort((a, b) => a.order - b.order)
}

export function getSitesByCategory(categoryId: string): Site[] {
  return getSites().filter((s) => s.categoryId === categoryId)
}

export function getSettings(): Settings {
  return readData().settings
}

export function getNavData(): NavData {
  const data = readData()
  return {
    categories: data.categories.sort((a, b) => a.order - b.order),
    sites: data.sites.sort((a, b) => a.order - b.order),
    settings: data.settings,
  }
}

export function addCategory(category: Omit<Category, "id" | "createdAt">): Category {
  const data = readData()
  const newCategory: Category = {
    ...category,
    id: `cat-${Date.now()}`,
    createdAt: new Date().toISOString(),
  }
  data.categories.push(newCategory)
  writeData(data)
  return newCategory
}

export function updateCategory(id: string, updates: Partial<Omit<Category, "id" | "createdAt">>): Category | null {
  const data = readData()
  const idx = data.categories.findIndex((c) => c.id === id)
  if (idx === -1) return null
  data.categories[idx] = { ...data.categories[idx], ...updates }
  writeData(data)
  return data.categories[idx]
}

export function deleteCategory(id: string): boolean {
  const data = readData()
  const idx = data.categories.findIndex((c) => c.id === id)
  if (idx === -1) return false
  data.categories.splice(idx, 1)
  data.sites = data.sites.filter((s) => s.categoryId !== id)
  writeData(data)
  return true
}

export function reorderCategories(orderedIds: string[]): boolean {
  const data = readData()
  orderedIds.forEach((id, index) => {
    const cat = data.categories.find((c) => c.id === id)
    if (cat) cat.order = index
  })
  writeData(data)
  return true
}

export function addSite(site: Omit<Site, "id" | "createdAt">): Site {
  const data = readData()
  const newSite: Site = {
    ...site,
    id: `site-${Date.now()}`,
    createdAt: new Date().toISOString(),
  }
  data.sites.push(newSite)
  writeData(data)
  return newSite
}

export function updateSite(id: string, updates: Partial<Omit<Site, "id" | "createdAt">>): Site | null {
  const data = readData()
  const idx = data.sites.findIndex((s) => s.id === id)
  if (idx === -1) return null
  data.sites[idx] = { ...data.sites[idx], ...updates }
  writeData(data)
  return data.sites[idx]
}

export function deleteSite(id: string): boolean {
  const data = readData()
  const idx = data.sites.findIndex((s) => s.id === id)
  if (idx === -1) return false
  data.sites.splice(idx, 1)
  writeData(data)
  return true
}

export function reorderSites(orderedIds: string[]): boolean {
  const data = readData()
  orderedIds.forEach((id, index) => {
    const site = data.sites.find((s) => s.id === id)
    if (site) site.order = index
  })
  writeData(data)
  return true
}

export function updateSettings(updates: Partial<Settings>): Settings {
  const data = readData()
  data.settings = { ...data.settings, ...updates }
  writeData(data)
  return data.settings
}
