import { NextResponse } from "next/server"
import { createUser } from "@/lib/db"
import { hashPassword, createSession } from "@/lib/auth"

export async function POST(request: Request) {
  const body = await request.json()
  const { email, password, name } = body

  if (!email || !password || !name) {
    return NextResponse.json({ error: "请填写所有字段" }, { status: 400 })
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "密码至少6个字符" }, { status: 400 })
  }

  try {
    const passwordHash = await hashPassword(password)
    const user = createUser({ email, passwordHash, name })
    await createSession(user.id)
    return NextResponse.json({ success: true, user: { id: user.id, email: user.email, name: user.name } })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "注册失败"
    if (message.includes("UNIQUE constraint failed")) {
      return NextResponse.json({ error: "该邮箱已被注册" }, { status: 409 })
    }
    return NextResponse.json({ error: "注册失败，请重试" }, { status: 500 })
  }
}
