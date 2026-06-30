"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "motion/react"
import { Search, Command, ArrowRight, ChevronDown, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { FaviconImg } from "@/components/shared/favicon-img"
import type { Site, Category, SearchEngine } from "@/lib/types"

interface SearchBarProps {
  categories: Category[]
  sites: Site[]
  searchEngines: SearchEngine[]
  defaultEngineId: string | null
}

export function SearchBar({ categories, sites, searchEngines, defaultEngineId }: SearchBarProps) {
  const [query, setQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [showEnginePicker, setShowEnginePicker] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const enabledEngines = useMemo(() => searchEngines.filter((e) => e.enabled), [searchEngines])
  const defaultEngine = useMemo(() => {
    return enabledEngines.find((e) => e.id === defaultEngineId) || enabledEngines[0] || null
  }, [enabledEngines, defaultEngineId])
  const [selectedEngineId, setSelectedEngineId] = useState<string | null>(defaultEngine?.id ?? null)
  const selectedEngine = enabledEngines.find((e) => e.id === selectedEngineId) || defaultEngine

  useEffect(() => {
    setSelectedEngineId(defaultEngine?.id ?? null)
  }, [defaultEngine?.id])

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

  useEffect(() => {
    if (!isOpen) {
      setDropdownStyle(null)
      return
    }
    function updatePosition() {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      setDropdownStyle({
        position: "fixed",
        left: rect.left,
        top: rect.bottom + 6,
        width: rect.width,
        zIndex: 9999,
      })
    }
    updatePosition()
    window.addEventListener("resize", updatePosition)
    window.addEventListener("scroll", updatePosition, true)
    return () => {
      window.removeEventListener("resize", updatePosition)
      window.removeEventListener("scroll", updatePosition, true)
    }
  }, [isOpen])

  function handleEngineSearch() {
    if (!query.trim() || !selectedEngine) return
    const url = selectedEngine.urlTemplate.replace("{query}", encodeURIComponent(query))
    window.open(url, "_blank")
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleEngineSearch()
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-xl mx-auto">
      <motion.div
        animate={{
          boxShadow: isOpen
            ? "0 0 0 1px oklch(0.45 0.18 270 / 0.3), 0 4px 16px oklch(0.45 0.18 270 / 0.06)"
            : "0 0 0 1px oklch(0 0 0 / 0.06), 0 1px 2px oklch(0 0 0 / 0.04)",
        }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="relative rounded-xl border border-border/40 bg-card/60 backdrop-blur-lg"
      >
        <div className="flex items-center gap-2 px-3 py-2">
          {selectedEngine ? (
            <button
              onClick={() => setShowEnginePicker(!showEnginePicker)}
              className="flex items-center gap-1 shrink-0 text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              <span>{selectedEngine.icon}</span>
              <ChevronDown className="size-3 text-muted-foreground" />
            </button>
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
            placeholder={`使用 ${selectedEngine?.name || "搜索引擎"} 搜索...`}
            className="border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/50"
          />

          {query && (
            <button onClick={() => setQuery("")} className="shrink-0">
              <X className="size-3.5 text-muted-foreground hover:text-foreground transition-colors" />
            </button>
          )}

          <kbd className="pointer-events-none hidden h-5 items-center gap-0.5 rounded border bg-muted/60 px-1.5 text-[10px] font-medium text-muted-foreground/60 sm:flex">
            <Command className="size-2.5" />K
          </kbd>
        </div>
      </motion.div>

      {mounted && createPortal(
        <AnimatePresence>
          {isOpen && dropdownStyle && (
            <motion.div
              initial={{ opacity: 0, y: -4, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -2, filter: "blur(4px)" }}
              transition={{ type: "spring", duration: 0.25, bounce: 0 }}
              style={dropdownStyle}
              className="overflow-hidden rounded-xl border border-border/50 bg-popover/95 backdrop-blur-xl shadow-xl shadow-black/8"
            >
            {showEnginePicker && (
              <div className="border-b p-3">
                <div className="mb-2 text-xs font-medium text-muted-foreground">选择搜索引擎</div>
                <div className="flex flex-wrap gap-2">
                  {enabledEngines.map((engine) => (
                    <button
                      key={engine.id}
                      onClick={() => { setSelectedEngineId(engine.id); setShowEnginePicker(false) }}
                      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-all duration-200 ${
                        selectedEngine?.id === engine.id
                          ? "border-primary/40 bg-primary/10 text-primary shadow-sm"
                          : "border-border/70 bg-background/40 hover:bg-accent hover:border-primary/20"
                      }`}
                    >
                      <span>{engine.icon}</span>
                      {engine.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {query.trim() && selectedEngine && (
              <div className="border-b bg-muted/20 p-3">
                <button
                  onClick={handleEngineSearch}
                  className="flex w-full items-center justify-between rounded-xl border border-primary/25 bg-primary/8 px-3 py-2 text-left text-sm font-medium text-primary shadow-sm transition-all hover:bg-primary/12 active:scale-[0.99]"
                >
                  <span className="inline-flex items-center gap-2">
                    <span>{selectedEngine.icon}</span>
                    使用 {selectedEngine.name} 搜索 "{query}"
                  </span>
                  <ArrowRight className="size-3.5" />
                </button>
              </div>
            )}

            {query.trim() && localResults.length > 0 && (
              <div className="max-h-80 overflow-y-auto p-2">
                <div className="px-2 py-1 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">本地匹配</div>
                {localResults.map((result) => (
                  <a
                    key={result.site.id}
                    href={result.site.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-accent"
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

            {!showEnginePicker && query.trim() && localResults.length === 0 && (
              <div className="p-6 text-center">
                <p className="text-sm text-muted-foreground">按 Enter 使用 {selectedEngine?.name} 搜索</p>
              </div>
            )}
          </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  )
}
