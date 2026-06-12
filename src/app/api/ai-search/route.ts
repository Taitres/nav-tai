import { verifySession } from "@/lib/auth"
import { getAiSearchConfig } from "@/lib/db"

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

  const isSiteMode = mode === "site"
  const systemPrompt = isSiteMode
    ? "你是一个导航站助手，帮助用户推荐相关的优质网站和工具。请以如下JSON格式返回推荐列表：[{\"name\":\"网站名\",\"url\":\"https://...\",\"description\":\"简要描述\"}]，只返回JSON数组，不要其他文字。"
    : "你是一个智能助手，请用 Markdown 格式回答用户的问题。"

  const prompt = aiConfig.promptTemplate
    ? aiConfig.promptTemplate.replace("{query}", query)
    : isSiteMode
      ? `请推荐与"${query}"相关的优质网站和工具`
      : query

  try {
    if (aiConfig.provider === "anthropic") {
      return handleAnthropicStream(aiConfig, systemPrompt, prompt, isSiteMode)
    }
    return handleOpenAIStream(aiConfig, systemPrompt, prompt, isSiteMode)
  } catch {
    return new Response(JSON.stringify({ error: "AI 搜索请求失败" }), { status: 500, headers: { "Content-Type": "application/json" } })
  }
}

async function handleOpenAIStream(aiConfig: NonNullable<Awaited<ReturnType<typeof getAiSearchConfig>>>, systemPrompt: string, prompt: string, isSiteMode: boolean) {
  const apiUrl = aiConfig.apiUrl || "https://api.openai.com/v1/chat/completions"
  const res = await fetch(apiUrl, {
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

  if (!res.ok) {
    const error = await res.text()
    return new Response(JSON.stringify({ error: `API 错误: ${error}` }), { status: 500, headers: { "Content-Type": "application/json" } })
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const reader = res.body?.getReader()
      if (!reader) { controller.close(); return }
      const decoder = new TextDecoder()
      let buffer = ""

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split("\n")
          buffer = lines.pop() || ""

          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed || !trimmed.startsWith("data: ")) continue
            const data = trimmed.slice(6)
            if (data === "[DONE]") {
              controller.enqueue(encoder.encode(`data: [DONE]\n\n`))
              continue
            }
            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices?.[0]?.delta?.content
              if (content) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content, mode: isSiteMode ? "site" : "chat" })}\n\n`))
              }
            } catch { /* skip malformed chunks */ }
          }
        }
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}

async function handleAnthropicStream(aiConfig: NonNullable<Awaited<ReturnType<typeof getAiSearchConfig>>>, systemPrompt: string, prompt: string, isSiteMode: boolean) {
  const res = await fetch(aiConfig.apiUrl || "https://api.anthropic.com/v1/messages", {
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

  if (!res.ok) {
    const error = await res.text()
    return new Response(JSON.stringify({ error: `API 错误: ${error}` }), { status: 500, headers: { "Content-Type": "application/json" } })
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const reader = res.body?.getReader()
      if (!reader) { controller.close(); return }
      const decoder = new TextDecoder()
      let buffer = ""

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
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
            } catch { /* skip malformed chunks */ }
          }
        }
        controller.enqueue(encoder.encode(`data: [DONE]\n\n`))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
