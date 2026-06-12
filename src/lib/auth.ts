import "server-only"
import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import bcrypt from "bcryptjs"
import type { SessionPayload } from "./types"
import { getUserById, getUserByEmail } from "./db"

const secretKey = process.env.SESSION_SECRET || "nav-tai-default-secret-change-me"
const encodedKey = new TextEncoder().encode(secretKey)

export async function encrypt(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(encodedKey)
}

export async function decrypt(session: string | undefined): Promise<SessionPayload | null> {
  if (!session) return null
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ["HS256"],
    })
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

export async function createSession(userId: string): Promise<void> {
  const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000
  const session = await encrypt({ userId, expiresAt })
  const cookieStore = await cookies()
  cookieStore.set("session", session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: new Date(expiresAt),
    sameSite: "lax",
    path: "/",
  })
}

export async function verifySession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const session = cookieStore.get("session")?.value
  const payload = await decrypt(session)

  if (!session || !payload) return null

  const user = getUserById(payload.userId)
  if (!user) return null

  if (payload.expiresAt - Date.now() < 7 * 24 * 60 * 60 * 1000) {
    await createSession(payload.userId)
  }

  return payload
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete("session")
}

export async function verifyCredentials(email: string, password: string): Promise<string | null> {
  const user = getUserByEmail(email)
  if (!user) return null
  const valid = await bcrypt.compare(password, user.passwordHash)
  return valid ? user.id : null
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}
