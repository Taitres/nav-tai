import { NextRequest, NextResponse } from "next/server"
import { verifySession } from "@/lib/auth"
import { getSites, addSite, updateSite, deleteSite, getCategoryById } from "@/lib/db"

export async function GET() {
  const session = await verifySession()
  if (!session?.userId) return NextResponse.json({ error: "请先登录" }, { status: 401 })
  return NextResponse.json(getSites(session.userId))
}

export async function POST(request: NextRequest) {
  const session = await verifySession()
  if (!session?.userId) return NextResponse.json({ error: "请先登录" }, { status: 401 })
  const body = await request.json()
  const category = getCategoryById(body.categoryId)
  if (!category || category.userId !== session.userId) {
    return NextResponse.json({ error: "分类不存在" }, { status: 400 })
  }
  const site = addSite({ ...body, userId: session.userId })
  return NextResponse.json(site)
}

export async function PUT(request: NextRequest) {
  const session = await verifySession()
  if (!session?.userId) return NextResponse.json({ error: "请先登录" }, { status: 401 })
  const body = await request.json()
  const { id, ...updates } = body
  if (!id) return NextResponse.json({ error: "缺少网站 ID" }, { status: 400 })
  const site = updateSite(id, session.userId, updates)
  if (!site) return NextResponse.json({ error: "未找到" }, { status: 404 })
  return NextResponse.json(site)
}

export async function DELETE(request: NextRequest) {
  const session = await verifySession()
  if (!session?.userId) return NextResponse.json({ error: "请先登录" }, { status: 401 })
  const body = await request.json()
  const { id } = body
  if (!id) return NextResponse.json({ error: "缺少网站 ID" }, { status: 400 })
  const ok = deleteSite(id, session.userId)
  if (!ok) return NextResponse.json({ error: "未找到" }, { status: 404 })
  return NextResponse.json({ success: true })
}
