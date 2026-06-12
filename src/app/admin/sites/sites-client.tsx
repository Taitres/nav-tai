"use client"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  ExternalLink,
  Globe,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { FaviconImg } from "@/components/shared/favicon-img"
import type { Category, Site } from "@/lib/types"

interface SitesManagerProps {
  initialCategories: Category[]
  initialSites: Site[]
}

function SortableSiteCard({
  site,
  categoryIcon,
  categoryName,
  onEdit,
  onDelete,
}: {
  site: Site
  categoryIcon: string
  categoryName: string
  onEdit: (site: Site) => void
  onDelete: (id: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: site.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      className={`group flex items-center gap-4 rounded-xl border bg-card p-4 transition-shadow ${
        isDragging ? "z-50 shadow-lg" : ""
      }`}
    >
      <button
        className="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-5" />
      </button>

      <FaviconImg url={site.url} name={site.name} className="size-8 shrink-0" />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-medium">{site.name}</h3>
          <span className="text-xs">{categoryIcon}</span>
          <span className="text-xs text-muted-foreground">{categoryName}</span>
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {site.description}
        </p>
      </div>

      <div className="hidden flex-wrap gap-1 sm:flex">
        {site.tags.slice(0, 3).map((tag) => (
          <Badge key={tag} variant="secondary" className="text-xs">
            {tag}
          </Badge>
        ))}
      </div>

      <a
        href={site.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-muted-foreground hover:text-foreground"
      >
        <ExternalLink className="size-3.5" />
      </a>

      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <Button variant="ghost" size="icon-sm" onClick={() => onEdit(site)}>
          <Pencil className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onDelete(site.id)}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </motion.div>
  )
}

export function SitesManager({
  initialCategories,
  initialSites,
}: SitesManagerProps) {
  const [sites, setSites] = useState(initialSites)
  const [categories] = useState(initialCategories)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSite, setEditingSite] = useState<Site | null>(null)
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [form, setForm] = useState({
    categoryId: "",
    name: "",
    url: "",
    description: "",
    icon: "",
    tags: "",
  })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const filteredSites =
    filterCategory === "all"
      ? sites
      : sites.filter((s) => s.categoryId === filterCategory)

  function getCategoryName(catId: string) {
    return categories.find((c) => c.id === catId)?.name || "未知"
  }

  function getCategoryIcon(catId: string) {
    return categories.find((c) => c.id === catId)?.icon || "📁"
  }

  function openCreate() {
    setEditingSite(null)
    setForm({
      categoryId: categories[0]?.id || "",
      name: "",
      url: "",
      description: "",
      icon: "",
      tags: "",
    })
    setDialogOpen(true)
  }

  function openEdit(site: Site) {
    setEditingSite(site)
    setForm({
      categoryId: site.categoryId,
      name: site.name,
      url: site.url,
      description: site.description,
      icon: site.icon,
      tags: site.tags.join(", "),
    })
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!form.name.trim() || !form.url.trim() || !form.categoryId) {
      toast.error("名称、URL 和分类不能为空")
      return
    }

    const tags = form.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)

    try {
      if (editingSite) {
        const res = await fetch("/api/admin/sites", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingSite.id,
            categoryId: form.categoryId,
            name: form.name,
            url: form.url,
            description: form.description,
            icon: form.icon,
            tags,
          }),
        })
        if (!res.ok) throw new Error()
        const updated = await res.json()
        setSites((prev) =>
          prev.map((s) => (s.id === editingSite.id ? { ...s, ...updated } : s))
        )
        toast.success("网站已更新")
      } else {
        const catSites = sites.filter((s) => s.categoryId === form.categoryId)
        const maxOrder = Math.max(...catSites.map((s) => s.order), 0) + 1
        const res = await fetch("/api/admin/sites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            categoryId: form.categoryId,
            name: form.name,
            url: form.url,
            description: form.description,
            icon: form.icon,
            order: maxOrder,
            tags,
          }),
        })
        if (!res.ok) throw new Error()
        const created = await res.json()
        setSites((prev) => [...prev, created])
        toast.success("网站已添加")
      }
      setDialogOpen(false)
    } catch {
      toast.error("操作失败")
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch("/api/admin/sites", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) throw new Error()
      setSites((prev) => prev.filter((s) => s.id !== id))
      toast.success("网站已删除")
    } catch {
      toast.error("删除失败")
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = filteredSites.findIndex((s) => s.id === active.id)
    const newIndex = filteredSites.findIndex((s) => s.id === over.id)
    const newOrder = arrayMove(filteredSites, oldIndex, newIndex)
    setSites(newOrder)

    try {
      await fetch("/api/admin/sites/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds: newOrder.map((s) => s.id) }),
      })
      toast.success("排序已保存")
    } catch {
      toast.error("排序保存失败")
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">网站管理</h1>
          <p className="text-sm text-muted-foreground">
            拖拽排序，点击编辑
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          新增网站
        </Button>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <Select
          value={filterCategory}
          onValueChange={(value) => setFilterCategory(value ?? "all")}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="按分类筛选" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部分类</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">
          {filteredSites.length} 个网站
        </span>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={filteredSites.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-3">
            <AnimatePresence>
              {filteredSites.map((site) => (
                <SortableSiteCard
                  key={site.id}
                  site={site}
                  categoryIcon={getCategoryIcon(site.categoryId)}
                  categoryName={getCategoryName(site.categoryId)}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                />
              ))}
            </AnimatePresence>
          </div>
        </SortableContext>
      </DndContext>

      {filteredSites.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Globe className="mb-3 size-12" />
          <p>还没有网站，点击上方按钮添加</p>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingSite ? "编辑网站" : "新增网站"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>所属分类</Label>
              <Select
                value={form.categoryId}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, categoryId: v ?? "" }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择分类" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>网站名称</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="网站名称"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>URL</Label>
              <Input
                value={form.url}
                onChange={(e) =>
                  setForm((f) => ({ ...f, url: e.target.value }))
                }
                placeholder="https://example.com"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>描述</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="网站描述"
                rows={2}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>标签 (逗号分隔)</Label>
              <Input
                value={form.tags}
                onChange={(e) =>
                  setForm((f) => ({ ...f, tags: e.target.value }))
                }
                placeholder="AI, 工具, 对话"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>图标 (可选，留空自动获取)</Label>
              <Input
                value={form.icon}
                onChange={(e) =>
                  setForm((f) => ({ ...f, icon: e.target.value }))
                }
                placeholder="emoji 或 URL"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>取消</DialogClose>
            <Button onClick={handleSave}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}