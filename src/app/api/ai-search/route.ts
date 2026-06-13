import { verifySession } from "@/lib/auth"
import { getAiSearchConfig } from "@/lib/db"

export const dynamic = "force-dynamic"

function resolveApiUrl(rawUrl: string, provider: "openai" | "anthropic" | "custom"): string {
  const base = rawUrl.replace(/\/+$/, "")
  if (provider === "anthropic") {
    if (!base.includes("/v1/messages")) return base + "/v1/messages"
  } else {
    if (!base.includes("/chat/completions")) return base + "/chat/completions"
  }
  return base
}

export async function POST(request: Request) {
  const session = await verifySession()
  if (!session?.userId) {
    return new Response(JSON.stringify({ error: "请先登录" }), { status: 401, headers: { "Content-Type": "application/json" } })
  }

  const body = await request.json()
  const { query, mode } = body

  if (!query) {
    return new Response(JSON.stringify({ error: "请提供搜索关键词" }), { status: 400, headers: { "Content-Type": "application/json" } })
  }

  const aiConfig = getAiSearchConfig(session.userId)
  if (!aiConfig) {
    return new Response(JSON.stringify({ error: "AI 搜索未配置" }), { status: 400, headers: { "Content-Type": "application/json" } })
  }

  const isSiteMode = true
  const systemPrompt = "你是一个导航站助手，帮助用户推荐相关的优质网站和工具。请以如下JSON格式返回推荐列表：[{\"name\":\"网站名\",\"url\":\"https://...\",\"description\":\"简要描述\"}]，只返回JSON数组，不要其他文字。"

  const prompt = aiConfig.promptTemplate
    ? aiConfig.promptTemplate.replace("{query}", query)
    : `请推荐与"${query}"相关的优质网站和工具`

  try {
    if (aiConfig.provider === "anthropic") {
      return await handleAnthropicStream(aiConfig, systemPrompt, prompt, isSiteMode)
    }
    return await handleOpenAIStream(aiConfig, systemPrompt, prompt, isSiteMode)
  } catch (err) {
    const message = err instanceof TypeError && err.message.includes("fetch")
      ? "网络连接失败，请检查 API 地址是否正确"
      : "AI 搜索请求失败，请稍后重试"
    return new Response(JSON.stringify({ error: message, status: 0, details: err instanceof Error ? err.message : "" }), { status: 500, headers: { "Content-Type": "application/json" } })
  }
}

function buildApiError(status: number, detail: string) {
  const statusMap: Record<number, string> = {
    401: "API 密钥无效或已过期",
    403: "没有访问权限",
    404: "API 地址不正确",
    429: "请求过于频繁，请稍后再试",
    500: "AI 服务内部错误",
    502: "AI 服务网关错误",
    503: "AI 服务暂时不可用",
  }
  return new Response(JSON.stringify({
    error: statusMap[status] || `API 错误 (${status})`,
    status,
    details: detail.slice(0, 500),
  }), { status, headers: { "Content-Type": "application/json" } })
}

function createOpenAITransform(isSiteMode: boolean): TransformStream<Uint8Array, Uint8Array> {
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()
  let buffer = ""

  return new TransformStream({
    transform(chunk, controller) {
      buffer += decoder.decode(chunk, { stream: true })
      const lines = buffer.split("\n")
      buffer = lines.pop() || ""

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith("data: ")) continue
        const data = trimmed.slice(6)
        if (data === "[DONE]") {
          controller.enqueue(encoder.encode("data: [DONE]\n\n"))
          continue
        }
        try {
          const parsed = JSON.parse(data)
          const content = parsed.choices?.[0]?.delta?.content
          if (content) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content, mode: isSiteMode ? "site" : "chat" })}\n\n`))
          }
        } catch { /* skip */ }
      }
    },
    flush(controller) {
      if (buffer.trim()) {
        const trimmed = buffer.trim()
        if (trimmed.startsWith("data: ")) {
          const data = trimmed.slice(6)
          if (data !== "[DONE]") {
            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices?.[0]?.delta?.content
              if (content) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content, mode: isSiteMode ? "site" : "chat" })}\n\n`))
              }
            } catch { /* skip */ }
          }
        }
      }
    },
  })
}

function createAnthropicTransform(isSiteMode: boolean): TransformStream<Uint8Array, Uint8Array> {
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()
  let buffer = ""

  return new TransformStream({
    transform(chunk, controller) {
      buffer += decoder.decode(chunk, { stream: true })
      const lines = buffer.split("\n")
      buffer = lines.pop() || ""

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith("data: ")) continue
        const data = trimmed.slice(6)
        try {
          const parsed = JSON.parse(data)
          if (parsed.type === "content_block_delta" && parsed.delta?.text) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: parsed.delta.text, mode: isSiteMode ? "site" : "chat" })}\n\n`))
          }
        } catch { /* skip */ }
      }
    },
    flush(controller) {
      controller.enqueue(encoder.encode("data: [DONE]\n\n"))
    },
  })
}

async function handleOpenAIStream(aiConfig: NonNullable<Awaited<ReturnType<typeof getAiSearchConfig>>>, systemPrompt: string, prompt: string, isSiteMode: boolean) {
  const apiUrl = resolveApiUrl(aiConfig.apiUrl, aiConfig.provider)
  const upstream = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${aiConfig.apiKey}`,
    },
    body: JSON.stringify({
      model: aiConfig.model || "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      max_tokens: 2048,
      stream: true,
    }),
  })

  if (!upstream.ok) {
    let detail = ""
    try { detail = await upstream.text() } catch { detail = "未知错误" }
    return buildApiError(upstream.status, detail)
  }

  if (!upstream.body) {
    return new Response(JSON.stringify({ error: "上游未返回数据" }), { status: 502, headers: { "Content-Type": "application/json" } })
  }

  const transformed = upstream.body.pipeThrough(createOpenAITransform(isSiteMode))

  return new Response(transformed, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  })
}

async function handleAnthropicStream(aiConfig: NonNullable<Awaited<ReturnType<typeof getAiSearchConfig>>>, systemPrompt: string, prompt: string, isSiteMode: boolean) {
  const apiUrl = resolveApiUrl(aiConfig.apiUrl, aiConfig.provider)
  const upstream = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": aiConfig.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: aiConfig.model || "claude-3-5-sonnet-20241022",
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: "user", content: prompt }],
      stream: true,
    }),
  })

  if (!upstream.ok) {
    let detail = ""
    try { detail = await upstream.text() } catch { detail = "未知错误" }
    return buildApiError(upstream.status, detail)
  }

  if (!upstream.body) {
    return new Response(JSON.stringify({ error: "上游未返回数据" }), { status: 502, headers: { "Content-Type": "application/json" } })
  }

  const transformed = upstream.body.pipeThrough(createAnthropicTransform(isSiteMode))

  return new Response(transformed, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  })
}
