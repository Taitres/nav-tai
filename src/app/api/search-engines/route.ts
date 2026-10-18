import { NextRequest, NextResponse } from "next/server"
import { verifySession } from "@/lib/auth"
import { getSearchEngines, addSearchEngine, updateSearchEngine, deleteSearchEngine } from "@/lib/db"

export async function GET() {
  const session = await verifySession()
  if (!session?.userId) return NextResponse.json({ error: "请先登录" }, { status: 401 })
  return NextResponse.json(getSearchEngines(session.userId))
}

export async function POST(request: NextRequest) {
  const session = await verifySession()
  if (!session?.userId) return NextResponse.json({ error: "请先登录" }, { status: 401 })
  const body = await request.json()
  const engine = addSearchEngine({ ...body, userId: session.userId })
  return NextResponse.json(engine)
}

export async function PUT(request: NextRequest) {
  const session = await verifySession()
  if (!session?.userId) return NextResponse.json({ error: "请先登录" }, { status: 401 })
  const body = await request.json()
  const { id, ...updates } = body
  if (!id) return NextResponse.json({ error: "缺少搜索引擎 ID" }, { status: 400 })
  const engine = updateSearchEngine(id, session.userId, updates)
  if (!engine) return NextResponse.json({ error: "未找到" }, { status: 404 })
  return NextResponse.json(engine)
}

export async function DELETE(request: NextRequest) {
  const session = await verifySession()
  if (!session?.userId) return NextResponse.json({ error: "请先登录" }, { status: 401 })
  const body = await request.json()
  const { id } = body
  if (!id) return NextResponse.json({ error: "缺少搜索引擎 ID" }, { status: 400 })
  const ok = deleteSearchEngine(id, session.userId)
  if (!ok) return NextResponse.json({ error: "未找到" }, { status: 404 })
  return NextResponse.json({ success: true })
}
