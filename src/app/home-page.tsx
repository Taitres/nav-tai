"use client"

import { useEffect, useMemo, useState } from "react"
import { HeroSection } from "@/components/frontend/hero-section"
import { SearchBar } from "@/components/frontend/search-bar"
import { CategoryNav } from "@/components/frontend/category-nav"
import { CategorySection } from "@/components/frontend/category-section"
import { AiSitePanel } from "@/components/frontend/ai-site-panel"
import { BackToTop } from "@/components/frontend/back-to-top"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { Logo } from "@/components/shared/logo"
import { Button } from "@/components/ui/button"
import { LogOut, Settings, Share2, Pencil, PencilOff, User, LayoutGrid, Rows3, GripVertical, Sparkles } from "lucide-react"
import Link from "next/link"
import { motion, AnimatePresence } from "motion/react"
import { toast } from "sonner"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core"
import {
  SortableContext,
  useSortable,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { Category, Site, UserSettings, SearchEngine, AiSearchConfig } from "@/lib/types"

type CardSize = "sm" | "md" | "lg"
type LayoutDensity = "compact" | "normal" | "relaxed"

interface HomePageProps {
  categories: Category[]
  sites: Site[]
  settings: UserSettings
  searchEngines: SearchEngine[]
  aiSearch: AiSearchConfig | null
  isOwner: boolean
  user?: { id: string; name: string; role: string; shareCode: string }
}

function SortableCategorySection({ category, sites, index, editMode, cardSize, layoutDensity, onCategoryChange, onCategoryDelete, onSitesChange, onDropSite, onDragOverSite }: {
  category: Category
  sites: Site[]
  index: number
  editMode?: boolean
  cardSize: CardSize
  layoutDensity: LayoutDensity
  onCategoryChange?: (updated: Category) => void
  onCategoryDelete?: (id: string) => void
  onSitesChange?: (sites: Site[]) => void
  onDropSite?: (e: React.DragEvent, categoryId: string) => void
  onDragOverSite?: (e: React.DragEvent) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: `category:${category.id}` })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition || "transform 180ms cubic-bezier(0.16, 1, 0.3, 1)",
        opacity: isDragging ? 0.72 : 1,
        zIndex: isDragging ? 50 : undefined,
      }}
      className="relative will-change-transform"
    >
      {editMode && (
        <button
          {...attributes}
          {...listeners}
          className="absolute -left-6 top-4 z-20 flex size-7 touch-none items-center justify-center rounded-full border bg-background/90 text-muted-foreground shadow-sm backdrop-blur-md transition-colors hover:bg-accent hover:text-foreground cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="size-4" />
        </button>
      )}
      <CategorySection
        category={category}
        sites={sites}
        categoryIndex={index}
        editMode={editMode}
        cardSize={cardSize}
        layoutDensity={layoutDensity}
        onCategoryChange={onCategoryChange}
        onCategoryDelete={onCategoryDelete}
        onSitesChange={onSitesChange}
        onDropSite={onDropSite}
        onDragOverSite={onDragOverSite}
      />
    </div>
  )
}

export function HomePage({ categories: initialCategories, sites: initialSites, settings, searchEngines, aiSearch, isOwner, user }: HomePageProps) {
  const [editMode, setEditMode] = useState(false)
  const [categories, setCategories] = useState(initialCategories)
  const [sites, setSites] = useState(initialSites)
  const [cardSize, setCardSizeState] = useState<CardSize>("md")
  const [layoutDensity, setLayoutDensityState] = useState<LayoutDensity>("normal")
  const [mounted, setMounted] = useState(false)
  const [activeSiteId, setActiveSiteId] = useState<string | null>(null)
  const [showAiPanel, setShowAiPanel] = useState(false)

  useEffect(() => {
    setMounted(true)
    const savedCardSize = window.localStorage.getItem("nav-tai-card-size")
    const savedDensity = window.localStorage.getItem("nav-tai-layout-density")
    if (savedCardSize === "sm" || savedCardSize === "md" || savedCardSize === "lg") {
      setCardSizeState(savedCardSize)
    }
    if (savedDensity === "compact" || savedDensity === "normal" || savedDensity === "relaxed") {
      setLayoutDensityState(savedDensity)
    }
  }, [])

  function setCardSize(size: CardSize) {
    setCardSizeState(size)
    if (mounted) {
      window.localStorage.setItem("nav-tai-card-size", size)
    }
  }

  function setLayoutDensity(density: LayoutDensity) {
    setLayoutDensityState(density)
    if (mounted) {
      window.localStorage.setItem("nav-tai-layout-density", density)
    }
  }

  const categorySensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const activeSite = useMemo(
    () => (activeSiteId ? sites.find((site) => site.id === activeSiteId) ?? null : null),
    [activeSiteId, sites]
  )

  async function persistSiteOrder(categoryId: string, orderedIds: string[]) {
    await fetch("/api/sites/reorder", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId, orderedIds }),
    })
  }

  async function moveSiteAcrossCategories(siteId: string, targetCategoryId: string, targetIndex: number) {
    const movingSite = sites.find((site) => site.id === siteId)
    if (!movingSite) return

    const previousSites = sites

    const sourceCategoryId = movingSite.categoryId
    const sourceSites = sites.filter((site) => site.categoryId === sourceCategoryId && site.id !== siteId)
    const targetSitesBase = sourceCategoryId === targetCategoryId
      ? sourceSites
      : sites.filter((site) => site.categoryId === targetCategoryId)

    const insertIndex = Math.max(0, Math.min(targetIndex, targetSitesBase.length))
    const movedSite = { ...movingSite, categoryId: targetCategoryId }
    const targetSites = [...targetSitesBase]
    targetSites.splice(insertIndex, 0, movedSite)

    setSites((prev) => {
      const untouched = prev.filter((site) => site.categoryId !== sourceCategoryId && site.categoryId !== targetCategoryId)
      if (sourceCategoryId === targetCategoryId) {
        return [...untouched, ...targetSites]
      }
      return [...untouched, ...sourceSites, ...targetSites]
    })

    try {
      if (sourceCategoryId !== targetCategoryId) {
        const moveRes = await fetch("/api/sites", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: siteId, categoryId: targetCategoryId }),
        })
        if (!moveRes.ok) {
          throw new Error("move failed")
        }
      }

      await persistSiteOrder(targetCategoryId, targetSites.map((site) => site.id))
      if (sourceCategoryId !== targetCategoryId) {
        await persistSiteOrder(sourceCategoryId, sourceSites.map((site) => site.id))
      }
      toast.success(sourceCategoryId === targetCategoryId ? "排序已保存" : "网站已移动")
    } catch {
      setSites(previousSites)
      toast.error(sourceCategoryId === targetCategoryId ? "排序保存失败" : "网站移动失败")
    }
  }

  function handleBoardDragStart(event: DragStartEvent) {
    const activeId = String(event.active.id)
    if (activeId.startsWith("site:")) {
      setActiveSiteId(activeId.replace("site:", ""))
    }
  }

  async function handleBoardDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeId = String(active.id)
    const overId = String(over.id)

    if (activeId.startsWith("category:")) {
      const oldIndex = categories.findIndex((c) => `category:${c.id}` === activeId)
      const newIndex = categories.findIndex((c) => `category:${c.id}` === overId)
      const newOrder = arrayMove(categories, oldIndex, newIndex)
      setCategories(newOrder)

      try {
        await fetch("/api/categories/reorder", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderedIds: newOrder.map((c) => c.id) }),
        })
        toast.success("分类排序已保存")
      } catch {
        toast.error("排序保存失败")
      }
      return
    }

    if (!activeId.startsWith("site:")) return

    const siteId = activeId.replace("site:", "")
    const targetSiteId = overId.startsWith("site:") ? overId.replace("site:", "") : null
    const targetCategoryId = overId.startsWith("category:")
      ? overId.replace("category:", "")
      : sites.find((site) => site.id === targetSiteId)?.categoryId

    if (!targetCategoryId) return

    const targetSites = sites.filter((site) => site.categoryId === targetCategoryId)
    const targetIndex = targetSiteId
      ? Math.max(targetSites.findIndex((site) => site.id === targetSiteId), 0)
      : targetSites.length

    await moveSiteAcrossCategories(siteId, targetCategoryId, targetIndex)
  }

  function handleBoardDragCancel() {
    setActiveSiteId(null)
  }

  async function handleDropOnCategory(e: React.DragEvent, categoryId: string) {
    e.preventDefault()
    const raw = e.dataTransfer.getData("application/json")
    if (!raw) return
    try {
      const rec = JSON.parse(raw) as { name: string; url: string; description: string }
      const catSites = sites.filter((s) => s.categoryId === categoryId)
      const res = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId,
          name: rec.name,
          url: rec.url,
          description: rec.description,
          icon: "",
          order: catSites.length,
          tags: [],
        }),
      })
      if (res.ok) {
        const saved = await res.json()
        setSites((prev) => [...prev, saved])
        toast.success(`已添加「${rec.name}」`)
      }
    } catch { /* ignore */ }
  }

  function handleDragOverCategory(e: React.DragEvent) {
    e.preventDefault()
    e.dataTransfer.dropEffect = "copy"
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    window.location.href = "/"
  }

  async function handleShare() {
    if (!user) return
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: `${user.name}的收藏` }),
      })
      const data = await res.json()
      if (data.shareCode) {
        await navigator.clipboard.writeText(`${window.location.origin}?share=${data.shareCode}`)
        toast.success("分享链接已复制到剪贴板")
      }
    } catch {
      toast.error("分享失败")
    }
  }

  function handleCategoriesChange(newCategories: Category[]) {
    setCategories(newCategories)
  }

  function handleSitesChange(categoryId: string, newCategorySites: Site[]) {
    setSites((prev) => {
      const otherSites = prev.filter((site) => site.categoryId !== categoryId)
      return [...otherSites, ...newCategorySites]
    })
  }

  const densityGap: Record<LayoutDensity, string> = {
    compact: "gap-6",
    normal: "gap-10",
    relaxed: "gap-14",
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(circle_at_top,_oklch(0.72_0.08_260_/_0.18),_transparent_58%)]" />
        <div className="absolute left-[-10rem] top-24 h-72 w-72 rounded-full bg-[oklch(0.78_0.07_210_/_0.12)] blur-3xl" />
        <div className="absolute right-[-8rem] top-40 h-80 w-80 rounded-full bg-[oklch(0.68_0.09_35_/_0.12)] blur-3xl" />
      </div>
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/70 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/55">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Logo />
          <div className="flex items-center gap-1.5">
            {isOwner && (
              <>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant={editMode ? "default" : "ghost"}
                    size="icon-sm"
                    onClick={() => setEditMode(!editMode)}
                    title={editMode ? "退出编辑模式" : "编辑模式"}
                  >
                    {editMode ? <PencilOff className="size-4" /> : <Pencil className="size-4" />}
                  </Button>
                </motion.div>

                {editMode && (
                  <>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant={showAiPanel ? "default" : "ghost"}
                        size="icon-sm"
                        onClick={() => setShowAiPanel(!showAiPanel)}
                        title="AI 找网站"
                      >
                        <Sparkles className="size-4" />
                      </Button>
                    </motion.div>

                    <div className="flex items-center gap-0.5 rounded-xl border border-border/70 bg-card/75 p-0.5 shadow-[0_12px_30px_-18px_rgba(0,0,0,0.55)] backdrop-blur-xl">
                      <button
                        onClick={() => setCardSize("sm")}
                        className={`flex items-center justify-center rounded-md px-1.5 py-1 text-[11px] font-medium transition-all ${
                          cardSize === "sm" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                        }`}
                        title="小卡片"
                      >
                        <LayoutGrid className="size-3.5" />
                      </button>
                      <button
                        onClick={() => setCardSize("md")}
                        className={`flex items-center justify-center rounded-md px-1.5 py-1 text-[11px] font-medium transition-all ${
                          cardSize === "md" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                        }`}
                        title="中卡片"
                      >
                        <LayoutGrid className="size-4" />
                      </button>
                      <button
                        onClick={() => setCardSize("lg")}
                        className={`flex items-center justify-center rounded-md px-1.5 py-1 text-[11px] font-medium transition-all ${
                          cardSize === "lg" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                        }`}
                        title="大卡片"
                      >
                        <LayoutGrid className="size-[18px]" />
                      </button>
                    </div>

                    <div className="flex items-center gap-0.5 rounded-xl border border-border/70 bg-card/75 p-0.5 shadow-[0_12px_30px_-18px_rgba(0,0,0,0.55)] backdrop-blur-xl">
                      <button
                        onClick={() => setLayoutDensity("compact")}
                        className={`flex items-center justify-center rounded-md px-2 py-1 text-[11px] font-medium transition-all ${
                          layoutDensity === "compact" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                        }`}
                        title="紧凑"
                      >
                        <Rows3 className="size-3.5" style={{ strokeWidth: 2.5 }} />
                      </button>
                      <button
                        onClick={() => setLayoutDensity("normal")}
                        className={`flex items-center justify-center rounded-md px-2 py-1 text-[11px] font-medium transition-all ${
                          layoutDensity === "normal" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                        }`}
                        title="标准"
                      >
                        <Rows3 className="size-3.5" />
                      </button>
                      <button
                        onClick={() => setLayoutDensity("relaxed")}
                        className={`flex items-center justify-center rounded-md px-2 py-1 text-[11px] font-medium transition-all ${
                          layoutDensity === "relaxed" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                        }`}
                        title="宽松"
                      >
                        <Rows3 className="size-3.5" style={{ strokeWidth: 1.2 }} />
                      </button>
                    </div>
                  </>
                )}

                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="ghost" size="icon-sm" onClick={handleShare} title="分享">
                    <Share2 className="size-4" />
                  </Button>
                </motion.div>
                <Link href="/settings">
                  <Button variant="ghost" size="icon-sm" title="设置">
                    <Settings className="size-4" />
                  </Button>
                </Link>
              </>
            )}
            {!isOwner && (
              <Link href="/login">
                <Button variant="ghost" size="sm" className="gap-1.5">
                  <User className="size-4" />
                  <span className="hidden sm:inline">登录</span>
                </Button>
              </Link>
            )}
            <ThemeToggle />
            {isOwner && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="ghost" size="icon-sm" onClick={handleLogout} title="退出登录">
                  <LogOut className="size-4" />
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </header>

      <main className={`mx-auto max-w-6xl px-4 transition-[padding] duration-300 ${editMode ? "pl-10" : ""}`}>
        <HeroSection
          title={settings.heroTitle}
          subtitle={settings.heroSubtitle}
        />

        <div className="mb-4 rounded-[2rem] border border-border/50 bg-card/45 p-3 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:p-4">
          <SearchBar
            categories={categories}
            sites={sites}
            searchEngines={searchEngines}
            defaultEngineId={settings.defaultEngineId}
          />
        </div>

        <div className="mb-4">
          <CategoryNav categories={categories} editMode={editMode} onCategoriesChange={isOwner && editMode ? handleCategoriesChange : undefined} />
        </div>

        <DndContext
          sensors={categorySensors}
          collisionDetection={closestCenter}
          onDragStart={handleBoardDragStart}
          onDragEnd={async (event) => {
            await handleBoardDragEnd(event)
            setActiveSiteId(null)
          }}
          onDragCancel={handleBoardDragCancel}
        >
          <SortableContext items={categories.map((c) => `category:${c.id}`)} strategy={verticalListSortingStrategy}>
            <div className={`flex flex-col ${densityGap[layoutDensity]} pb-16`}>
              <AnimatePresence mode="popLayout">
                {categories.map((cat, i) => (
                  <SortableCategorySection
                    key={cat.id}
                    category={cat}
                    sites={sites.filter((s) => s.categoryId === cat.id)}
                    index={i}
                    editMode={editMode && isOwner}
                    cardSize={cardSize}
                    layoutDensity={layoutDensity}
                    onCategoryChange={(updated) => {
                      setCategories((prev) => prev.map((c) => c.id === updated.id ? updated : c))
                    }}
                    onCategoryDelete={(catId) => {
                      setCategories((prev) => prev.filter((c) => c.id !== catId))
                      setSites((prev) => prev.filter((s) => s.categoryId !== catId))
                    }}
                    onSitesChange={(newCategorySites) => handleSitesChange(cat.id, newCategorySites)}
                    onDropSite={handleDropOnCategory}
                    onDragOverSite={handleDragOverCategory}
                  />
                ))}
              </AnimatePresence>
            </div>
          </SortableContext>
          <DragOverlay>
            {activeSite ? (
              <div className="w-[280px] rounded-2xl border border-primary/20 bg-card/95 p-4 shadow-2xl shadow-black/15 backdrop-blur-xl">
                <div className="text-sm font-medium text-foreground">{activeSite.name}</div>
                <div className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{activeSite.description}</div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </main>

      <AnimatePresence>
        {showAiPanel && editMode && isOwner && aiSearch && (
          <AiSitePanel
            aiConfig={aiSearch}
            categories={categories}
            sites={sites}
            onAddSite={(site) => setSites((prev) => [...prev, site])}
            onClose={() => setShowAiPanel(false)}
          />
        )}
      </AnimatePresence>

      <footer className="border-t py-6">
        <div className="mx-auto max-w-6xl px-4 text-center text-xs text-muted-foreground">
          {settings.siteName} &copy; {new Date().getFullYear()}
        </div>
      </footer>

      <BackToTop />
    </div>
  )
}
