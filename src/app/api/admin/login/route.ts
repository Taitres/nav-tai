import { createSession, verifyPassword } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const body = await request.json()
  const { password } = body

  if (!password || !verifyPassword(password)) {
    return NextResponse.json({ error: "密码错误" }, { status: 401 })
  }

  await createSession()

  return NextResponse.json({ success: true })
}