import { getNavData } from "@/lib/data"
import { SearchConfigManager } from "./search-client"

export default async function SearchConfigPage() {
  const data = await getNavData()
  return <SearchConfigManager initialSettings={data.settings} />
}