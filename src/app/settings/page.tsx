import { verifySession } from "@/lib/auth"
import { getUserById } from "@/lib/db"
import { SettingsClient } from "./settings-client"
import { redirect } from "next/navigation"

export default async function SettingsPage() {
  const session = await verifySession()
  if (!session?.userId) redirect("/login")
  const user = getUserById(session.userId)
  if (!user) redirect("/login")
  return <SettingsClient user={user} />
}
