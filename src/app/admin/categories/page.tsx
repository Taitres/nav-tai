import { getNavData } from "@/lib/data"
import { CategoriesManager } from "./categories-client"

export default async function CategoriesPage() {
  const data = await getNavData()
  return <CategoriesManager initialCategories={data.categories} initialSites={data.sites} />
}
