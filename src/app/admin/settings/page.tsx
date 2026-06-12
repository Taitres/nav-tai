import { getNavData } from "@/lib/data"
import { SettingsManager } from "./settings-client"

export default async function SettingsPage() {
  const data = await getNavData()
  return <SettingsManager initialSettings={data.settings} />
}