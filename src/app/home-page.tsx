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
import { LogOut, Settings, Share2, Pencil, PencilOff, User, LayoutGrid, Rows3, GripVertical } from "lucide-react"
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

function SortableCategorySection({ category, sites, index, editMode, cardSize, layoutDensity, onCategoryChange, onCategoryDelete, onSitesChange, allCategories }: {
  category: Category
  sites: Site[]
  index: number
  editMode?: boolean
  cardSize: CardSize
  layoutDensity: LayoutDensity
  onCategoryChange?: (updated: Category) => void
  onCategoryDelete?: (id: string) => void
  onSitesChange?: (sites: Site[]) => void
  allCategories?: Category[]
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: category.id })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : undefined,
      }}
      className="relative"
    >
      {editMode && (
        <button
          {...attributes}
          {...listeners}
          className="absolute -left-6 top-4 z-20 flex size-7 items-center justify-center rounded-full bg-muted/80 text-muted-foreground hover:bg-accent hover:text-foreground cursor-grab active:cursor-grabbing shadow-sm backdrop-blur-sm"
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
        allCategories={allCategories}
      />
    </div>
  )
}

export function HomePage({ categories: initialCategories, sites: initialSites, settings, searchEngines, aiSearch, isOwner, user }: HomePageProps) {
  const [editMode, setEditMode] = useState(false)
  const [categories, setCategories] = useState(initialCategories)
  const [sites, setSites] = useState(initialSites)
  const [cardSize, setCardSize] = useState<CardSize>("md")
  const [layoutDensity, setLayoutDensity] = useState<LayoutDensity>("normal")

  const categorySensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  async function handleCategoryDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = categories.findIndex((c) => c.id === active.id)
    const newIndex = categories.findIndex((c) => c.id === over.id)
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

  function handleSitesChange(newSites: Site[]) {
    setSites(newSites)
  }

  const densityGap: Record<LayoutDensity, string> = {
    compact: "gap-6",
    normal: "gap-10",
    relaxed: "gap-14",
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-xl">
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
                    <div className="flex items-center gap-0.5 rounded-lg border bg-muted/50 p-0.5">
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

                    <div className="flex items-center gap-0.5 rounded-lg border bg-muted/50 p-0.5">
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

      <main className={`mx-auto max-w-6xl px-4 ${editMode ? "pl-10" : ""}`}>
        <HeroSection
          title={settings.heroTitle}
          subtitle={settings.heroSubtitle}
        />

        <div className="mb-6">
          <SearchBar
            categories={categories}
            sites={sites}
            searchEngines={searchEngines}
            aiSearch={aiSearch}
            defaultEngineId={settings.defaultEngineId}
            editMode={editMode}
            onAddSite={isOwner && editMode ? (site) => {
              setSites((prev) => [...prev, site])
            } : undefined}
          />
        </div>

        <div className="mb-8">
          <CategoryNav categories={categories} editMode={editMode} onCategoriesChange={isOwner && editMode ? handleCategoriesChange : undefined} />
        </div>

        <DndContext sensors={categorySensors} collisionDetection={closestCenter} onDragEnd={handleCategoryDragEnd}>
          <SortableContext items={categories.map((c) => c.id)} strategy={verticalListSortingStrategy}>
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
                    onSitesChange={handleSitesChange}
                    allCategories={categories}
                  />
                ))}
              </AnimatePresence>
            </div>
          </SortableContext>
        </DndContext>
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
