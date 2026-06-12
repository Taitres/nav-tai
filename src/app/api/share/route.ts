import { NextRequest, NextResponse } from "next/server"
import { verifySession } from "@/lib/auth"
import { createSharedCollection, getSharedCollection } from "@/lib/db"

export async function POST(request: NextRequest) {
  const session = await verifySession()
  if (!session?.userId) return NextResponse.json({ error: "请先登录" }, { status: 401 })
  const body = await request.json()
  const { name } = body
  const collection = createSharedCollection(session.userId, name || "我的收藏")
  return NextResponse.json(collection)
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  if (!code) return NextResponse.json({ error: "缺少分享码" }, { status: 400 })
  const collection = getSharedCollection(code)
  if (!collection) return NextResponse.json({ error: "分享码无效" }, { status: 404 })
  return NextResponse.json(collection)
}
