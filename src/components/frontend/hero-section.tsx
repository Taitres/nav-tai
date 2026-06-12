"use client"

import { motion } from "motion/react"
import { Search } from "lucide-react"

interface HeroSectionProps {
  title: string
  subtitle: string
}

export function HeroSection({ title, subtitle }: HeroSectionProps) {
  return (
    <div className="relative overflow-hidden pb-8 pt-16 md:pb-12 md:pt-24">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute right-1/4 top-1/4 h-[300px] w-[300px] rounded-full bg-chart-1/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="mx-auto max-w-3xl text-center"
      >
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
          {title}
        </h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-3 text-base text-muted-foreground sm:text-lg"
        >
          {subtitle}
        </motion.p>
      </motion.div>
    </div>
  )
}
