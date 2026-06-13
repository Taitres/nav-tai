"use client"

import { motion } from "motion/react"
import { useRef } from "react"

interface HeroSectionProps {
  title: string
  subtitle: string
}

export function HeroSection({ title, subtitle }: HeroSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <div ref={containerRef} className="relative overflow-hidden pb-4 pt-12 md:pb-6 md:pt-16">
      <div className="absolute inset-0 -z-10">
        <motion.div
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.5, 0.7, 0.5],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-1/2 top-0 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-primary/5 blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute right-1/4 top-1/4 h-[300px] w-[300px] rounded-full bg-chart-1/10 blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.08, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 4 }}
          className="absolute left-1/4 bottom-1/3 h-[250px] w-[250px] rounded-full bg-chart-2/8 blur-3xl"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="mx-auto max-w-3xl text-center"
      >
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="font-heading text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl bg-gradient-to-br from-foreground via-foreground/90 to-foreground/70 bg-clip-text"
        >
          {title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="mt-4 text-base text-muted-foreground sm:text-lg leading-relaxed"
        >
          {subtitle}
        </motion.p>
      </motion.div>
    </div>
  )
}
