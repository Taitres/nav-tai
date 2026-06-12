import { getNavData } from "@/lib/data"
import { AdminDashboard } from "./dashboard-client"

export default async function AdminPage() {
  const data = await getNavData()
  return <AdminDashboard data={data} />
}
