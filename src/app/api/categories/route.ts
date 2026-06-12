import { NextRequest, NextResponse } from "next/server"
import { verifySession } from "@/lib/auth"
import { getCategories, addCategory, updateCategory, deleteCategory, getSites } from "@/lib/db"

export async function GET() {
  const session = await verifySession()
  if (!session?.userId) return NextResponse.json({ error: "请先登录" }, { status: 401 })
  return NextResponse.json(getCategories(session.userId))
}

export async function POST(request: NextRequest) {
  const session = await verifySession()
  if (!session?.userId) return NextResponse.json({ error: "请先登录" }, { status: 401 })
  const body = await request.json()
  const category = addCategory({ ...body, userId: session.userId })
  return NextResponse.json(category)
}

export async function PUT(request: NextRequest) {
  const session = await verifySession()
  if (!session?.userId) return NextResponse.json({ error: "请先登录" }, { status: 401 })
  const body = await request.json()
  const { id, ...updates } = body
  const category = updateCategory(id, updates)
  if (!category) return NextResponse.json({ error: "未找到" }, { status: 404 })
  return NextResponse.json(category)
}

export async function DELETE(request: NextRequest) {
  const session = await verifySession()
  if (!session?.userId) return NextResponse.json({ error: "请先登录" }, { status: 401 })
  const body = await request.json()
  const { id } = body
  const sites = getSites(session.userId)
  const hasSites = sites.some((s) => s.categoryId === id)
  if (hasSites) {
    return NextResponse.json({ error: "该分类下还有网站，请先删除或移动" }, { status: 400 })
  }
  const ok = deleteCategory(id)
  if (!ok) return NextResponse.json({ error: "未找到" }, { status: 404 })
  return NextResponse.json({ success: true })
}
