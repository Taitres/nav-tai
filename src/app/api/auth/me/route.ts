import { NextResponse } from "next/server"
import { verifySession } from "@/lib/auth"
import { getUserById } from "@/lib/db"

export async function GET() {
  const session = await verifySession()
  if (!session?.userId) {
    return NextResponse.json({ user: null })
  }
  const user = getUserById(session.userId)
  if (!user) {
    return NextResponse.json({ user: null })
  }
  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      shareCode: user.shareCode,
    },
  })
}
