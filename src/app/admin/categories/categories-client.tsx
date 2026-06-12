"use client"

import { useState } from "react"
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
  Globe,
  FolderOpen,
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
import type { Category, Site } from "@/lib/types"

interface CategoriesManagerProps {
  initialCategories: Category[]
  initialSites: Site[]
}

function SortableCategoryCard({
  category,
  siteCount,
  onEdit,
  onDelete,
}: {
  category: Category
  siteCount: number
  onEdit: (cat: Category) => void
  onDelete: (id: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id })

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

      <span className="text-2xl">{category.icon}</span>

      <div className="min-w-0 flex-1">
        <h3 className="font-medium">{category.name}</h3>
        <p className="truncate text-xs text-muted-foreground">
          {category.description}
        </p>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Globe className="size-3.5" />
        {siteCount} 个网站
      </div>

      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <Button variant="ghost" size="icon-sm" onClick={() => onEdit(category)}>
          <Pencil className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onDelete(category.id)}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </motion.div>
  )
}

export function CategoriesManager({
  initialCategories,
  initialSites,
}: CategoriesManagerProps) {
  const [categories, setCategories] = useState(initialCategories)
  const [sites] = useState(initialSites)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [form, setForm] = useState({
    name: "",
    slug: "",
    icon: "📁",
    description: "",
  })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  function openCreate() {
    setEditingCategory(null)
    setForm({ name: "", slug: "", icon: "📁", description: "" })
    setDialogOpen(true)
  }

  function openEdit(cat: Category) {
    setEditingCategory(cat)
    setForm({
      name: cat.name,
      slug: cat.slug,
      icon: cat.icon,
      description: cat.description,
    })
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!form.name.trim() || !form.slug.trim()) {
      toast.error("名称和 Slug 不能为空")
      return
    }

    try {
      if (editingCategory) {
        const res = await fetch("/api/admin/categories", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingCategory.id, ...form }),
        })
        if (!res.ok) throw new Error()
        const updated = await res.json()
        setCategories((prev) =>
          prev.map((c) => (c.id === editingCategory.id ? { ...c, ...updated } : c))
        )
        toast.success("分类已更新")
      } else {
        const maxOrder = Math.max(...categories.map((c) => c.order), 0) + 1
        const res = await fetch("/api/admin/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, order: maxOrder }),
        })
        if (!res.ok) throw new Error()
        const created = await res.json()
        setCategories((prev) => [...prev, created])
        toast.success("分类已创建")
      }
      setDialogOpen(false)
    } catch {
      toast.error("操作失败")
    }
  }

  async function handleDelete(id: string) {
    const siteCount = sites.filter((s) => s.categoryId === id).length
    if (siteCount > 0) {
      toast.error(`该分类下还有 ${siteCount} 个网站，请先移除`)
      return
    }
    try {
      const res = await fetch("/api/admin/categories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) throw new Error()
      setCategories((prev) => prev.filter((c) => c.id !== id))
      toast.success("分类已删除")
    } catch {
      toast.error("删除失败")
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = categories.findIndex((c) => c.id === active.id)
    const newIndex = categories.findIndex((c) => c.id === over.id)
    const newOrder = arrayMove(categories, oldIndex, newIndex)
    setCategories(newOrder)

    try {
      await fetch("/api/admin/categories/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds: newOrder.map((c) => c.id) }),
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
          <h1 className="font-heading text-2xl font-bold">分类管理</h1>
          <p className="text-sm text-muted-foreground">拖拽排序，点击编辑</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          新增分类
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={categories.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-3">
            <AnimatePresence>
              {categories.map((cat) => (
                <SortableCategoryCard
                  key={cat.id}
                  category={cat}
                  siteCount={sites.filter((s) => s.categoryId === cat.id).length}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                />
              ))}
            </AnimatePresence>
          </div>
        </SortableContext>
      </DndContext>

      {categories.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <FolderOpen className="mb-3 size-12" />
          <p>还没有分类，点击上方按钮添加</p>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "编辑分类" : "新增分类"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>图标 (Emoji)</Label>
              <Input
                value={form.icon}
                onChange={(e) =>
                  setForm((f) => ({ ...f, icon: e.target.value }))
                }
                placeholder="📁"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>名称</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="分类名称"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Slug</Label>
              <Input
                value={form.slug}
                onChange={(e) =>
                  setForm((f) => ({ ...f, slug: e.target.value }))
                }
                placeholder="category-slug"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>描述</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="分类描述"
                rows={2}
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
