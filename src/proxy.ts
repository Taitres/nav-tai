import { NextRequest, NextResponse } from "next/server"
import { decrypt } from "@/lib/auth"

const protectedRoutes = ["/settings", "/share"]
const authRoutes = ["/login", "/register"]

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname
  const isProtectedRoute = protectedRoutes.some((r) => path.startsWith(r))
  const isAuthRoute = authRoutes.some((r) => path === r)

  const cookie = req.cookies.get("session")?.value
  const session = await decrypt(cookie)

  if (isProtectedRoute && !session?.userId) {
    return NextResponse.redirect(new URL("/login", req.nextUrl))
  }

  if (isAuthRoute && session?.userId) {
    return NextResponse.redirect(new URL("/", req.nextUrl))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
}
