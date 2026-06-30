"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Pencil, Trash2, Plus, Check, X as XIcon, GripVertical } from "lucide-react"
import { SiteCard } from "./site-card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useDroppable } from "@dnd-kit/core"
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { Category, Site } from "@/lib/types"

type CardSize = "sm" | "md" | "lg"
type LayoutDensity = "compact" | "normal" | "relaxed"

interface CategorySectionProps {
  category: Category
  sites: Site[]
  categoryIndex?: number
  editMode?: boolean
  cardSize?: CardSize
  layoutDensity?: LayoutDensity
  onCategoryChange?: (updated: Category) => void
  onCategoryDelete?: (id: string) => void
  onSitesChange?: (sites: Site[]) => void
  onDropSite?: (e: React.DragEvent, categoryId: string) => void
  onDragOverSite?: (e: React.DragEvent) => void
}

function SortableSiteCard({ site, index, editMode, onDelete, onUpdate, cardSize }: {
  site: Site
  index: number
  editMode?: boolean
  onDelete?: () => void
  onUpdate?: (updates: Partial<Site>) => void
  cardSize?: CardSize
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: `site:${site.id}` })

  const dragStyle = isDragging
    ? { transform: CSS.Transform.toString(transform), transition, opacity: 0.5, zIndex: 50 }
    : { transform: CSS.Transform.toString(transform), transition: transition || "transform 200ms cubic-bezier(0.16, 1, 0.3, 1)" }

  return (
    <div
      ref={setNodeRef}
      style={dragStyle}
    >
      {editMode && (
        <div className="relative">
          <button
            {...attributes}
            {...listeners}
            className="absolute -left-1 -top-1 z-20 flex size-6 touch-none items-center justify-center rounded-full border bg-background/90 text-muted-foreground shadow-sm backdrop-blur-md transition-colors hover:bg-accent hover:text-foreground cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="size-3.5" />
          </button>
        </div>
      )}
      <SiteCard
        site={site}
        index={index}
        editMode={editMode}
        onDelete={onDelete}
        onUpdate={onUpdate}
        cardSize={cardSize}
      />
    </div>
  )
}

const gridCols: Record<CardSize, string> = {
  sm: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6",
  md: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
  lg: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4",
}

const gapMap: Record<LayoutDensity, string> = {
  compact: "gap-2",
  normal: "gap-3",
  relaxed: "gap-4",
}

export function CategorySection({ category, sites, categoryIndex = 0, editMode, cardSize = "md", layoutDensity = "normal", onCategoryChange, onCategoryDelete, onSitesChange, onDropSite, onDragOverSite }: CategorySectionProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(category.name)
  const [editIcon, setEditIcon] = useState(category.icon)
  const [editDesc, setEditDesc] = useState(category.description)
  const [showAddSite, setShowAddSite] = useState(false)
  const [newSite, setNewSite] = useState({ name: "", url: "", description: "", tags: "" })

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({ id: `category:${category.id}` })

  if (sites.length === 0 && !editMode) return null

  async function handleSaveEdit() {
    try {
      const res = await fetch("/api/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: category.id, name: editName, icon: editIcon, description: editDesc }),
      })
      if (res.ok) {
        const updated = await res.json()
        onCategoryChange?.(updated)
        setIsEditing(false)
        toast.success("分类已更新")
      }
    } catch {
      toast.error("更新失败")
    }
  }

  async function handleDelete() {
    if (sites.length > 0) {
      toast.error("该分类下还有网站，请先删除或移动")
      return
    }
    try {
      const res = await fetch("/api/categories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: category.id }),
      })
      if (res.ok) {
        onCategoryDelete?.(category.id)
        toast.success("分类已删除")
      }
    } catch {
      toast.error("删除失败")
    }
  }

  async function handleAddSite() {
    if (!newSite.name || !newSite.url) {
      toast.error("请填写网站名称和链接")
      return
    }
    try {
      const res = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: category.id,
          name: newSite.name,
          url: newSite.url,
          description: newSite.description,
          icon: "",
          order: sites.length,
          tags: newSite.tags.split(",").map((t) => t.trim()).filter(Boolean),
        }),
      })
      if (res.ok) {
        const saved = await res.json()
        const newSites = [...sites, saved]
        onSitesChange?.(newSites)
        setNewSite({ name: "", url: "", description: "", tags: "" })
        setShowAddSite(false)
        toast.success("网站已添加")
      }
    } catch {
      toast.error("添加失败")
    }
  }

  async function handleDeleteSite(siteId: string) {
    try {
      const res = await fetch("/api/sites", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: siteId }),
      })
      if (res.ok) {
        const newSites = sites.filter((s) => s.id !== siteId)
        onSitesChange?.(newSites)
        toast.success("网站已删除")
      }
    } catch {
      toast.error("删除失败")
    }
  }

  async function handleUpdateSite(site: Site, updates: Partial<Site>) {
    try {
      const res = await fetch("/api/sites", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: site.id, ...updates }),
      })
      if (res.ok) {
        const updated = await res.json()
        const newSites = sites.map((s) => s.id === updated.id ? updated : s)
        onSitesChange?.(newSites)
        return updated
      }
    } catch {
      toast.error("更新失败")
    }
    return site
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{
        type: "spring",
        duration: 0.3,
        bounce: 0,
        delay: categoryIndex * 0.05,
      }}
      className="scroll-mt-20"
      id={category.slug}
      layout
    >
      <div className="mb-4 flex items-center gap-3">
        {editMode && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <Pencil className="size-3.5" />
            </button>
            <button
              onClick={handleDelete}
              className="rounded-md p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        )}

        {isEditing ? (
          <div className="flex items-center gap-2 flex-1 flex-wrap">
            <Input
              value={editIcon}
              onChange={(e) => setEditIcon(e.target.value)}
              className="w-12 text-center text-lg p-1 h-8"
              placeholder="📁"
            />
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="h-8 text-base font-semibold w-32"
            />
            <Input
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              className="h-8 text-xs flex-1 min-w-40"
              placeholder="描述"
            />
            <Button size="sm" variant="ghost" onClick={handleSaveEdit} className="shrink-0">
              <Check className="size-3.5" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} className="shrink-0">
              <XIcon className="size-3.5" />
            </Button>
          </div>
        ) : (
          <>
            <span className="text-2xl">{category.icon}</span>
            <div>
              <h2 className="font-heading text-lg font-semibold">{category.name}</h2>
              {category.description && (
                <p className="text-sm text-muted-foreground">{category.description}</p>
              )}
            </div>
          </>
        )}

        {editMode && (
          <div className="ml-auto">
            <Dialog open={showAddSite} onOpenChange={setShowAddSite}>
              <DialogTrigger
                render={<Button size="sm" variant="outline" className="gap-1.5" />}
              >
                <Plus className="size-3.5" />
                添加网站
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>添加网站到「{category.name}」</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4 pt-2">
                  <div className="flex flex-col gap-2">
                    <Label>网站名称</Label>
                    <Input value={newSite.name} onChange={(e) => setNewSite({ ...newSite, name: e.target.value })} placeholder="例如：GitHub" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>链接</Label>
                    <Input value={newSite.url} onChange={(e) => setNewSite({ ...newSite, url: e.target.value })} placeholder="https://..." />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>描述</Label>
                    <Input value={newSite.description} onChange={(e) => setNewSite({ ...newSite, description: e.target.value })} placeholder="简要描述" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>标签（逗号分隔）</Label>
                    <Input value={newSite.tags} onChange={(e) => setNewSite({ ...newSite, tags: e.target.value })} placeholder="AI, 对话, OpenAI" />
                  </div>
                  <Button onClick={handleAddSite}>添加</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      <SortableContext items={sites.map((s) => `site:${s.id}`)} strategy={rectSortingStrategy}>
          <div
            ref={setDroppableRef}
            onDrop={onDropSite ? (e) => onDropSite(e, category.id) : undefined}
            onDragOver={onDragOverSite}
            className={`grid rounded-[1.75rem] p-2 transition-all duration-300 ${gridCols[cardSize]} ${gapMap[layoutDensity]} ${
              editMode && isOver ? "bg-primary/8 ring-2 ring-primary/25 shadow-[0_0_24px_-8px_var(--primary)]" : ""
            }`}
          >
            <AnimatePresence mode="popLayout">
              {sites.map((site, i) => (
                <SortableSiteCard
                  key={site.id}
                  site={site}
                  index={i}
                  editMode={editMode}
                  onDelete={() => handleDeleteSite(site.id)}
                  onUpdate={(updates) => handleUpdateSite(site, updates)}
                  cardSize={cardSize}
                />
              ))}
            </AnimatePresence>
          </div>
      </SortableContext>

      {editMode && sites.length === 0 && (
        <div className="py-8 text-center text-sm text-muted-foreground">
          暂无网站，点击上方按钮添加
        </div>
      )}
    </motion.section>
  )
}
