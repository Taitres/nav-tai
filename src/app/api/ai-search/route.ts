import { getSettings } from "@/lib/data"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const body = await request.json()
  const { query } = body

  if (!query) {
    return NextResponse.json({ error: "请提供搜索关键词" }, { status: 400 })
  }

  const settings = getSettings()
  const aiConfig = settings.aiSearch

  if (!aiConfig) {
    return NextResponse.json({ error: "AI 搜索未配置" }, { status: 400 })
  }

  try {
    const prompt = aiConfig.promptTemplate
      ? aiConfig.promptTemplate.replace("{query}", query)
      : `请为用户推荐与"${query}"相关的优质网站和工具。请给出网站名称、链接和简要描述。`

    if (aiConfig.provider === "anthropic") {
      const res = await fetch(aiConfig.apiUrl || "https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": aiConfig.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: aiConfig.model || "claude-3-sonnet-20240229",
          max_tokens: 1024,
          messages: [{ role: "user", content: prompt }],
        }),
      })
      const data = await res.json()
      const result = data.content?.[0]?.text || "AI 搜索返回了空结果"
      return NextResponse.json({ result })
    }

    const apiUrl = aiConfig.apiUrl || "https://api.openai.com/v1/chat/completions"
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${aiConfig.apiKey}`,
      },
      body: JSON.stringify({
        model: aiConfig.model || "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "你是一个导航站助手，帮助用户推荐相关的优质网站和工具。请给出具体的网站名称、链接和简要描述。",
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 1024,
      }),
    })
    const data = await res.json()
    const result = data.choices?.[0]?.message?.content || "AI 搜索返回了空结果"
    return NextResponse.json({ result })
  } catch (error) {
    return NextResponse.json(
      { error: "AI 搜索请求失败，请检查 API 配置" },
      { status: 500 }
    )
  }
}