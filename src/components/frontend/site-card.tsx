"use client"

import { useRef, useState } from "react"
import { motion } from "motion/react"
import { ExternalLink } from "lucide-react"
import { FaviconImg } from "@/components/shared/favicon-img"
import type { Site } from "@/lib/types"

interface SiteCardProps {
  site: Site
  index?: number
}

export function SiteCard({ site, index = 0 }: SiteCardProps) {
  const cardRef = useRef<HTMLAnchorElement>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)

  function handleMouseMove(e: React.MouseEvent<HTMLAnchorElement>) {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  return (
    <motion.a
      href={site.url}
      target="_blank"
      rel="noopener noreferrer"
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.05,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
      className="group relative flex flex-col gap-3 rounded-xl border border-border/50 bg-card p-4 transition-colors duration-200 hover:border-primary/30"
    >
      <div
        className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: isHovered
            ? `radial-gradient(300px circle at ${mousePos.x}px ${mousePos.y}px, color-mix(in oklch, var(--primary) 8%, transparent), transparent 60%)`
            : "none",
        }}
      />
      <div className="flex items-start gap-3">
        <FaviconImg
          url={site.url}
          name={site.name}
          className="size-8 shrink-0"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate font-medium text-sm">{site.name}</h3>
            <ExternalLink className="size-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
        </div>
      </div>
      {site.description && (
        <p className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">
          {site.description}
        </p>
      )}
      {site.tags.length > 0 && (
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
