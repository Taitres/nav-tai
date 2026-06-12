import { NextRequest, NextResponse } from "next/server"
import { reorderSites } from "@/lib/data"

export async function PUT(request: NextRequest) {
  const body = await request.json()
  const { orderedIds } = body
  reorderSites(orderedIds)
  return NextResponse.json({ success: true })
}