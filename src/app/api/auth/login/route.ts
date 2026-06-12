import { NextResponse } from "next/server"
import { verifyCredentials, createSession } from "@/lib/auth"

export async function POST(request: Request) {
  const body = await request.json()
  const { email, password } = body

  if (!email || !password) {
    return NextResponse.json({ error: "请输入邮箱和密码" }, { status: 400 })
  }

  const userId = await verifyCredentials(email, password)
  if (!userId) {
    return NextResponse.json({ error: "邮箱或密码错误" }, { status: 401 })
  }

  await createSession(userId)
  return NextResponse.json({ success: true })
}
