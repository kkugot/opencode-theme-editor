import type { ThemeTokens } from '../theme/model'

export type ContrastSeverity = 'good' | 'warning'

export type ContrastWarning = {
  id: string
  label: string
  foreground: string
  background: string
  ratio: number
  target: number
  severity: ContrastSeverity
}

function hexToRgb(hex: string) {
  const value = hex.trim()

  if (!/^#[0-9a-f]{6}$/i.test(value)) {
    return null
  }

  const parsed = Number.parseInt(value.slice(1), 16)

  return {
    r: (parsed >> 16) & 0xff,
    g: (parsed >> 8) & 0xff,
    b: parsed & 0xff,
  }
}

function toLinear(channel: number) {
  const normalized = channel / 255
  return normalized <= 0.03928
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4
}

function luminance(hex: string) {
  const rgb = hexToRgb(hex)

  if (!rgb) {
    return null
  }

  return 0.2126 * toLinear(rgb.r) + 0.7152 * toLinear(rgb.g) + 0.0722 * toLinear(rgb.b)
}

function contrastRatio(foreground: string, background: string) {
  const fg = luminance(foreground)
  const bg = luminance(background)

  if (fg === null || bg === null) {
    return 1
  }

  const lighter = Math.max(fg, bg)
  const darker = Math.min(fg, bg)

  return (lighter + 0.05) / (darker + 0.05)
}

export function analyzeContrast(tokens: ThemeTokens): ContrastWarning[] {
  const checks = [
    {
      id: 'primary-text',
      label: 'Text on background',
      foreground: tokens.text,
      background: tokens.background,
      target: 4.5,
    },
    {
      id: 'muted-text',
      label: 'Muted text on background',
      foreground: tokens.textMuted,
      background: tokens.background,
      target: 3,
    },
    {
      id: 'accent-text',
      label: 'Accent on panel',
      foreground: tokens.accent,
      background: tokens.backgroundPanel,
      target: 3,
    },
    {
      id: 'composer-text',
      label: 'Text on element background',
      foreground: tokens.text,
      background: tokens.backgroundElement,
      target: 4.5,
    },
    {
      id: 'diff-added',
      label: 'Diff added on added background',
      foreground: tokens.diffAdded,
      background: tokens.diffAddedBg,
      target: 3,
    },
    {
      id: 'code-block',
      label: 'Markdown code block on element background',
      foreground: tokens.markdownCodeBlock,
      background: tokens.backgroundElement,
      target: 4.5,
    },
  ]

  return checks.map((check) => {
    const ratio = contrastRatio(check.foreground, check.background)

    return {
      ...check,
      ratio,
      severity: ratio >= check.target ? 'good' : 'warning',
    }
  })
}
