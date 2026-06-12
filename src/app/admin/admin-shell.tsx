"use client"

import { AdminSidebar } from "@/components/admin/admin-sidebar"

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto lg:pt-0 pt-14">
        <div className="mx-auto max-w-5xl p-6">{children}</div>
      </main>
    </div>
  )
}