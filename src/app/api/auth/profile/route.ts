import { NextRequest, NextResponse } from "next/server"
import { verifySession } from "@/lib/auth"
import { updateUser } from "@/lib/db"

export async function PUT(request: NextRequest) {
  const session = await verifySession()
  if (!session?.userId) return NextResponse.json({ error: "请先登录" }, { status: 401 })
  const body = await request.json()
  const { name } = body
  const user = updateUser(session.userId, { name })
  if (!user) return NextResponse.json({ error: "用户未找到" }, { status: 404 })
  return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role, shareCode: user.shareCode } })
}
