import { NextRequest, NextResponse } from "next/server"
import { verifySession } from "@/lib/auth"
import { getAiSearchConfig, setAiSearchConfig } from "@/lib/db"

export async function GET() {
  const session = await verifySession()
  if (!session?.userId) return NextResponse.json({ error: "请先登录" }, { status: 401 })
  const config = getAiSearchConfig(session.userId)
  return NextResponse.json(config || null)
}

export async function PUT(request: NextRequest) {
  const session = await verifySession()
  if (!session?.userId) return NextResponse.json({ error: "请先登录" }, { status: 401 })
  const body = await request.json()
  const config = setAiSearchConfig(session.userId, body)
  return NextResponse.json(config)
}
