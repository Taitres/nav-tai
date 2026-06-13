"use client"

import { useState, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Sparkles, X, AlertCircle, RefreshCw, ExternalLink, Plus, Search, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { FaviconImg } from "@/components/shared/favicon-img"
import { toast } from "sonner"
import type { Site, Category, AiSearchConfig } from "@/lib/types"

interface AiSiteRecommendation {
  name: string
  url: string
  description: string
}

interface AiSitePanelProps {
  aiConfig: AiSearchConfig
  categories: Category[]
  sites: Site[]
  onAddSite: (site: Site) => void
  onClose: () => void
}

export function AiSitePanel({ aiConfig, categories, sites, onAddSite, onClose }: AiSitePanelProps) {
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<{ message: string; details?: string } | null>(null)
  const [recommendations, setRecommendations] = useState<AiSiteRecommendation[]>([])
  const [addedUrls, setAddedUrls] = useState<Set<string>>(new Set())
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(categories[0]?.id || "")
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return
    setLoading(true)
    setError(null)
    setRecommendations([])

    try {
      const res = await fetch("/api/ai-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, mode: "site" }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "AI 搜索请求失败" }))
        setError({ message: data.error || "AI 搜索请求失败", details: data.details })
        return
      }

      const contentType = res.headers.get("content-type") || ""
      if (contentType.includes("text/event-stream")) {
        const reader = res.body?.getReader()
        if (!reader) throw new Error("No reader")
        const decoder = new TextDecoder()
        let fullText = ""
        let buffer = ""
        let streamDone = false

        while (!streamDone) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split("\n")
          buffer = lines.pop() || ""

          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed.startsWith("data: ")) continue
            const data = trimmed.slice(6)
            if (data === "[DONE]") { streamDone = true; break }
            try {
              const parsed = JSON.parse(data)
              if (parsed.content) fullText += parsed.content
            } catch { /* skip */ }
          }
        }

        try {
          const jsonMatch = fullText.match(/\[[\s\S]*\]/)
          if (jsonMatch) {
            const cards = JSON.parse(jsonMatch[0]) as AiSiteRecommendation[]
            setRecommendations(cards)
          } else {
            setError({ message: "AI 返回格式异常，请重试" })
          }
        } catch {
          setError({ message: "AI 返回格式异常，请重试" })
        }
      } else {
        const data = await res.json()
        setError({ message: data.error || "未知错误", details: data.details })
      }
    } catch {
      setError({ message: "网络连接失败，请检查网络后重试" })
    } finally {
      setLoading(false)
    }
  }, [query])

  async function handleAddSite(rec: AiSiteRecommendation) {
    if (addedUrls.has(rec.url)) return
    if (!selectedCategoryId) {
      toast.error("请先选择目标分类")
      return
    }
    try {
      const res = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: selectedCategoryId,
          name: rec.name,
          url: rec.url,
          description: rec.description,
          icon: "",
          order: sites.filter((s) => s.categoryId === selectedCategoryId).length,
          tags: [],
        }),
      })
      if (res.ok) {
        const saved = await res.json()
        onAddSite(saved)
        setAddedUrls((prev) => new Set(prev).add(rec.url))
        toast.success(`已添加「${rec.name}」到分类`)
      } else {
        toast.error("添加失败")
      }
    } catch {
      toast.error("添加失败")
    }
  }

  function handleDragStart(e: React.DragEvent<HTMLDivElement>, rec: AiSiteRecommendation) {
    e.dataTransfer.setData("application/json", JSON.stringify(rec))
    e.dataTransfer.effectAllowed = "copy"
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="fixed top-14 right-0 bottom-0 z-40 w-full max-w-md border-l border-border/60 bg-background/95 backdrop-blur-2xl shadow-2xl shadow-black/10 flex flex-col"
    >
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <span className="text-sm font-semibold">AI 找网站</span>
        </div>
        <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
          <X className="size-4" />
        </button>
      </div>

      <div className="p-4 space-y-3 border-b">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !loading && handleSearch()}
              placeholder="输入关键词搜索网站..."
              className="pl-9 h-9 text-sm"
            />
          </div>
          <Button onClick={handleSearch} disabled={loading || !query.trim()} size="sm" className="gap-1.5 shrink-0">
            {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
            搜索
          </Button>
        </div>

        {categories.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground shrink-0">添加到：</span>
            <div className="flex flex-wrap gap-1">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${
                    selectedCategoryId === cat.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span>{cat.icon}</span>
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="size-4 shrink-0 mt-0.5 text-destructive" />
              <div className="min-w-0 flex-1 text-sm text-destructive">{error.message}</div>
            </div>
            <Button onClick={handleSearch} size="sm" variant="outline" className="w-full gap-1.5">
              <RefreshCw className="size-3.5" />
              重试
            </Button>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <div className="relative">
              <div className="size-10 rounded-full border-2 border-primary/20" />
              <div className="absolute inset-0 size-10 rounded-full border-2 border-transparent border-t-primary animate-spin" />
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>AI 正在搜索网站</span>
              <span className="animate-pulse">...</span>
            </div>
          </div>
        )}

        {recommendations.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">
              找到 {recommendations.length} 个推荐 · 拖拽卡片到分类或点击添加
            </div>
            {recommendations.map((rec, i) => {
              const isAdded = addedUrls.has(rec.url)
              const isExisting = sites.some((s) => s.url === rec.url)
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <div
                    draggable={!isAdded && !isExisting}
                    onDragStart={(e) => handleDragStart(e, rec)}
                    className={`group rounded-xl border bg-card/80 p-3 transition-all ${
                      isAdded || isExisting
                        ? "border-green-500/30 bg-green-500/5 opacity-60"
                        : "border-border/50 hover:border-primary/20 hover:bg-accent/20 cursor-grab active:cursor-grabbing active:shadow-lg active:shadow-primary/10"
                    }`}
                  >
                  <div className="flex items-start gap-3">
                    <FaviconImg url={rec.url} name={rec.name} className="size-9 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-medium truncate">{rec.name}</h4>
                        <a href={rec.url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-muted-foreground hover:text-primary transition-colors" title="访问网站">
                          <ExternalLink className="size-3" />
                        </a>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{rec.description}</p>
                      <p className="text-[11px] text-primary/60 truncate mt-1">{rec.url}</p>
                    </div>
                    {isAdded ? (
                      <span className="shrink-0 text-[11px] text-green-600 font-medium mt-1">已添加</span>
                    ) : isExisting ? (
                      <span className="shrink-0 text-[11px] text-muted-foreground mt-1">已存在</span>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0 gap-1 h-7 text-xs"
                        onClick={() => handleAddSite(rec)}
                      >
                        <Plus className="size-3" />
                        添加
                      </Button>
                    )}
                  </div>
                </div>
                </motion.div>
              )
            })}
          </div>
        )}

        {!loading && !error && recommendations.length === 0 && (
          <div className="py-16 text-center">
            <Sparkles className="mx-auto size-10 text-primary/20 mb-3" />
            <p className="text-sm text-muted-foreground">输入关键词，AI 为你推荐网站</p>
            <p className="mt-1 text-xs text-muted-foreground/60">结果可拖拽到左侧分类</p>
          </div>
        )}
      </div>
    </motion.div>
  )
}
