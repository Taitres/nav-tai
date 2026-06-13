export interface ThemePreset {
  id: string
  name: string
  primary: string
  primaryForeground: string
  ring: string
  accent: string
  chart1: string
  darkPrimary: string
  darkRing: string
  darkAccent: string
  darkChart1: string
}

export const themePresets: ThemePreset[] = [
  {
    id: "default",
    name: "默认紫",
    primary: "oklch(0.45 0.18 270)",
    primaryForeground: "oklch(0.985 0 0)",
    ring: "oklch(0.45 0.18 270)",
    accent: "oklch(0.97 0.005 270)",
    chart1: "oklch(0.45 0.18 270)",
    darkPrimary: "oklch(0.75 0.14 270)",
    darkRing: "oklch(0.75 0.14 270)",
    darkAccent: "oklch(0.22 0.01 285)",
    darkChart1: "oklch(0.75 0.14 270)",
  },
  {
    id: "aurora",
    name: "极光绿",
    primary: "oklch(0.55 0.17 160)",
    primaryForeground: "oklch(0.985 0 0)",
    ring: "oklch(0.55 0.17 160)",
    accent: "oklch(0.97 0.01 160)",
    chart1: "oklch(0.55 0.17 160)",
    darkPrimary: "oklch(0.72 0.16 160)",
    darkRing: "oklch(0.72 0.16 160)",
    darkAccent: "oklch(0.22 0.01 160)",
    darkChart1: "oklch(0.72 0.16 160)",
  },
  {
    id: "ocean",
    name: "深海蓝",
    primary: "oklch(0.48 0.15 240)",
    primaryForeground: "oklch(0.985 0 0)",
    ring: "oklch(0.48 0.15 240)",
    accent: "oklch(0.97 0.01 240)",
    chart1: "oklch(0.48 0.15 240)",
    darkPrimary: "oklch(0.70 0.14 240)",
    darkRing: "oklch(0.70 0.14 240)",
    darkAccent: "oklch(0.22 0.01 240)",
    darkChart1: "oklch(0.70 0.14 240)",
  },
  {
    id: "sunset",
    name: "暮光橙",
    primary: "oklch(0.55 0.18 45)",
    primaryForeground: "oklch(0.985 0 0)",
    ring: "oklch(0.55 0.18 45)",
    accent: "oklch(0.97 0.01 45)",
    chart1: "oklch(0.55 0.18 45)",
    darkPrimary: "oklch(0.72 0.16 45)",
    darkRing: "oklch(0.72 0.16 45)",
    darkAccent: "oklch(0.22 0.01 45)",
    darkChart1: "oklch(0.72 0.16 45)",
  },
  {
    id: "rose",
    name: "玫瑰红",
    primary: "oklch(0.50 0.20 350)",
    primaryForeground: "oklch(0.985 0 0)",
    ring: "oklch(0.50 0.20 350)",
    accent: "oklch(0.97 0.01 350)",
    chart1: "oklch(0.50 0.20 350)",
    darkPrimary: "oklch(0.68 0.18 350)",
    darkRing: "oklch(0.68 0.18 350)",
    darkAccent: "oklch(0.22 0.01 350)",
    darkChart1: "oklch(0.68 0.18 350)",
  },
  {
    id: "cyber",
    name: "赛博粉",
    primary: "oklch(0.60 0.22 320)",
    primaryForeground: "oklch(0.985 0 0)",
    ring: "oklch(0.60 0.22 320)",
    accent: "oklch(0.97 0.01 320)",
    chart1: "oklch(0.60 0.22 320)",
    darkPrimary: "oklch(0.75 0.20 320)",
    darkRing: "oklch(0.75 0.20 320)",
    darkAccent: "oklch(0.22 0.01 320)",
    darkChart1: "oklch(0.75 0.20 320)",
  },
  {
    id: "forest",
    name: "森林绿",
    primary: "oklch(0.45 0.12 140)",
    primaryForeground: "oklch(0.985 0 0)",
    ring: "oklch(0.45 0.12 140)",
    accent: "oklch(0.97 0.005 140)",
    chart1: "oklch(0.45 0.12 140)",
    darkPrimary: "oklch(0.65 0.12 140)",
    darkRing: "oklch(0.65 0.12 140)",
    darkAccent: "oklch(0.22 0.01 140)",
    darkChart1: "oklch(0.65 0.12 140)",
  },
  {
    id: "slate",
    name: "石墨灰",
    primary: "oklch(0.40 0.02 260)",
    primaryForeground: "oklch(0.985 0 0)",
    ring: "oklch(0.40 0.02 260)",
    accent: "oklch(0.97 0.002 260)",
    chart1: "oklch(0.40 0.02 260)",
    darkPrimary: "oklch(0.65 0.02 260)",
    darkRing: "oklch(0.65 0.02 260)",
    darkAccent: "oklch(0.22 0.005 260)",
    darkChart1: "oklch(0.65 0.02 260)",
  },
]

export function getThemePreset(id: string): ThemePreset | undefined {
  return themePresets.find((t) => t.id === id)
}

export interface WallpaperPreset {
  id: string
  name: string
  value: string
}

export const wallpaperPresets: WallpaperPreset[] = [
  { id: "none", name: "无", value: "" },
  { id: "gradient-purple", name: "紫光", value: "linear-gradient(135deg, oklch(0.82 0.12 280), oklch(0.78 0.08 250))" },
  { id: "gradient-green", name: "翠谷", value: "linear-gradient(135deg, oklch(0.85 0.10 160), oklch(0.82 0.06 180))" },
  { id: "gradient-ocean", name: "深海", value: "linear-gradient(135deg, oklch(0.80 0.10 240), oklch(0.75 0.08 260))" },
  { id: "gradient-sunset", name: "暮色", value: "linear-gradient(135deg, oklch(0.85 0.12 55), oklch(0.80 0.08 30))" },
  { id: "gradient-rose", name: "玫瑰", value: "linear-gradient(135deg, oklch(0.83 0.10 350), oklch(0.78 0.07 330))" },
  { id: "mesh-aurora", name: "极光", value: "radial-gradient(ellipse at 20% 50%, oklch(0.85 0.10 160 / 0.7), transparent 50%), radial-gradient(ellipse at 80% 20%, oklch(0.82 0.08 270 / 0.5), transparent 50%), radial-gradient(ellipse at 50% 80%, oklch(0.80 0.06 200 / 0.6), transparent 50%)" },
  { id: "mesh-cosmos", name: "星云", value: "radial-gradient(ellipse at 30% 30%, oklch(0.83 0.10 300 / 0.6), transparent 50%), radial-gradient(ellipse at 70% 70%, oklch(0.80 0.09 240 / 0.5), transparent 50%), radial-gradient(ellipse at 50% 50%, oklch(0.78 0.05 180 / 0.4), transparent 50%)" },
]
