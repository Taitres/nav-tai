import Link from "next/link"

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
      <span className="inline-flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
        N
      </span>
      <span>Nav-Tai</span>
    </Link>
  )
}
