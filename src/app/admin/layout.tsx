import { redirect } from "next/navigation"
import { verifySession } from "@/lib/auth"
import { AdminShell } from "./admin-shell"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await verifySession()
  if (!session) {
    redirect("/login")
  }

  return <AdminShell>{children}</AdminShell>
}
