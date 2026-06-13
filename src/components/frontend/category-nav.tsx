"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import type { Category } from "@/lib/types"

interface CategoryNavProps {
  categories: Category[]
  editMode?: boolean
  onCategoriesChange?: (categories: Category[]) => void
}

export function CategoryNav({ categories, editMode, onCategoriesChange }: CategoryNavProps) {
  const [showAdd, setShowAdd] = useState(false)
  const [newCat, setNewCat] = useState({ name: "", icon: "📁", slug: "" })

  async function handleAdd() {
    if (!newCat.name) {
      toast.error("请输入分类名称")
      return
    }
    const slug = newCat.slug || newCat.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\u4e00-\u9fff-]/g, "")
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCat.name,
          slug,
          icon: newCat.icon,
          description: "",
          order: categories.length,
        }),
      })
      if (res.ok) {
        const saved = await res.json()
        onCategoriesChange?.([...categories, saved])
        setNewCat({ name: "", icon: "📁", slug: "" })
        setShowAdd(false)
        toast.success("分类已添加")
      }
    } catch {
      toast.error("添加失败")
    }
  }

  return (
    <div className="space-y-2">
      <motion.nav
        initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ type: "spring", duration: 0.3, bounce: 0, delay: 0.1 }}
        className="no-scrollbar flex gap-2 overflow-x-auto pb-2"
      >
        {categories.map((cat) => (
          <a
            key={cat.id}
            href={`#${cat.slug}`}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border/50 bg-card px-3 py-1.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:border-primary/30 hover:bg-accent/50 hover:text-foreground"
          >
            <span>{cat.icon}</span>
            {cat.name}
          </a>
        ))}
        {editMode && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAdd(!showAdd)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:border-primary/50 hover:bg-primary/10"
          >
            <Plus className="size-3.5" />
            添加分类
          </motion.button>
        )}
      </motion.nav>

      <AnimatePresence>
        {showAdd && editMode && (
          <motion.div
            initial={{ opacity: 0, y: -6, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
            transition={{ type: "spring", duration: 0.25, bounce: 0 }}
          >
            <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
              <Input
                value={newCat.icon}
                onChange={(e) => setNewCat({ ...newCat, icon: e.target.value })}
                className="w-14 text-center text-lg p-1 h-8"
                placeholder="📁"
              />
              <Input
                value={newCat.name}
                onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
                className="h-8 flex-1"
                placeholder="分类名称"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
              <Button size="sm" onClick={handleAdd}>添加</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}>取消</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
