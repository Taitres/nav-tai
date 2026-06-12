import { NextRequest, NextResponse } from "next/server"
import {
  getSites,
  addSite,
  updateSite,
  deleteSite,
} from "@/lib/data"

export async function GET() {
  return NextResponse.json(getSites())
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const site = addSite(body)
  return NextResponse.json(site)
}

export async function PUT(request: NextRequest) {
  const body = await request.json()
  const { id, ...updates } = body
  const site = updateSite(id, updates)
  if (!site) return NextResponse.json({ error: "未找到" }, { status: 404 })
  return NextResponse.json(site)
}

export async function DELETE(request: NextRequest) {
  const body = await request.json()
  const { id } = body
  const ok = deleteSite(id)
  if (!ok) return NextResponse.json({ error: "未找到" }, { status: 404 })
  return NextResponse.json({ success: true })
}