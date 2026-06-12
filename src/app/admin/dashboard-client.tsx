"use client"

import { FolderOpen, Globe, Search, Settings } from "lucide-react"
import { motion } from "motion/react"
import type { NavData } from "@/lib/types"

interface AdminDashboardProps {
  data: NavData
}

export function AdminDashboard({ data }: AdminDashboardProps) {
  const stats = [
    {
      label: "分类数量",
      value: data.categories.length,
      icon: FolderOpen,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "网站数量",
      value: data.sites.length,
      icon: Globe,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      label: "搜索引擎",
      value: data.settings.searchEngines.filter((e) => e.enabled).length,
      icon: Search,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      label: "AI 搜索",
      value: data.settings.aiSearch ? "已配置" : "未配置",
      icon: Settings,
      color: data.settings.aiSearch ? "text-emerald-500" : "text-muted-foreground",
      bg: data.settings.aiSearch ? "bg-emerald-500/10" : "bg-muted",
    },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold">概览</h1>
        <p className="text-sm text-muted-foreground">Nav-Tai 管理后台</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className="rounded-xl border bg-card p-4"
          >
            <div className="flex items-center gap-3">
              <div className={`flex size-10 items-center justify-center rounded-lg ${stat.bg}`}>
                <stat.icon className={`size-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="mb-4 font-heading text-lg font-semibold">快速操作</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <a
            href="/admin/categories"
            className="group flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-accent/50"
          >
            <div className="flex size-10 items-center justify-center rounded-lg bg-blue-500/10">
              <FolderOpen className="size-5 text-blue-500" />
            </div>
            <div>
              <p className="font-medium text-sm">管理分类</p>
              <p className="text-xs text-muted-foreground">添加、编辑、排序分类</p>
            </div>
          </a>
          <a
            href="/admin/sites"
            className="group flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-accent/50"
          >
            <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <Globe className="size-5 text-emerald-500" />
            </div>
            <div>
              <p className="font-medium text-sm">管理网站</p>
              <p className="text-xs text-muted-foreground">添加、编辑、排序网站</p>
            </div>
          </a>
          <a
            href="/admin/settings"
            className="group flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-accent/50"
          >
            <div className="flex size-10 items-center justify-center rounded-lg bg-amber-500/10">
              <Settings className="size-5 text-amber-500" />
            </div>
            <div>
              <p className="font-medium text-sm">系统设置</p>
              <p className="text-xs text-muted-foreground">站点信息和搜索配置</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  )
}
