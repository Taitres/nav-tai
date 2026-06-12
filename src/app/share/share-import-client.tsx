"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { ArrowLeft, Download, Loader2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import Link from "next/link"
import type { SharedCollection } from "@/lib/types"

interface ShareImportClientProps {
  userId: string
}

export function ShareImportClient(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _props: ShareImportClientProps
) {
  const [shareCode, setShareCode] = useState("")
  const [collection, setCollection] = useState<SharedCollection | null>(null)
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [imported, setImported] = useState(false)

  async function handlePreview() {
    if (!shareCode.trim()) {
      toast.error("请输入分享码")
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/share?code=${encodeURIComponent(shareCode.trim())}`)
      if (res.ok) {
        const data = await res.json()
        setCollection(data)
        setSelectedCategories(new Set(data.data.categories.map((c: { id: string }) => c.id)))
      } else {
        toast.error("分享码无效")
      }
    } catch {
      toast.error("查询失败")
    }
    setLoading(false)
  }

  async function handleImport() {
    if (!collection) return
    setImporting(true)
    try {
      const res = await fetch("/api/share/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shareCode: collection.shareCode,
          selectedCategoryIds: Array.from(selectedCategories),
        }),
      })
      if (res.ok) {
        setImported(true)
        toast.success("导入成功！刷新页面查看")
      } else {
        toast.error("导入失败")
      }
    } catch {
      toast.error("导入失败")
    }
    setImporting(false)
  }

  function toggleCategory(id: string) {
    setSelectedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-4xl items-center gap-4 px-4">
          <Link href="/">
            <Button variant="ghost" size="icon-sm">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <h1 className="font-heading text-lg font-semibold">导入收藏</h1>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <h3 className="font-heading text-base font-semibold">输入分享码</h3>
          <div className="flex gap-2">
            <Input
              value={shareCode}
              onChange={(e) => setShareCode(e.target.value)}
              placeholder="输入分享码"
              onKeyDown={(e) => e.key === "Enter" && handlePreview()}
            />
            <Button onClick={handlePreview} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : "预览"}
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {collection && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="rounded-xl border bg-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading text-base font-semibold">{collection.name}</h3>
                  <span className="text-xs text-muted-foreground">
                    {collection.data.categories.length} 个分类 · {collection.data.sites.length} 个网站
                  </span>
                </div>

                <p className="text-xs text-muted-foreground">选择要导入的分类：</p>

                <div className="space-y-2">
                  {collection.data.categories.map((cat) => {
                    const catSites = collection.data.sites.filter((s) => s.categoryId === cat.id)
                    const isSelected = selectedCategories.has(cat.id)
                    return (
                      <motion.button
                        key={cat.id}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => toggleCategory(cat.id)}
                        className={`w-full text-left rounded-lg border p-3 transition-all duration-200 ${
                          isSelected ? "border-primary/40 bg-primary/5" : "border-border bg-card hover:bg-accent/30"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`size-4 rounded border flex items-center justify-center transition-colors ${
                            isSelected ? "bg-primary border-primary text-primary-foreground" : "border-border"
                          }`}>
                            {isSelected && <Check className="size-3" />}
                          </div>
                          <span>{cat.icon}</span>
                          <span className="text-sm font-medium">{cat.name}</span>
                          <span className="ml-auto text-xs text-muted-foreground">{catSites.length} 个网站</span>
                        </div>
                        {isSelected && catSites.length > 0 && (
                          <div className="mt-2 ml-6 flex flex-wrap gap-1.5">
                            {catSites.slice(0, 5).map((site) => (
                              <span key={site.id} className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[11px]">
                                {site.name}
                              </span>
                            ))}
                            {catSites.length > 5 && (
                              <span className="text-[11px] text-muted-foreground">+{catSites.length - 5} 更多</span>
                            )}
                          </div>
                        )}
                      </motion.button>
                    )
                  })}
                </div>

                {imported ? (
                  <div className="flex items-center gap-2 rounded-lg bg-primary/10 p-3 text-sm text-primary">
                    <Check className="size-4" />
                    导入成功！<Link href="/" className="underline">返回首页查看</Link>
                  </div>
                ) : (
                  <Button onClick={handleImport} disabled={importing || selectedCategories.size === 0} className="w-full gap-2">
                    {importing ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                    导入选中的 {selectedCategories.size} 个分类
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
