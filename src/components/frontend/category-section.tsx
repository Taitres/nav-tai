"use client"

import { motion } from "motion/react"
import { SiteCard } from "./site-card"
import type { Category, Site } from "@/lib/types"

interface CategorySectionProps {
  category: Category
  sites: Site[]
  categoryIndex?: number
}

export function CategorySection({ category, sites, categoryIndex = 0 }: CategorySectionProps) {
  if (sites.length === 0) return null

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{
        duration: 0.5,
        delay: categoryIndex * 0.1,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className="scroll-mt-20"
      id={category.slug}
    >
      <div className="mb-4 flex items-center gap-3">
        <span className="text-2xl">{category.icon}</span>
        <div>
          <h2 className="font-heading text-lg font-semibold">{category.name}</h2>
          {category.description && (
            <p className="text-sm text-muted-foreground">{category.description}</p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {sites.map((site, i) => (
          <SiteCard key={site.id} site={site} index={i} />
        ))}
      </div>
    </motion.section>
  )
}
