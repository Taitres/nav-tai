import { NextRequest, NextResponse } from "next/server"
import { verifySession } from "@/lib/auth"
import { importSharedCollection } from "@/lib/db"

export async function POST(request: NextRequest) {
  const session = await verifySession()
  if (!session?.userId) return NextResponse.json({ error: "请先登录" }, { status: 401 })
  const body = await request.json()
  const { shareCode, selectedCategoryIds } = body
  if (!shareCode) return NextResponse.json({ error: "缺少分享码" }, { status: 400 })
  const result = importSharedCollection(session.userId, shareCode, selectedCategoryIds)
  if (!result) return NextResponse.json({ error: "分享码无效或导入失败" }, { status: 400 })
  return NextResponse.json(result)
}
