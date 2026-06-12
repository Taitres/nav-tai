import { getNavData } from "@/lib/data"
import { SitesManager } from "./sites-client"

export default async function SitesPage() {
  const data = await getNavData()
  return (
    <SitesManager
      initialCategories={data.categories}
      initialSites={data.sites}
    />
  )
}
