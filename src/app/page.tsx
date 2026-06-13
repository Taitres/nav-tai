import { getAdminNavData, getUserNavData } from "@/lib/data"
import { verifySession } from "@/lib/auth"
import { getUserById } from "@/lib/db"
import { HomePage } from "./home-page"

export const dynamic = "force-dynamic"

export default async function Home() {
  const session = await verifySession()
  let navData

  if (session?.userId) {
    const user = getUserById(session.userId)
    if (user) {
      navData = getUserNavData(user.id)
      return (
        <HomePage
          categories={navData.categories}
          sites={navData.sites}
          settings={navData.settings}
          searchEngines={navData.searchEngines}
          aiSearch={navData.aiSearch}
          user={{ id: user.id, name: user.name, role: user.role, shareCode: user.shareCode }}
          isOwner={true}
        />
      )
    }
  }

  navData = getAdminNavData()
  if (!navData) {
    return <HomePage categories={[]} sites={[]} settings={{ siteName: "Nav-Tai", siteDescription: "", heroTitle: "发现优质网站", heroSubtitle: "", defaultEngineId: null, theme: "default", wallpaper: "" }} searchEngines={[]} aiSearch={null} isOwner={false} />
  }

  return (
    <HomePage
      categories={navData.categories}
      sites={navData.sites}
      settings={navData.settings}
      searchEngines={navData.searchEngines}
      aiSearch={navData.aiSearch}
      isOwner={false}
    />
  )
}
