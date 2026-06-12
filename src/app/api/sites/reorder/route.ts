import { NextRequest, NextResponse } from "next/server"
import { verifySession } from "@/lib/auth"
import { reorderSites } from "@/lib/db"

export async function PUT(request: NextRequest) {
  const session = await verifySession()
  if (!session?.userId) return NextResponse.json({ error: "请先登录" }, { status: 401 })
  const body = await request.json()
  const { orderedIds } = body
  reorderSites(orderedIds)
  return NextResponse.json({ success: true })
}
