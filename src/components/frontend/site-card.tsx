"use client"

import { useRef, useState } from "react"
import { motion } from "motion/react"
import { ExternalLink, Pencil, Trash2, Check, X as XIcon } from "lucide-react"
import { FaviconImg } from "@/components/shared/favicon-img"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { Site } from "@/lib/types"

type CardSize = "sm" | "md" | "lg"

interface SiteCardProps {
  site: Site
  index?: number
  editMode?: boolean
  onDelete?: () => void
  onUpdate?: (updates: Partial<Site>) => void
  cardSize?: CardSize
}

const sizeConfig: Record<CardSize, { padding: string; iconSize: string; titleSize: string; descClass: string; showTags: boolean; showDesc: boolean }> = {
  sm: { padding: "p-2.5", iconSize: "size-6", titleSize: "text-xs", descClass: "line-clamp-1", showTags: false, showDesc: true },
  md: { padding: "p-4", iconSize: "size-8", titleSize: "text-sm", descClass: "line-clamp-2", showTags: true, showDesc: true },
  lg: { padding: "p-5", iconSize: "size-10", titleSize: "text-base", descClass: "line-clamp-3", showTags: true, showDesc: true },
}

export function SiteCard({ site, index = 0, editMode, onDelete, onUpdate, cardSize = "md" }: SiteCardProps) {
  const cardRef = useRef<HTMLAnchorElement>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    name: site.name,
    url: site.url,
    description: site.description,
    tags: site.tags.join(", "),
  })

  const cfg = sizeConfig[cardSize]

  function handleMouseMove(e: React.MouseEvent<HTMLAnchorElement>) {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  async function handleSaveEdit() {
    const updates: Partial<Site> = {
      name: editData.name,
      url: editData.url,
      description: editData.description,
      tags: editData.tags.split(",").map((t) => t.trim()).filter(Boolean),
    }
    onUpdate?.(updates)
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        transition={{ type: "spring", duration: 0.25, bounce: 0 }}
        className="relative flex flex-col gap-3 rounded-xl border-2 border-primary/30 bg-card p-4 shadow-lg shadow-primary/5"
      >
        <div className="flex flex-col gap-2.5">
          <Input value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} className="h-7 text-sm font-medium" placeholder="网站名称" />
          <Input value={editData.url} onChange={(e) => setEditData({ ...editData, url: e.target.value })} className="h-7 text-xs" placeholder="https://..." />
          <Input value={editData.description} onChange={(e) => setEditData({ ...editData, description: e.target.value })} className="h-7 text-xs" placeholder="描述" />
          <Input value={editData.tags} onChange={(e) => setEditData({ ...editData, tags: e.target.value })} className="h-7 text-xs" placeholder="标签（逗号分隔）" />
        </div>
        <div className="flex items-center gap-2 justify-end">
          <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
            <XIcon className="size-3.5" />
          </Button>
          <Button size="sm" onClick={handleSaveEdit}>
            <Check className="size-3.5" />
          </Button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.a
      href={editMode ? undefined : site.url}
      target={editMode ? undefined : "_blank"}
      rel="noopener noreferrer"
      onClick={editMode ? (e) => e.preventDefault() : undefined}
      ref={cardRef}
      layout
      initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -6, filter: "blur(4px)", transition: { duration: 0.15 } }}
      transition={{
        duration: 0.25,
        delay: index * 0.03,
        type: "spring",
        bounce: 0,
      }}
      whileHover={editMode ? { scale: 1.02, transition: { type: "spring", stiffness: 400, damping: 25 } } : { y: -3, transition: { type: "spring", stiffness: 400, damping: 25 } }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
      className={`group relative flex flex-col gap-2 rounded-xl border bg-card ${cfg.padding} transition-all duration-200 ${
        editMode ? "border-primary/20 cursor-default" : "border-border/50 hover:border-primary/30 cursor-pointer"
      }`}
    >
      <div
        className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: isHovered
            ? `radial-gradient(300px circle at ${mousePos.x}px ${mousePos.y}px, oklch(0.45 0.18 270 / 0.06), transparent 60%)`
            : "none",
        }}
      />

      {editMode && (
        <div className="absolute -top-2 -right-2 z-10 flex items-center gap-0.5">
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.93 }}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsEditing(true) }}
            className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md"
          >
            <Pencil className="size-3" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.93 }}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete?.() }}
            className="flex size-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-md"
          >
            <Trash2 className="size-3" />
          </motion.button>
        </div>
      )}

      <div className="flex items-start gap-3">
        <FaviconImg
          url={site.url}
          name={site.name}
          className={`${cfg.iconSize} shrink-0`}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className={`truncate font-medium ${cfg.titleSize}`}>{site.name}</h3>
            {!editMode && <ExternalLink className="size-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />}
          </div>
        </div>
      </div>
      {cfg.showDesc && site.description && (
        <p className={`${cfg.descClass} text-xs text-muted-foreground leading-relaxed`}>
          {site.description}
        </p>
      )}
      {cfg.showTags && site.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {site.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </motion.a>
  )
}
