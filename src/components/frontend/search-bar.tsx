"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Search, Command, Globe, Sparkles, ArrowRight, Plus, ChevronDown, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { FaviconImg } from "@/components/shared/favicon-img"
import ReactMarkdown from "react-markdown"
import type { Site, Category, SearchEngine, AiSearchConfig } from "@/lib/types"

interface SearchBarProps {
  categories: Category[]
  sites: Site[]
  searchEngines: SearchEngine[]
  aiSearch: AiSearchConfig | null
  defaultEngineId: string | null
  editMode?: boolean
  onAddSite?: (site: Site) => void
}

type SearchMode = "engine" | "ai"

interface AiSiteRecommendation {
  name: string
  url: string
  description: string
}

export function SearchBar({ categories, sites, searchEngines, aiSearch, defaultEngineId, editMode, onAddSite }: SearchBarProps) {
  const [query, setQuery] = useState("")
  const [mode, setMode] = useState<SearchMode>("engine")
  const [isOpen, setIsOpen] = useState(false)
  const [aiResult, setAiResult] = useState<string>("")
  const [aiLoading, setAiLoading] = useState(false)
  const [aiMode, setAiMode] = useState<"chat" | "site">("chat")
  const [showEnginePicker, setShowEnginePicker] = useState(false)
  const [aiSiteCards, setAiSiteCards] = useState<AiSiteRecommendation[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const enabledEngines = useMemo(() => searchEngines.filter((e) => e.enabled), [searchEngines])
  const defaultEngine = useMemo(() => {
    return enabledEngines.find((e) => e.id === defaultEngineId) || enabledEngines[0] || null
  }, [enabledEngines, defaultEngineId])
  const [selectedEngine, setSelectedEngine] = useState<SearchEngine | null>(null)
  const [prevDefault, setPrevDefault] = useState(defaultEngine)

  if (defaultEngine !== prevDefault) {
    setPrevDefault(defaultEngine)
    setSelectedEngine(defaultEngine)
  }

  const localResults = useMemo(() => {
    if (!query.trim()) return []
    const lower = query.toLowerCase()
    return sites
      .filter(
        (s) =>
          s.name.toLowerCase().includes(lower) ||
          s.description.toLowerCase().includes(lower) ||
          s.tags.some((t) => t.toLowerCase().includes(lower))
      )
      .slice(0, 6)
      .map((site) => ({
        type: "site" as const,
        site,
        category: categories.find((c) => c.id === site.categoryId),
      }))
  }, [query, sites, categories])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        inputRef.current?.focus()
        setIsOpen(true)
      }
      if (e.key === "Escape") {
        setIsOpen(false)
        setShowEnginePicker(false)
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
        setShowEnginePicker(false)
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

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      if (mode === "engine") {
        handleEngineSearch()
      } else if (mode === "ai" && aiSearch && !aiLoading) {
        handleAiSearch()
      }
    }
  }

  async function handleAiSearch() {
    if (!query.trim() || !aiSearch) return
    setAiLoading(true)
    setAiResult("")
    setAiSiteCards([])

    try {
      const res = await fetch("/api/ai-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, mode: aiMode }),
      })

      const contentType = res.headers.get("content-type") || ""
      if (contentType.includes("text/event-stream")) {
        const reader = res.body?.getReader()
        if (!reader) throw new Error("No reader")
        const decoder = new TextDecoder()
        let fullText = ""
        let currentMode = aiMode

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split("\n")

          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed.startsWith("data: ")) continue
            const data = trimmed.slice(6)
            if (data === "[DONE]") break
            try {
              const parsed = JSON.parse(data)
              if (parsed.content) {
                fullText += parsed.content
                setAiResult(fullText)
                if (parsed.mode) currentMode = parsed.mode as "chat" | "site"
              }
            } catch { /* skip */ }
          }
        }

        if (currentMode === "site") {
          try {
            const jsonMatch = fullText.match(/\[[\s\S]*\]/)
            if (jsonMatch) {
              const cards = JSON.parse(jsonMatch[0]) as AiSiteRecommendation[]
              setAiSiteCards(cards)
            }
          } catch { /* not valid json */ }
        }
      } else {
        const data = await res.json()
        if (data.error) setAiResult(data.error)
      }
    } catch {
      setAiResult("搜索失败，请检查网络连接")
    } finally {
      setAiLoading(false)
    }
  }

  async function handleAddAiSite(rec: AiSiteRecommendation) {
    if (!onAddSite) return
    try {
      const res = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: categories[0]?.id || "",
          name: rec.name,
          url: rec.url,
          description: rec.description,
          icon: "",
          order: sites.length,
          tags: [],
        }),
      })
      if (res.ok) {
        const saved = await res.json()
        onAddSite(saved)
      }
    } catch { /* ignore */ }
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl mx-auto">
      <motion.div
        animate={{
          boxShadow: isOpen
            ? "0 0 0 2px oklch(0.45 0.18 270 / 0.25), 0 8px 30px oklch(0.45 0.18 270 / 0.08)"
            : "0 0 0 1px oklch(0 0 0 / 0.08), 0 2px 8px oklch(0 0 0 / 0.03)",
        }}
        transition={{ duration: 0.2 }}
        className="relative rounded-2xl bg-card overflow-hidden"
      >
        <div className="flex items-center gap-2 px-4 py-3">
          {mode === "engine" && selectedEngine ? (
            <button
              onClick={() => setShowEnginePicker(!showEnginePicker)}
              className="flex items-center gap-1 shrink-0 text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              <span>{selectedEngine.icon}</span>
              <ChevronDown className="size-3 text-muted-foreground" />
            </button>
          ) : mode === "ai" ? (
            <Sparkles className="size-5 shrink-0 text-primary" />
          ) : (
            <Search className="size-5 shrink-0 text-muted-foreground" />
          )}

          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setIsOpen(true)
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={mode === "engine" ? `使用 ${selectedEngine?.name || "搜索引擎"} 搜索...` : mode === "ai" ? "问问 AI..." : "搜索网站、工具或资源..."}
            className="border-0 bg-transparent p-0 text-base shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/60"
          />

          {query && (
            <button onClick={() => { setQuery(""); setAiResult(""); setAiSiteCards([]) }} className="shrink-0">
              <X className="size-4 text-muted-foreground hover:text-foreground transition-colors" />
            </button>
          )}

          <div className="flex items-center gap-1.5 shrink-0">
            <kbd className="pointer-events-none hidden h-5 items-center gap-1 rounded border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground sm:flex">
              <Command className="size-2.5" />K
            </kbd>
          </div>
        </div>

        <div className="flex items-center gap-1 border-t px-3 py-1.5">
          {enabledEngines.length > 0 && (
            <button
              onClick={() => { setMode("engine"); setShowEnginePicker(false) }}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all duration-200 ${
                mode === "engine"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Globe className="size-3" />
              搜索
            </button>
          )}
          {aiSearch && (
            <button
              onClick={() => { setMode("ai"); setShowEnginePicker(false) }}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all duration-200 ${
                mode === "ai"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Sparkles className="size-3" />
              AI
            </button>
          )}

          {mode === "ai" && (
            <div className="ml-auto flex items-center gap-1">
              <button
                onClick={() => { setAiMode("chat"); setAiResult(""); setAiSiteCards([]) }}
                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${
                  aiMode === "chat" ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                对话
              </button>
              <button
                onClick={() => { setAiMode("site"); setAiResult(""); setAiSiteCards([]) }}
                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${
                  aiMode === "site" ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                找网站
              </button>
            </div>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-xl border bg-popover/95 backdrop-blur-xl shadow-xl shadow-black/10"
          >
            {mode === "engine" && showEnginePicker && (
              <div className="border-b p-3">
                <div className="mb-2 text-xs font-medium text-muted-foreground">选择搜索引擎</div>
                <div className="flex flex-wrap gap-2">
                  {enabledEngines.map((engine) => (
                    <button
                      key={engine.id}
                      onClick={() => { setSelectedEngine(engine); setShowEnginePicker(false) }}
                      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-all duration-200 ${
        selectedEngine?.id === engine.id
                          ? "border-primary bg-primary/5 text-primary shadow-sm"
                          : "border-border hover:bg-accent hover:border-primary/20"
                      }`}
                    >
                      <span>{engine.icon}</span>
                      {engine.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {mode === "engine" && query.trim() && localResults.length > 0 && (
              <div className="max-h-80 overflow-y-auto p-2">
                <div className="px-2 py-1 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">本地匹配</div>
                {localResults.map((result) => (
                  <a
                    key={result.site.id}
                    href={result.site.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-accent"
                  >
                    <FaviconImg url={result.site.url} name={result.site.name} className="size-7 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">{result.site.name}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {result.category?.name} · {result.site.description}
                      </div>
                    </div>
                    <ArrowRight className="size-3 text-muted-foreground" />
                  </a>
                ))}
              </div>
            )}

            {mode === "ai" && aiSearch && (
              <div className="p-3">
                {aiLoading ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-10">
                    <div className="relative">
                      <div className="size-10 rounded-full border-2 border-primary/20" />
                      <div className="absolute inset-0 size-10 rounded-full border-2 border-transparent border-t-primary animate-spin" />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>AI 正在思考</span>
                      <span className="animate-pulse">...</span>
                    </div>
                  </div>
                ) : aiSiteCards.length > 0 ? (
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground">AI 推荐网站</div>
                    {aiSiteCards.map((rec, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-3 rounded-lg border border-border/50 bg-card/50 p-3 transition-all hover:border-primary/20 hover:bg-accent/30"
                      >
                        <FaviconImg url={rec.url} name={rec.name} className="size-8 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium">{rec.name}</div>
                          <div className="truncate text-xs text-muted-foreground">{rec.description}</div>
                          <a href={rec.url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-primary hover:underline truncate block">
                            {rec.url}
                          </a>
                        </div>
                        {editMode && onAddSite && (
                          <Button size="sm" variant="outline" className="shrink-0 gap-1" onClick={() => handleAddAiSite(rec)}>
                            <Plus className="size-3" />
                            添加
                          </Button>
                        )}
                      </motion.div>
                    ))}
                    {aiResult && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">查看原始回复</summary>
                        <div className="mt-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground whitespace-pre-wrap">{aiResult}</div>
                      </details>
                    )}
                  </div>
                ) : aiResult ? (
                  <div className="max-h-80 overflow-y-auto">
                    <div className="prose prose-sm dark:prose-invert p-2 text-sm leading-relaxed">
                      <ReactMarkdown>{aiResult}</ReactMarkdown>
                    </div>
                  </div>
                ) : (
                  <div className="py-10 text-center">
                    <Sparkles className="mx-auto size-8 text-primary/40 mb-3" />
                    <p className="text-sm text-muted-foreground">
                      {aiMode === "chat" ? "输入问题，AI 为你解答" : "输入关键词，AI 为你推荐网站"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground/60">按 Enter 发送</p>
                  </div>
                )}
                {!aiLoading && query.trim() && !aiResult && !aiSiteCards.length && (
                  <Button
                    onClick={handleAiSearch}
                    className="mt-2 w-full gap-2"
                    size="sm"
                  >
                    <Sparkles className="size-3.5" />
                    {aiMode === "chat" ? "AI 解答" : "AI 推荐网站"}
                  </Button>
                )}
              </div>
            )}

            {mode === "engine" && !showEnginePicker && query.trim() && localResults.length === 0 && (
              <div className="p-6 text-center">
                <p className="text-sm text-muted-foreground">按 Enter 使用 {selectedEngine?.name} 搜索</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
