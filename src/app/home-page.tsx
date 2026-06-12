"use client"

import { useState } from "react"
import { HeroSection } from "@/components/frontend/hero-section"
import { SearchBar } from "@/components/frontend/search-bar"
import { CategoryNav } from "@/components/frontend/category-nav"
import { CategorySection } from "@/components/frontend/category-section"
import { BackToTop } from "@/components/frontend/back-to-top"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { Logo } from "@/components/shared/logo"
import { Button } from "@/components/ui/button"
import { Lock } from "lucide-react"
import Link from "next/link"
import type { Category, Site, Settings } from "@/lib/types"

interface HomePageProps {
  categories: Category[]
  sites: Site[]
  settings: Settings
}

export function HomePage({ categories, sites, settings }: HomePageProps) {
  const [filter, setFilter] = useState<string | null>(null)

  const filteredCategories = filter
    ? categories.filter((c) => c.id === filter)
    : categories

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Logo />
          <div className="flex items-center gap-2">
            <Link href="/admin">
              <Button variant="ghost" size="icon-sm">
                <Lock className="size-4" />
              </Button>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4">
        <HeroSection
          title={settings.heroTitle}
          subtitle={settings.heroSubtitle}
        />

        <div className="mb-6">
          <SearchBar
            categories={categories}
            sites={sites}
            searchEngines={settings.searchEngines}
            aiSearch={settings.aiSearch}
          />
        </div>

        <div className="mb-8">
          <CategoryNav categories={categories} />
        </div>

        <div className="flex flex-col gap-10 pb-16">
          {filteredCategories.map((cat, i) => (
            <CategorySection
              key={cat.id}
              category={cat}
              sites={sites.filter((s) => s.categoryId === cat.id)}
              categoryIndex={i}
            />
          ))}
        </div>
      </main>

      <footer className="border-t py-6">
        <div className="mx-auto max-w-6xl px-4 text-center text-xs text-muted-foreground">
          {settings.siteName} &copy; {new Date().getFullYear()}
        </div>
      </footer>

      <BackToTop />
    </div>
  )
}
