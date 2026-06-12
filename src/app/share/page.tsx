import { verifySession } from "@/lib/auth"
import { getUserById } from "@/lib/db"
import { ShareImportClient } from "./share-import-client"
import { redirect } from "next/navigation"

export default async function SharePage() {
  const session = await verifySession()
  if (!session?.userId) redirect("/login")
  const user = getUserById(session.userId)
  if (!user) redirect("/login")
  return <ShareImportClient userId={session.userId} />
}
