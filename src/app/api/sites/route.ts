import { NextRequest, NextResponse } from "next/server"
import { verifySession } from "@/lib/auth"
import { getSites, addSite, updateSite, deleteSite } from "@/lib/db"

export async function GET() {
  const session = await verifySession()
  if (!session?.userId) return NextResponse.json({ error: "请先登录" }, { status: 401 })
  return NextResponse.json(getSites(session.userId))
}

export async function POST(request: NextRequest) {
  const session = await verifySession()
  if (!session?.userId) return NextResponse.json({ error: "请先登录" }, { status: 401 })
  const body = await request.json()
  const site = addSite({ ...body, userId: session.userId })
  return NextResponse.json(site)
}

export async function PUT(request: NextRequest) {
  const session = await verifySession()
  if (!session?.userId) return NextResponse.json({ error: "请先登录" }, { status: 401 })
  const body = await request.json()
  const { id, ...updates } = body
  const site = updateSite(id, updates)
  if (!site) return NextResponse.json({ error: "未找到" }, { status: 404 })
  return NextResponse.json(site)
}

export async function DELETE(request: NextRequest) {
  const session = await verifySession()
  if (!session?.userId) return NextResponse.json({ error: "请先登录" }, { status: 401 })
  const body = await request.json()
  const { id } = body
  const ok = deleteSite(id)
  if (!ok) return NextResponse.json({ error: "未找到" }, { status: 404 })
  return NextResponse.json({ success: true })
}
