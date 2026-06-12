"use client"

import { motion } from "motion/react"

interface CategoryNavProps {
  categories: { id: string; name: string; slug: string; icon: string }[]
}

export function CategoryNav({ categories }: CategoryNavProps) {
  return (
    <motion.nav
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="no-scrollbar flex gap-2 overflow-x-auto pb-2"
    >
      {categories.map((cat) => (
        <a
          key={cat.id}
          href={`#${cat.slug}`}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border/50 bg-card px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:bg-accent/50 hover:text-foreground"
        >
          <span>{cat.icon}</span>
          {cat.name}
        </a>
      ))}
    </motion.nav>
  )
}
