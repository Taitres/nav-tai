import { NextRequest, NextResponse } from "next/server"
import {
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
} from "@/lib/data"

export async function GET() {
  return NextResponse.json(getCategories())
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const category = addCategory(body)
  return NextResponse.json(category)
}

export async function PUT(request: NextRequest) {
  const body = await request.json()
  const { id, ...updates } = body
  const category = updateCategory(id, updates)
  if (!category) return NextResponse.json({ error: "未找到" }, { status: 404 })
  return NextResponse.json(category)
}

export async function DELETE(request: NextRequest) {
  const body = await request.json()
  const { id } = body
  const ok = deleteCategory(id)
  if (!ok) return NextResponse.json({ error: "未找到" }, { status: 404 })
  return NextResponse.json({ success: true })
}