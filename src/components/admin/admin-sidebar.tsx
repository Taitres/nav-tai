"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutGrid,
  FolderOpen,
  Globe,
  Search,
  Settings,
  LogOut,
  ArrowLeft,
  Menu,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/shared/theme-toggle"

const navItems = [
  { href: "/admin", label: "概览", icon: LayoutGrid },
  { href: "/admin/categories", label: "分类管理", icon: FolderOpen },
  { href: "/admin/sites", label: "网站管理", icon: Globe },
  { href: "/admin/search", label: "搜索配置", icon: Search },
  { href: "/admin/settings", label: "系统设置", icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" })
    window.location.href = "/login"
  }

  const sidebarContent = (
    <>
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-sm">
          <span className="inline-flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold">
            N
          </span>
          Nav-Tai
        </Link>
        <span className="text-xs text-muted-foreground">管理</span>
        <div className="ml-auto lg:hidden">
          <Button variant="ghost" size="icon-sm" onClick={() => setMobileOpen(false)}>
            <X className="size-4" />
          </Button>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        <div className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>

      <div className="border-t p-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between px-3 py-1">
            <span className="text-xs text-muted-foreground">主题</span>
            <ThemeToggle />
          </div>
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            返回前台
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="size-4" />
            退出登录
          </button>
        </div>
      </div>
    </>
  )

  return (
    <>
      <aside className="hidden lg:flex h-full w-56 flex-col border-r bg-card">
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative flex h-full w-56 flex-col border-r bg-card animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </aside>
        </div>
      )}

      <div className="lg:hidden fixed top-0 left-0 z-40 flex h-14 items-center border-b bg-card px-4 w-full">
        <Button variant="ghost" size="icon-sm" onClick={() => setMobileOpen(true)}>
          <Menu className="size-4" />
        </Button>
        <Link href="/" className="ml-3 flex items-center gap-2 font-bold text-sm">
          <span className="inline-flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold">
            N
          </span>
          Nav-Tai
        </Link>
        <span className="text-xs text-muted-foreground ml-1">管理</span>
      </div>
    </>
  )
}
