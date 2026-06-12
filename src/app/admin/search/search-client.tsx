"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Sparkles,
  Globe,
  Check,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import type { Settings, SearchEngine, AiSearchConfig } from "@/lib/types"

interface SearchConfigManagerProps {
  initialSettings: Settings
}

export function SearchConfigManager({
  initialSettings,
}: SearchConfigManagerProps) {
  const [settings, setSettings] = useState(initialSettings)
  const [engineDialogOpen, setEngineDialogOpen] = useState(false)
  const [editingEngine, setEditingEngine] = useState<SearchEngine | null>(null)
  const [engineForm, setEngineForm] = useState({
    name: "",
    icon: "🔍",
    urlTemplate: "",
    enabled: true,
  })
  const [aiForm, setAiForm] = useState<AiSearchConfig | null>(
    settings.aiSearch || {
      provider: "openai",
      apiUrl: "",
      apiKey: "",
      model: "",
      promptTemplate: "",
    }
  )
  const [aiEnabled, setAiEnabled] = useState(!!settings.aiSearch)

  function openCreateEngine() {
    setEditingEngine(null)
    setEngineForm({ name: "", icon: "🔍", urlTemplate: "", enabled: true })
    setEngineDialogOpen(true)
  }

  function openEditEngine(engine: SearchEngine) {
    setEditingEngine(engine)
    setEngineForm({
      name: engine.name,
      icon: engine.icon,
      urlTemplate: engine.urlTemplate,
      enabled: engine.enabled,
    })
    setEngineDialogOpen(true)
  }

  async function handleSaveEngine() {
    if (!engineForm.name.trim() || !engineForm.urlTemplate.trim()) {
      toast.error("名称和 URL 模板不能为空")
      return
    }

    let newEngines: SearchEngine[]
    if (editingEngine) {
      newEngines = settings.searchEngines.map((e) =>
        e.id === editingEngine.id ? { ...e, ...engineForm } : e
      )
    } else {
      const newEngine: SearchEngine = {
        id: `se-${Date.now()}`,
        ...engineForm,
      }
      newEngines = [...settings.searchEngines, newEngine]
    }

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ searchEngines: newEngines }),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setSettings((s) => ({ ...s, searchEngines: updated.searchEngines }))
      toast.success(editingEngine ? "搜索引擎已更新" : "搜索引擎已添加")
      setEngineDialogOpen(false)
    } catch {
      toast.error("操作失败")
    }
  }

  async function handleDeleteEngine(id: string) {
    const newEngines = settings.searchEngines.filter((e) => e.id !== id)
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ searchEngines: newEngines }),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setSettings((s) => ({ ...s, searchEngines: updated.searchEngines }))
      toast.success("搜索引擎已删除")
    } catch {
      toast.error("删除失败")
    }
  }

  async function handleToggleEngine(id: string, enabled: boolean) {
    const newEngines = settings.searchEngines.map((e) =>
      e.id === id ? { ...e, enabled } : e
    )
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ searchEngines: newEngines }),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setSettings((s) => ({ ...s, searchEngines: updated.searchEngines }))
    } catch {
      toast.error("操作失败")
    }
  }

  async function handleSaveAi() {
    const newSettings = aiEnabled ? { aiSearch: aiForm } : { aiSearch: null }
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setSettings((s) => ({ ...s, aiSearch: updated.aiSearch }))
      toast.success("AI 搜索配置已保存")
    } catch {
      toast.error("保存失败")
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold">搜索配置</h1>
        <p className="text-sm text-muted-foreground">
          配置搜索引擎和 AI 搜索
        </p>
      </div>

      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="size-5 text-muted-foreground" />
            <h2 className="font-heading text-lg font-semibold">搜索引擎</h2>
          </div>
          <Button onClick={openCreateEngine} size="sm">
            <Plus className="size-3.5" />
            添加
          </Button>
        </div>

        <div className="flex flex-col gap-3">
          <AnimatePresence>
            {settings.searchEngines.map((engine) => (
              <motion.div
                key={engine.id}
                layout
                className="flex items-center gap-4 rounded-xl border bg-card p-4"
              >
                <span className="text-xl">{engine.icon}</span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium">{engine.name}</h3>
                  <p className="truncate text-xs text-muted-foreground">
                    {engine.urlTemplate}
                  </p>
                </div>
                <Switch
                  checked={engine.enabled}
                  onCheckedChange={(checked) =>
                    handleToggleEngine(engine.id, checked)
                  }
                />
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => openEditEngine(engine)}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleDeleteEngine(engine.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <Separator className="my-8" />

      <div>
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="size-5 text-muted-foreground" />
          <h2 className="font-heading text-lg font-semibold">AI 搜索</h2>
          <Switch
            checked={aiEnabled}
            onCheckedChange={(checked) => {
              setAiEnabled(checked)
              if (checked && !aiForm) {
                setAiForm({
                  provider: "openai",
                  apiUrl: "",
                  apiKey: "",
                  model: "",
                  promptTemplate: "",
                })
              }
            }}
          />
        </div>

        {aiEnabled && aiForm && (
          <div className="rounded-xl border bg-card p-5">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label>提供商</Label>
                <Select
                  value={aiForm.provider}
                  onValueChange={(v) =>
                    setAiForm((f) =>
                      f ? { ...f, provider: (v ?? "openai") as "openai" | "anthropic" | "custom" } : f
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI 兼容</SelectItem>
                    <SelectItem value="anthropic">Anthropic</SelectItem>
                    <SelectItem value="custom">自定义</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>API URL</Label>
                <Input
                  value={aiForm.apiUrl}
                  onChange={(e) =>
                    setAiForm((f) =>
                      f ? { ...f, apiUrl: e.target.value } : f
                    )
                  }
                  placeholder={
                    aiForm.provider === "anthropic"
                      ? "https://api.anthropic.com/v1/messages"
                      : "https://api.openai.com/v1/chat/completions"
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>API Key</Label>
                <Input
                  type="password"
                  value={aiForm.apiKey}
                  onChange={(e) =>
                    setAiForm((f) =>
                      f ? { ...f, apiKey: e.target.value } : f
                    )
                  }
                  placeholder="sk-..."
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>模型</Label>
                <Input
                  value={aiForm.model}
                  onChange={(e) =>
                    setAiForm((f) =>
                      f ? { ...f, model: e.target.value } : f
                    )
                  }
                  placeholder={
                    aiForm.provider === "anthropic"
                      ? "claude-3-sonnet-20240229"
                      : "gpt-3.5-turbo"
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>提示词模板 (可选)</Label>
                <Textarea
                  value={aiForm.promptTemplate}
                  onChange={(e) =>
                    setAiForm((f) =>
                      f ? { ...f, promptTemplate: e.target.value } : f
                    )
                  }
                  placeholder="使用 {query} 作为用户搜索关键词占位符"
                  rows={3}
                />
              </div>
              <Button onClick={handleSaveAi}>
                <Check className="size-4" />
                保存 AI 配置
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={engineDialogOpen} onOpenChange={setEngineDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingEngine ? "编辑搜索引擎" : "添加搜索引擎"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>图标 (Emoji)</Label>
              <Input
                value={engineForm.icon}
                onChange={(e) =>
                  setEngineForm((f) => ({ ...f, icon: e.target.value }))
                }
                placeholder="🔍"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>名称</Label>
              <Input
                value={engineForm.name}
                onChange={(e) =>
                  setEngineForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Google"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>URL 模板</Label>
              <Input
                value={engineForm.urlTemplate}
                onChange={(e) =>
                  setEngineForm((f) => ({
                    ...f,
                    urlTemplate: e.target.value,
                  }))
                }
                placeholder="https://www.google.com/search?q={query}"
              />
              <p className="text-xs text-muted-foreground">
                使用 {"{query}"} 作为搜索关键词占位符
              </p>
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>取消</DialogClose>
            <Button onClick={handleSaveEngine}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}