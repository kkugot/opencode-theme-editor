import { THEME_TOKEN_NAMES, type ThemeMode, type ThemeTokenName, type ThemeTokens } from '../theme/model'
import { normalizeColorValue } from '../theme/color'

type OptionalOpenCodeThemeTokenName = 'selectedListItemText' | 'backgroundMenu'
type RequiredOpenCodeThemeTokenName = Exclude<ThemeTokenName, OptionalOpenCodeThemeTokenName>
type OpenCodeThemeScalar = string | number
type OpenCodeThemeVariant = {
  dark: OpenCodeThemeScalar
  light: OpenCodeThemeScalar
}
type OpenCodeThemeColorValue = OpenCodeThemeScalar | OpenCodeThemeVariant

export type OpenCodeThemeJson = {
  $schema?: string
  defs?: Record<string, OpenCodeThemeScalar>
  theme: Record<RequiredOpenCodeThemeTokenName, OpenCodeThemeColorValue> &
    Partial<Record<OptionalOpenCodeThemeTokenName, OpenCodeThemeColorValue>> & {
      thinkingOpacity?: number
    }
}

function isThemeVariant(value: OpenCodeThemeColorValue): value is OpenCodeThemeVariant {
  return typeof value === 'object' && value !== null && 'dark' in value && 'light' in value
}

function ansiToHex(code: number) {
  if (code < 16) {
    const ansiColors = [
      '#000000',
      '#800000',
      '#008000',
      '#808000',
      '#000080',
      '#800080',
      '#008080',
      '#c0c0c0',
      '#808080',
      '#ff0000',
      '#00ff00',
      '#ffff00',
      '#0000ff',
      '#ff00ff',
      '#00ffff',
      '#ffffff',
    ]

    return ansiColors[code] ?? '#000000'
  }

  if (code < 232) {
    const index = code - 16
    const blue = index % 6
    const green = Math.floor(index / 6) % 6
    const red = Math.floor(index / 36)
    const normalizeChannel = (value: number) => (value === 0 ? 0 : value * 40 + 55)

    return `#${[red, green, blue]
      .map(normalizeChannel)
      .map((value) => value.toString(16).padStart(2, '0'))
      .join('')}`
  }

  if (code < 256) {
    const gray = (code - 232) * 10 + 8
    const hex = gray.toString(16).padStart(2, '0')

    return `#${hex}${hex}${hex}`
  }

  return '#000000'
}

function formatReferencePath(path: string[], next: string) {
  return [...path, next]
    .map((part) => part.replace(/^(defs|theme):/u, ''))
    .join(' -> ')
}

function resolveThemeValue(
  theme: OpenCodeThemeJson,
  value: OpenCodeThemeColorValue,
  mode: ThemeMode,
  path: string[],
): string {
  if (isThemeVariant(value)) {
    return resolveThemeValue(theme, value[mode], mode, path)
  }

  if (typeof value === 'number') {
    return ansiToHex(value)
  }

  const literal = normalizeColorValue(value)

  if (literal) {
    return literal
  }
  const definitionValue = theme.defs?.[value]
  const definitionMarker = `defs:${value}`

  if (definitionValue !== undefined) {
    if (path.includes(definitionMarker)) {
      throw new Error(`Circular OpenCode theme reference: ${formatReferencePath(path, definitionMarker)}`)
    }

    return resolveThemeValue(theme, definitionValue, mode, [...path, definitionMarker])
  }

  const themeValue = theme.theme[value as RequiredOpenCodeThemeTokenName | OptionalOpenCodeThemeTokenName]
  const themeMarker = `theme:${value}`

  if (themeValue !== undefined && value !== 'thinkingOpacity') {
    if (path.includes(themeMarker)) {
      throw new Error(`Circular OpenCode theme reference: ${formatReferencePath(path, themeMarker)}`)
    }

    return resolveThemeValue(theme, themeValue, mode, [...path, themeMarker])
  }

  throw new Error(`Unknown OpenCode theme reference: ${value}`)
}

function resolveRequiredToken(theme: OpenCodeThemeJson, token: RequiredOpenCodeThemeTokenName, mode: ThemeMode) {
  return resolveThemeValue(theme, theme.theme[token], mode, [`theme:${token}`])
}

export function resolveOpenCodeTheme(theme: OpenCodeThemeJson, mode: ThemeMode): ThemeTokens {
  const resolved = {} as ThemeTokens

  for (const token of THEME_TOKEN_NAMES) {
    if (token === 'selectedListItemText' || token === 'backgroundMenu') {
      continue
    }

    resolved[token] = resolveRequiredToken(theme, token, mode)
  }

  resolved.selectedListItemText = theme.theme.selectedListItemText
    ? resolveThemeValue(theme, theme.theme.selectedListItemText, mode, ['theme:selectedListItemText'])
    : resolved.background

  resolved.backgroundMenu = theme.theme.backgroundMenu
    ? resolveThemeValue(theme, theme.theme.backgroundMenu, mode, ['theme:backgroundMenu'])
    : resolved.backgroundElement

  return resolved
}
