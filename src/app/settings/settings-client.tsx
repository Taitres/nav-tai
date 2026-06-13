"use client"

import { useState, useEffect } from "react"
import { motion } from "motion/react"
import { Mail, Key, Globe, Sparkles, Save, Loader2, Copy, Share2, ArrowLeft, Eye, EyeOff, Plus, Download, Check, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import Link from "next/link"
import type { User, UserSettings, SearchEngine, AiSearchConfig, SharedCollection } from "@/lib/types"

interface SettingsClientProps {
  user: User
}

export function SettingsClient({ user: initialUser }: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "search" | "ai" | "share">("profile")
  const [user, setUser] = useState(initialUser)
  const [name, setName] = useState(initialUser.name)
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [saving, setSaving] = useState(false)

  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [engines, setEngines] = useState<SearchEngine[]>([])
  const [aiConfig, setAiConfig] = useState<AiSearchConfig | null>(null)
  const [loaded, setLoaded] = useState(false)

  const [newEngine, setNewEngine] = useState({ name: "", icon: "🔍", urlTemplate: "" })

  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)

  const [importCode, setImportCode] = useState("")
  const [importPreview, setImportPreview] = useState<SharedCollection | null>(null)
  const [importSelectedCats, setImportSelectedCats] = useState<Set<string>>(new Set())
  const [importLoading, setImportLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [imported, setImported] = useState(false)

  useEffect(() => {
    async function load() {
      const [settingsRes, enginesRes, aiRes] = await Promise.all([
        fetch("/api/settings"),
        fetch("/api/search-engines"),
        fetch("/api/ai-config"),
      ])
      if (settingsRes.ok) setSettings(await settingsRes.json())
      if (enginesRes.ok) setEngines(await enginesRes.json())
      if (aiRes.ok) {
        const data = await aiRes.json()
        if (data) setAiConfig(data)
      }
      setLoaded(true)
    }
    load()
  }, [])

  async function handleSaveProfile() {
    setSaving(true)
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
        toast.success("个人资料已更新")
      }
    } catch {
      toast.error("更新失败")
    }
    setSaving(false)
  }

  async function handleChangePassword() {
    if (newPassword.length < 6) {
      toast.error("新密码至少6个字符")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/auth/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword, newPassword }),
      })
      if (res.ok) {
        setOldPassword("")
        setNewPassword("")
        toast.success("密码已更新")
      } else {
        const data = await res.json()
        toast.error(data.error || "密码更新失败")
      }
    } catch {
      toast.error("更新失败")
    }
    setSaving(false)
  }

  async function handleSaveSettings() {
    if (!settings) return
    setSaving(true)
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })
      if (res.ok) {
        toast.success("设置已保存")
      }
    } catch {
      toast.error("保存失败")
    }
    setSaving(false)
  }

  async function handleAddEngine() {
    if (!newEngine.name || !newEngine.urlTemplate) {
      toast.error("请填写名称和链接模板")
      return
    }
    try {
      const res = await fetch("/api/search-engines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newEngine, enabled: true, isDefault: engines.length === 0, order: engines.length }),
      })
      if (res.ok) {
        const saved = await res.json()
        setEngines([...engines, saved])
        setNewEngine({ name: "", icon: "🔍", urlTemplate: "" })
        toast.success("搜索引擎已添加")
      }
    } catch {
      toast.error("添加失败")
    }
  }

  async function handleToggleEngine(id: string, enabled: boolean) {
    try {
      const res = await fetch("/api/search-engines", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, enabled }),
      })
      if (res.ok) {
        setEngines(engines.map((e) => e.id === id ? { ...e, enabled } : e))
      }
    } catch { /* ignore */ }
  }

  async function handleSetDefaultEngine(id: string) {
    try {
      await fetch("/api/search-engines", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isDefault: true }),
      })
      setEngines(engines.map((e) => ({ ...e, isDefault: e.id === id })))
      if (settings) {
        setSettings({ ...settings, defaultEngineId: id })
      }
      toast.success("默认搜索引擎已更新")
    } catch {
      toast.error("设置失败")
    }
  }

  async function handleDeleteEngine(id: string) {
    try {
      const res = await fetch("/api/search-engines", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      if (res.ok) {
        setEngines(engines.filter((e) => e.id !== id))
        toast.success("搜索引擎已删除")
      }
    } catch {
      toast.error("删除失败")
    }
  }

  async function handleSaveAiConfig() {
    setSaving(true)
    setTestResult(null)
    try {
      const res = await fetch("/api/ai-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aiConfig),
      })
      if (res.ok) {
        toast.success("AI 配置已保存")
      } else {
        const data = await res.json()
        toast.error(data.error || "保存失败")
      }
    } catch {
      toast.error("保存失败")
    }
    setSaving(false)
  }

  async function handleCopyShareCode() {
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: `${user.name}的收藏` }),
      })
      const data = await res.json()
      if (data.shareCode) {
        await navigator.clipboard.writeText(`${window.location.origin}?share=${data.shareCode}`)
        toast.success("分享链接已复制")
      }
    } catch {
      toast.error("分享失败")
    }
  }

  async function handleTestAiConnection() {
    if (!aiConfig) return
    if (!aiConfig.apiKey || !aiConfig.apiUrl) {
      setTestResult({ ok: false, message: "请先填写 API URL 和 API Key" })
      return
    }
    setTesting(true)
    setTestResult(null)
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 15000)
      const res = await fetch("/api/ai-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: "hi", mode: "chat" }),
        signal: controller.signal,
      })
      clearTimeout(timeout)
      if (res.ok) {
        setTestResult({ ok: true, message: `连接成功，模型: ${aiConfig.model || (aiConfig.provider === "anthropic" ? "claude-3-5-sonnet" : "gpt-4o-mini")}` })
      } else {
        const data = await res.json().catch(() => ({ error: "请求失败" }))
        setTestResult({ ok: false, message: data.error || `请求失败 (${res.status})` })
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setTestResult({ ok: false, message: "连接超时（15秒），请检查 API 地址" })
      } else {
        setTestResult({ ok: false, message: "网络连接失败" })
      }
    }
    setTesting(false)
  }

  async function handlePreviewImport() {
    if (!importCode.trim()) {
      toast.error("请输入分享码")
      return
    }
    setImportLoading(true)
    setImportPreview(null)
    setImported(false)
    try {
      const res = await fetch(`/api/share?code=${encodeURIComponent(importCode.trim())}`)
      if (res.ok) {
        const data = await res.json()
        setImportPreview(data)
        setImportSelectedCats(new Set(data.data.categories.map((c: { id: string }) => c.id)))
      } else {
        toast.error("分享码无效或不存在")
      }
    } catch {
      toast.error("查询失败")
    }
    setImportLoading(false)
  }

  async function handleDoImport() {
    if (!importPreview) return
    setImporting(true)
    try {
      const res = await fetch("/api/share/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shareCode: importPreview.shareCode,
          selectedCategoryIds: Array.from(importSelectedCats),
        }),
      })
      if (res.ok) {
        setImported(true)
        toast.success("导入成功！")
      } else {
        toast.error("导入失败")
      }
    } catch {
      toast.error("导入失败")
    }
    setImporting(false)
  }

  function toggleImportCategory(id: string) {
    setImportSelectedCats((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const tabs = [
    { id: "profile" as const, label: "个人资料", icon: Mail },
    { id: "search" as const, label: "搜索引擎", icon: Globe },
    { id: "ai" as const, label: "AI 搜索", icon: Sparkles },
    { id: "share" as const, label: "导入/导出", icon: Share2 },
  ]

  if (!loaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-4xl items-center gap-4 px-4">
          <Link href="/">
            <Button variant="ghost" size="icon-sm">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <h1 className="font-heading text-lg font-semibold">设置</h1>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-6">
        <div className="flex gap-6">
          <nav className="hidden md:flex flex-col gap-1 w-48 shrink-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <tab.icon className="size-4" />
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="md:hidden flex gap-1 overflow-x-auto no-scrollbar mb-4 w-full">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <tab.icon className="size-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 min-w-0">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "profile" && (
                <div className="space-y-6">
                  <div className="rounded-xl border bg-card p-6 space-y-4">
                    <h3 className="font-heading text-base font-semibold">基本信息</h3>
                    <div className="flex flex-col gap-2">
                      <Label>昵称</Label>
                      <Input value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label>邮箱</Label>
                      <Input value={user.email} disabled className="opacity-60" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label>角色</Label>
                      <Input value={user.role === "admin" ? "管理员" : "用户"} disabled className="opacity-60" />
                    </div>
                    <Button onClick={handleSaveProfile} disabled={saving} className="gap-2">
                      {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                      保存
                    </Button>
                  </div>

                  <div className="rounded-xl border bg-card p-6 space-y-4">
                    <h3 className="font-heading text-base font-semibold">修改密码</h3>
                    <div className="flex flex-col gap-2">
                      <Label>当前密码</Label>
                      <div className="relative">
                        <Input type={showOldPassword ? "text" : "password"} value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
                        <button onClick={() => setShowOldPassword(!showOldPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          {showOldPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label>新密码</Label>
                      <div className="relative">
                        <Input type={showNewPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                        <button onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                    </div>
                    <Button onClick={handleChangePassword} disabled={saving || !oldPassword || !newPassword} className="gap-2">
                      {saving ? <Loader2 className="size-4 animate-spin" /> : <Key className="size-4" />}
                      修改密码
                    </Button>
                  </div>

                  {settings && (
                    <div className="rounded-xl border bg-card p-6 space-y-4">
                      <h3 className="font-heading text-base font-semibold">首页设置</h3>
                      <div className="flex flex-col gap-2">
                        <Label>站点名称</Label>
                        <Input value={settings.siteName} onChange={(e) => setSettings({ ...settings, siteName: e.target.value })} />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label>站点描述</Label>
                        <Textarea value={settings.siteDescription} onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })} />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label>标题</Label>
                        <Input value={settings.heroTitle} onChange={(e) => setSettings({ ...settings, heroTitle: e.target.value })} />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label>副标题</Label>
                        <Input value={settings.heroSubtitle} onChange={(e) => setSettings({ ...settings, heroSubtitle: e.target.value })} />
                      </div>
                      <Button onClick={handleSaveSettings} disabled={saving} className="gap-2">
                        <Save className="size-4" />
                        保存设置
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "search" && (
                <div className="space-y-4">
                  <div className="rounded-xl border bg-card p-6 space-y-4">
                    <h3 className="font-heading text-base font-semibold">添加搜索引擎</h3>
                    <div className="grid grid-cols-[60px_1fr_1fr] gap-2 items-end">
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs">图标</Label>
                        <Input value={newEngine.icon} onChange={(e) => setNewEngine({ ...newEngine, icon: e.target.value })} className="text-center text-lg p-1" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs">名称</Label>
                        <Input value={newEngine.name} onChange={(e) => setNewEngine({ ...newEngine, name: e.target.value })} placeholder="Google" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs">链接模板</Label>
                        <Input value={newEngine.urlTemplate} onChange={(e) => setNewEngine({ ...newEngine, urlTemplate: e.target.value })} placeholder="https://google.com/search?q={query}" />
                      </div>
                    </div>
                    <Button onClick={handleAddEngine} size="sm" className="gap-1.5">
                      <Plus className="size-3.5" />
                      添加
                    </Button>
                  </div>

                  {engines.map((engine) => (
                    <motion.div
                      key={engine.id}
                      layout
                      className="flex items-center gap-3 rounded-xl border bg-card p-4"
                    >
                      <span className="text-xl">{engine.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{engine.name}</span>
                          {engine.isDefault && (
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">默认</span>
                          )}
                        </div>
                        <p className="truncate text-xs text-muted-foreground">{engine.urlTemplate}</p>
                      </div>
                      <Switch checked={engine.enabled} onCheckedChange={(checked) => handleToggleEngine(engine.id, checked)} />
                      {!engine.isDefault && engine.enabled && (
                        <Button size="sm" variant="outline" onClick={() => handleSetDefaultEngine(engine.id)}>设为默认</Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteEngine(engine.id)} className="text-destructive hover:text-destructive">
                        删除
                      </Button>
                    </motion.div>
                  ))}
                </div>
              )}

              {activeTab === "ai" && (
                <div className="rounded-xl border bg-card p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-heading text-base font-semibold">AI 搜索配置</h3>
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">启用</Label>
                      <Switch
                        checked={aiConfig !== null}
                        onCheckedChange={(checked) => {
                          if (checked && !aiConfig) {
                            setAiConfig({ provider: "openai", apiUrl: "", apiKey: "", model: "", promptTemplate: "" })
                          } else if (!checked) {
                            setAiConfig(null)
                          }
                        }}
                      />
                    </div>
                  </div>

                  {aiConfig && (
                    <>
                      <div className="flex flex-col gap-2">
                        <Label>服务提供商</Label>
                        <Select value={aiConfig.provider} onValueChange={(v) => v && setAiConfig({ ...aiConfig, provider: v as AiSearchConfig["provider"] })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="openai">OpenAI</SelectItem>
                            <SelectItem value="anthropic">Anthropic</SelectItem>
                            <SelectItem value="custom">自定义</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label>API URL</Label>
                        <Input
                          value={aiConfig.apiUrl}
                          onChange={(e) => setAiConfig({ ...aiConfig, apiUrl: e.target.value })}
                          placeholder={aiConfig.provider === "anthropic" ? "https://api.anthropic.com/v1/messages" : "https://api.openai.com/v1/chat/completions"}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label>API Key</Label>
                        <Input type="password" value={aiConfig.apiKey} onChange={(e) => setAiConfig({ ...aiConfig, apiKey: e.target.value })} placeholder="sk-..." />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label>模型</Label>
                        <Input
                          value={aiConfig.model}
                          onChange={(e) => setAiConfig({ ...aiConfig, model: e.target.value })}
                          placeholder={aiConfig.provider === "anthropic" ? "claude-3-5-sonnet-20241022" : "gpt-4o-mini"}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label>提示词模板（可选，用 {"{query}"} 替代搜索词）</Label>
                        <Textarea value={aiConfig.promptTemplate} onChange={(e) => setAiConfig({ ...aiConfig, promptTemplate: e.target.value })} rows={3} />
                      </div>
                      <div className="flex items-center gap-2">
                        <Button onClick={handleSaveAiConfig} disabled={saving} className="gap-2">
                          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                          保存
                        </Button>
                        <Button onClick={handleTestAiConnection} disabled={testing} variant="outline" className="gap-2">
                          {testing ? <Loader2 className="size-4 animate-spin" /> : <Zap className="size-4" />}
                          测试连接
                        </Button>
                      </div>
                      {testResult && (
                        <div className={`rounded-lg border p-3 text-sm ${
                          testResult.ok
                            ? "border-green-500/30 bg-green-500/5 text-green-700 dark:text-green-400"
                            : "border-destructive/30 bg-destructive/5 text-destructive"
                        }`}>
                          {testResult.ok ? "✅ " : "❌ "}{testResult.message}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {activeTab === "share" && (
                <div className="space-y-6">
                  <div className="rounded-xl border bg-card p-6 space-y-4">
                    <h3 className="font-heading text-base font-semibold">导出收藏</h3>
                    <p className="text-sm text-muted-foreground">
                      生成分享链接，其他用户可以通过链接导入你的收藏网站。
                    </p>
                    <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-4">
                      <div className="flex-1">
                        <div className="text-xs text-muted-foreground">你的分享码</div>
                        <div className="text-sm font-mono font-medium">{user.shareCode}</div>
                      </div>
                      <Button variant="outline" size="sm" className="gap-1.5" onClick={handleCopyShareCode}>
                        <Copy className="size-3.5" />
                        复制分享链接
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-xl border bg-card p-6 space-y-4">
                    <h3 className="font-heading text-base font-semibold">导入收藏</h3>
                    <p className="text-sm text-muted-foreground">
                      输入其他用户的分享码，预览并选择要导入的分类。
                    </p>
                    <div className="flex gap-2">
                      <Input
                        value={importCode}
                        onChange={(e) => { setImportCode(e.target.value); setImportPreview(null); setImported(false) }}
                        placeholder="输入分享码"
                        onKeyDown={(e) => e.key === "Enter" && handlePreviewImport()}
                      />
                      <Button onClick={handlePreviewImport} disabled={importLoading} className="gap-1.5 shrink-0">
                        {importLoading ? <Loader2 className="size-4 animate-spin" /> : <Eye className="size-4" />}
                        预览
                      </Button>
                    </div>

                    {importPreview && (
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{importPreview.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {importPreview.data.categories.length} 个分类 · {importPreview.data.sites.length} 个网站
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">选择要导入的分类：</p>
                        <div className="space-y-2">
                          {importPreview.data.categories.map((cat) => {
                            const catSites = importPreview.data.sites.filter((s) => s.categoryId === cat.id)
                            const isSelected = importSelectedCats.has(cat.id)
                            return (
                              <button
                                key={cat.id}
                                onClick={() => toggleImportCategory(cat.id)}
                                className={`w-full text-left rounded-lg border p-3 transition-all duration-200 ${
                                  isSelected ? "border-primary/40 bg-primary/5" : "border-border bg-card hover:bg-accent/30"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <div className={`size-4 rounded border flex items-center justify-center transition-colors ${
                                    isSelected ? "bg-primary border-primary text-primary-foreground" : "border-border"
                                  }`}>
                                    {isSelected && <Check className="size-3" />}
                                  </div>
                                  <span>{cat.icon}</span>
                                  <span className="text-sm font-medium">{cat.name}</span>
                                  <span className="ml-auto text-xs text-muted-foreground">{catSites.length} 个网站</span>
                                </div>
                                {isSelected && catSites.length > 0 && (
                                  <div className="mt-2 ml-6 flex flex-wrap gap-1.5">
                                    {catSites.slice(0, 5).map((site) => (
                                      <span key={site.id} className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[11px]">
                                        {site.name}
                                      </span>
                                    ))}
                                    {catSites.length > 5 && (
                                      <span className="text-[11px] text-muted-foreground">+{catSites.length - 5} 更多</span>
                                    )}
                                  </div>
                                )}
                              </button>
                            )
                          })}
                        </div>

                        {imported ? (
                          <div className="flex items-center gap-2 rounded-lg bg-primary/10 p-3 text-sm text-primary">
                            <Check className="size-4" />
                            导入成功！<Link href="/" className="underline">返回首页查看</Link>
                          </div>
                        ) : (
                          <Button onClick={handleDoImport} disabled={importing || importSelectedCats.size === 0} className="w-full gap-2">
                            {importing ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                            导入选中的 {importSelectedCats.size} 个分类
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
