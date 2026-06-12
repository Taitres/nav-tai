"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Search, Command, Globe, Sparkles, ArrowRight, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import type { Site, Category, SearchEngine, AiSearchConfig } from "@/lib/types"

interface SearchBarProps {
  categories: Category[]
  sites: Site[]
  searchEngines: SearchEngine[]
  aiSearch: AiSearchConfig | null
}

type SearchMode = "local" | "engine" | "ai"

interface LocalResult {
  type: "site"
  site: Site
  category: Category | undefined
}

export function SearchBar({ categories, sites, searchEngines, aiSearch }: SearchBarProps) {
  const [query, setQuery] = useState("")
  const [mode, setMode] = useState<SearchMode>("local")
  const [selectedEngine, setSelectedEngine] = useState(searchEngines[0])
  const [localResults, setLocalResults] = useState<LocalResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [aiResult, setAiResult] = useState<string>("")
  const [aiLoading, setAiLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const enabledEngines = searchEngines.filter((e) => e.enabled)

  const searchLocal = useCallback(
    (q: string) => {
      if (!q.trim()) {
        setLocalResults([])
        return
      }
      const lower = q.toLowerCase()
      const results = sites
        .filter(
          (s) =>
            s.name.toLowerCase().includes(lower) ||
            s.description.toLowerCase().includes(lower) ||
            s.tags.some((t) => t.toLowerCase().includes(lower))
        )
        .slice(0, 8)
        .map((site) => ({
          type: "site" as const,
          site,
          category: categories.find((c) => c.id === site.categoryId),
        }))
      setLocalResults(results)
    },
    [sites, categories]
  )

  useEffect(() => {
    if (mode === "local") {
      searchLocal(query)
    } else {
      setLocalResults([])
    }
  }, [query, mode, searchLocal])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        inputRef.current?.focus()
        setIsOpen(true)
      }
      if (e.key === "Escape") {
        setIsOpen(false)
        inputRef.current?.blur()
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function handleEngineSearch() {
    if (!query.trim() || !selectedEngine) return
    const url = selectedEngine.urlTemplate.replace("{query}", encodeURIComponent(query))
    window.open(url, "_blank")
  }

  async function handleAiSearch() {
    if (!query.trim() || !aiSearch) return
    setAiLoading(true)
    setAiResult("")
    try {
      const res = await fetch("/api/ai-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      })
      const data = await res.json()
      if (data.result) {
        setAiResult(data.result)
      } else {
        setAiResult(data.error || "搜索失败，请检查 AI 配置")
      }
    } catch {
      setAiResult("搜索失败，请检查网络连接")
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl mx-auto">
      <motion.div
        animate={{
          boxShadow: isOpen
            ? "0 0 0 2px hsl(var(--primary) / 0.3), 0 8px 30px hsl(var(--primary) / 0.08)"
            : "0 0 0 1px hsl(var(--border) / 0.5), 0 2px 8px rgba(0,0,0,0.04)",
        }}
        transition={{ duration: 0.2 }}
        className="relative rounded-2xl bg-card"
      >
        <div className="flex items-center gap-2 px-4 py-3">
          <Search className="size-5 shrink-0 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setIsOpen(true)
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="搜索网站、工具或资源..."
            className="border-0 bg-transparent p-0 text-base shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/60"
          />
          <div className="flex items-center gap-1 shrink-0">
            <kbd className="pointer-events-none hidden h-5 items-center gap-1 rounded border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground sm:flex">
              <Command className="size-2.5" />K
            </kbd>
          </div>
        </div>

        <div className="flex items-center gap-1 border-t px-3 py-2">
          <button
            onClick={() => { setMode("local"); searchLocal(query) }}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
              mode === "local"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Sparkles className="size-3" />
            本地
          </button>
          {enabledEngines.length > 0 && (
            <button
              onClick={() => setMode("engine")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                mode === "engine"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Globe className="size-3" />
              搜索引擎
            </button>
          )}
          {aiSearch && (
            <button
              onClick={() => setMode("ai")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                mode === "ai"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Sparkles className="size-3" />
              AI 搜索
            </button>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {isOpen && query.trim() && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-xl border bg-popover shadow-xl"
          >
            {mode === "local" && (
              <div className="max-h-80 overflow-y-auto p-2">
                {localResults.length > 0 ? (
                  localResults.map((result) => (
                    <a
                      key={result.site.id}
                      href={result.site.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-accent"
                    >
                      <div className="flex size-8 items-center justify-center rounded-md bg-muted text-xs font-bold text-muted-foreground">
                        {result.site.name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium">{result.site.name}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {result.category?.name} · {result.site.description}
                        </div>
                      </div>
                      <ArrowRight className="size-3.5 text-muted-foreground" />
                    </a>
                  ))
                ) : (
                  <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                    没有找到匹配的网站
                  </div>
                )}
              </div>
            )}

            {mode === "engine" && (
              <div className="p-3">
                <div className="mb-3 text-xs text-muted-foreground">选择搜索引擎</div>
                <div className="flex flex-wrap gap-2">
                  {enabledEngines.map((engine) => (
                    <button
                      key={engine.id}
                      onClick={() => setSelectedEngine(engine)}
                      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                        selectedEngine?.id === engine.id
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border hover:bg-accent"
                      }`}
                    >
                      <span>{engine.icon}</span>
                      {engine.name}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleEngineSearch}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <Globe className="size-4" />
                  使用 {selectedEngine?.name} 搜索
                </button>
              </div>
            )}

            {mode === "ai" && aiSearch && (
              <div className="p-3">
                {aiLoading ? (
                  <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    AI 正在思考...
                  </div>
                ) : aiResult ? (
                  <div className="prose prose-sm dark:prose-invert max-h-60 overflow-y-auto whitespace-pre-wrap p-2 text-sm">
                    {aiResult}
                  </div>
                ) : (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    点击搜索，让 AI 为你推荐
                  </div>
                )}
                {!aiLoading && (
                  <button
                    onClick={handleAiSearch}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    <Sparkles className="size-4" />
                    AI 智能搜索
                  </button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
