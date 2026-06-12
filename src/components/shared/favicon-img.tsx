"use client"

import { useState } from "react"
import Image from "next/image"

interface FaviconImgProps {
  url: string
  name: string
  className?: string
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return ""
  }
}

export function FaviconImg({ url, name, className }: FaviconImgProps) {
  const [error, setError] = useState(false)
  const domain = getDomain(url)
  const faviconUrl = domain
    ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
    : ""

  if (error || !faviconUrl) {
    return (
      <div
        className={className}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "var(--radius-md)",
          background: "var(--muted)",
          color: "var(--muted-foreground)",
          fontWeight: 600,
          fontSize: "0.875rem",
        }}
      >
        {name.charAt(0).toUpperCase()}
      </div>
    )
  }

  return (
    <Image
      src={faviconUrl}
      alt={name}
      width={32}
      height={32}
      className={className}
      style={{ borderRadius: "var(--radius-md)" }}
      onError={() => setError(true)}
      unoptimized
    />
  )
}
