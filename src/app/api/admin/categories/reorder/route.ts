import { NextRequest, NextResponse } from "next/server"
import { reorderCategories } from "@/lib/data"

export async function PUT(request: NextRequest) {
  const body = await request.json()
  const { orderedIds } = body
  reorderCategories(orderedIds)
  return NextResponse.json({ success: true })
}