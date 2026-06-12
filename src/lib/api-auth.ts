import { NextResponse } from "next/server"
import { verifySession } from "@/lib/auth"
import { getUserById } from "@/lib/db"

export async function getAuthUser() {
  const session = await verifySession()
  if (!session?.userId) return null
  const user = getUserById(session.userId)
  return user
}

export function unauthorized() {
  return NextResponse.json({ error: "请先登录" }, { status: 401 })
}

export function forbidden() {
  return NextResponse.json({ error: "无权限" }, { status: 403 })
}
