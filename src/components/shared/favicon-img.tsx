"use client"

import { useState } from "react"

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

const colorPalette = [
  "oklch(0.55 0.15 250)",
  "oklch(0.55 0.15 30)",
  "oklch(0.55 0.15 150)",
  "oklch(0.55 0.15 320)",
  "oklch(0.55 0.15 60)",
  "oklch(0.55 0.15 200)",
  "oklch(0.55 0.15 280)",
  "oklch(0.55 0.15 100)",
]

function getColorForName(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colorPalette[Math.abs(hash) % colorPalette.length]
}

export function FaviconImg({ url, name, className }: FaviconImgProps) {
  const [srcIndex, setSrcIndex] = useState(0)
  const domain = getDomain(url)

  const sources = domain
    ? [
        `https://favicon.im/${domain}`,
        `https://api.iowen.cn/favicon/${domain}.png`,
        `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
      ]
    : []

  if (srcIndex >= sources.length || !domain) {
    const bg = getColorForName(name)
    return (
      <div
        className={className}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "var(--radius-md, 0.5rem)",
          background: bg,
          color: "white",
          fontWeight: 700,
          fontSize: "0.75em",
          lineHeight: 1,
        }}
      >
        {name.charAt(0).toUpperCase()}
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={sources[srcIndex]}
      alt={name}
      className={className}
      style={{ borderRadius: "var(--radius-md, 0.5rem)", objectFit: "contain" }}
      onError={() => setSrcIndex((i) => i + 1)}
      loading="lazy"
    />
  )
}
