import { NextRequest, NextResponse } from "next/server"
import { verifySession } from "@/lib/auth"
import { getSettings, updateSettings } from "@/lib/db"

export async function GET() {
  const session = await verifySession()
  if (!session?.userId) return NextResponse.json({ error: "请先登录" }, { status: 401 })
  return NextResponse.json(getSettings(session.userId))
}

export async function PUT(request: NextRequest) {
  const session = await verifySession()
  if (!session?.userId) return NextResponse.json({ error: "请先登录" }, { status: 401 })
  const body = await request.json()
  const settings = updateSettings(session.userId, body)
  return NextResponse.json(settings)
}
