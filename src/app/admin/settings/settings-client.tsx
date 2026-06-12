"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import type { Settings } from "@/lib/types"

interface SettingsManagerProps {
  initialSettings: Settings
}

export function SettingsManager({ initialSettings }: SettingsManagerProps) {
  const [form, setForm] = useState({
    siteName: initialSettings.siteName,
    siteDescription: initialSettings.siteDescription,
    heroTitle: initialSettings.heroTitle,
    heroSubtitle: initialSettings.heroSubtitle,
  })

  async function handleSave() {
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      toast.success("设置已保存")
    } catch {
      toast.error("保存失败")
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold">系统设置</h1>
        <p className="text-sm text-muted-foreground">站点基本信息和展示配置</p>
      </div>

      <div className="rounded-xl border bg-card p-5">
        <div className="flex flex-col gap-6">
          <div>
            <h2 className="mb-4 font-heading text-base font-semibold">
              站点信息
            </h2>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label>站点名称</Label>
                <Input
                  value={form.siteName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, siteName: e.target.value }))
                  }
                  placeholder="Nav-Tai"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>站点描述</Label>
                <Input
                  value={form.siteDescription}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      siteDescription: e.target.value,
                    }))
                  }
                  placeholder="现代化导航站"
                />
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h2 className="mb-4 font-heading text-base font-semibold">
              首页 Hero 区域
            </h2>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label>主标题</Label>
                <Input
                  value={form.heroTitle}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, heroTitle: e.target.value }))
                  }
                  placeholder="发现优质网站"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>副标题</Label>
                <Textarea
                  value={form.heroSubtitle}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      heroSubtitle: e.target.value,
                    }))
                  }
                  placeholder="精心整理的互联网资源导航"
                  rows={2}
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex justify-end">
            <Button onClick={handleSave}>
              <Check className="size-4" />
              保存设置
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-xl border bg-card p-5">
        <h2 className="mb-4 font-heading text-base font-semibold">
          环境变量配置
        </h2>
        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
          <p>
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
              ADMIN_PASSWORD
            </code>{" "}
            - 管理密码（默认: admin123）
          </p>
          <p>
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
              SESSION_SECRET
            </code>{" "}
            - Session 加密密钥
          </p>
          <p>
            修改环境变量后需重启服务生效
          </p>
        </div>
      </div>
    </div>
  )
}