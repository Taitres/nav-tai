"use client"

import { motion } from "motion/react"

interface HeroSectionProps {
  title: string
  subtitle: string
}

export function HeroSection({ title, subtitle }: HeroSectionProps) {
  return (
    <div className="relative overflow-hidden pb-4 pt-12 md:pb-6 md:pt-16">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute right-1/4 top-1/4 h-[300px] w-[300px] rounded-full bg-chart-1/10 blur-3xl" />
        <div className="absolute left-1/4 bottom-1/3 h-[250px] w-[250px] rounded-full bg-chart-2/8 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ type: "spring", duration: 0.35, bounce: 0 }}
        className="mx-auto max-w-3xl text-center"
      >
        <motion.h1
          initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ type: "spring", duration: 0.35, bounce: 0, delay: 0.05 }}
          className="font-heading text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl bg-gradient-to-br from-foreground via-foreground/90 to-foreground/70 bg-clip-text"
        >
          {title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ type: "spring", duration: 0.35, bounce: 0, delay: 0.12 }}
          className="mt-4 text-base text-muted-foreground sm:text-lg leading-relaxed"
        >
          {subtitle}
        </motion.p>
      </motion.div>
    </div>
  )
}
