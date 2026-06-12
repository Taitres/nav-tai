import { Skeleton } from "@/components/ui/skeleton"

export function HomeSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="size-8 rounded-md" />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4">
        <div className="pb-8 pt-16 md:pb-12 md:pt-24">
          <Skeleton className="mx-auto h-10 w-64" />
          <Skeleton className="mx-auto mt-3 h-5 w-96" />
        </div>

        <div className="mx-auto mb-6 max-w-2xl">
          <Skeleton className="h-14 w-full rounded-2xl" />
        </div>

        <div className="mb-8 flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-lg" />
          ))}
        </div>

        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="mb-10">
            <Skeleton className="mb-4 h-6 w-32" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: 5 }).map((_, j) => (
                <Skeleton key={j} className="h-28 w-full rounded-xl" />
              ))}
            </div>
          </div>
        ))}
      </main>
    </div>
  )
}
