import { getNavData } from "@/lib/data"
import { HomePage } from "./home-page"

export const revalidate = 60

export default async function Home() {
  const data = await getNavData()
  return (
    <HomePage
      categories={data.categories}
      sites={data.sites}
      settings={data.settings}
    />
  )
}
