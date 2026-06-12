import { NextRequest, NextResponse } from "next/server"
import { verifySession } from "@/lib/auth"
import { getUserById, getUserByEmail, updateUserPassword } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function PUT(request: NextRequest) {
  const session = await verifySession()
  if (!session?.userId) return NextResponse.json({ error: "请先登录" }, { status: 401 })
  const body = await request.json()
  const { oldPassword, newPassword } = body
  if (!oldPassword || !newPassword) return NextResponse.json({ error: "请填写所有字段" }, { status: 400 })
  if (newPassword.length < 6) return NextResponse.json({ error: "新密码至少6个字符" }, { status: 400 })

  const user = getUserById(session.userId)
  if (!user) return NextResponse.json({ error: "用户未找到" }, { status: 404 })

  const userWithHash = getUserByEmail(user.email)
  if (!userWithHash) return NextResponse.json({ error: "用户未找到" }, { status: 404 })

  const valid = await bcrypt.compare(oldPassword, userWithHash.passwordHash)
  if (!valid) return NextResponse.json({ error: "当前密码错误" }, { status: 401 })

  const hash = await bcrypt.hash(newPassword, 10)
  const ok = updateUserPassword(session.userId, hash)
  if (!ok) return NextResponse.json({ error: "密码更新失败" }, { status: 500 })
  return NextResponse.json({ success: true })
}
