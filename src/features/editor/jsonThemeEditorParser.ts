import {
  exportCombinedThemeFile,
  exportThemeFile,
  type OpenCodeCombinedThemeFile,
  type OpenCodeThemeFile,
} from '../../domain/opencode/exportTheme'
import { normalizeColorValue } from '../../domain/theme/color'
import type { ThemeMode, ThemeTokenName, ThemeTokens } from '../../domain/theme/model'

export type JsonThemeModeUpdates = Partial<Record<ThemeMode, ThemeTokens>>

export type ParseJsonThemeResult =
  | {
      ok: true
      value: {
        format: 'single' | 'combined'
        themeFile: OpenCodeThemeFile | OpenCodeCombinedThemeFile
        modeThemes: JsonThemeModeUpdates
      }
    }
  | { ok: false; error: string }

type ResolveColorResult =
  | { ok: true; value: string }
  | { ok: false; error: string }

type ParsedThemeRoot = {
  defs: Record<string, unknown>
  theme: Record<string, unknown>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isThemeColorLiteral(value: string) {
  return normalizeColorValue(value) !== null
}

function resolveThemeTokenColor(
  value: string,
  defs: Record<string, unknown>,
  token: ThemeTokenName,
  visitedDefs: Set<string> = new Set(),
): ResolveColorResult {
  const normalizedLiteral = normalizeColorValue(value)

  if (normalizedLiteral && isThemeColorLiteral(value)) {
    return { ok: true, value: normalizedLiteral }
  }

  if (!(value in defs)) {
    return {
      ok: false,
      error: `Token \`${token}\` must be a color literal, \`transparent\`, or a name from \`defs\``,
    }
  }

  if (visitedDefs.has(value)) {
    return {
      ok: false,
      error: `Token \`${token}\` has a circular \`defs\` reference at \`${value}\``,
    }
  }

  const nextValue = defs[value]

  if (typeof nextValue !== 'string') {
    return {
      ok: false,
      error: `\`defs.${value}\` must resolve to a string color value`,
    }
  }

  const nextVisitedDefs = new Set(visitedDefs)
  nextVisitedDefs.add(value)

  return resolveThemeTokenColor(nextValue, defs, token, nextVisitedDefs)
}

function validateThemeRoot(parsed: unknown): { ok: true; value: ParsedThemeRoot } | { ok: false; error: string } {
  if (!isRecord(parsed)) {
    return { ok: false, error: 'Root value must stay a JSON object' }
  }

  if (parsed.$schema !== 'https://opencode.ai/theme.json') {
    return { ok: false, error: '`$schema` must be https://opencode.ai/theme.json' }
  }

  if (!isRecord(parsed.theme)) {
    return { ok: false, error: '`theme` must be an object of token colors' }
  }

  if (parsed.defs !== undefined && !isRecord(parsed.defs)) {
    return { ok: false, error: '`defs` must be an object when provided' }
  }

  return {
    ok: true,
    value: {
      defs: (parsed.defs ?? {}) as Record<string, unknown>,
      theme: parsed.theme as Record<string, unknown>,
    },
  }
}

function validateThemeTokenNames(theme: Record<string, unknown>, tokenNames: ThemeTokenName[]) {
  const tokenNameSet = new Set(tokenNames)

  for (const key of Object.keys(theme)) {
    if (key === 'thinkingOpacity') {
      continue
    }

    if (!tokenNameSet.has(key as ThemeTokenName)) {
      return { ok: false, error: `Unknown token: ${key}` } as const
    }
  }

  return { ok: true } as const
}

function parseCombinedTheme(
  theme: Record<string, unknown>,
  defs: Record<string, unknown>,
  tokenNames: ThemeTokenName[],
): ParseJsonThemeResult {
  const darkTheme = {} as ThemeTokens
  const lightTheme = {} as ThemeTokens

  for (const token of tokenNames) {
    const tokenValue = theme[token]

    if (!isRecord(tokenValue) || typeof tokenValue.dark !== 'string' || typeof tokenValue.light !== 'string') {
      return {
        ok: false,
        error: `Token \`${token}\` must include string \`dark\` and \`light\` values`,
      }
    }

    const resolvedDark = resolveThemeTokenColor(tokenValue.dark, defs, token)

    if (!resolvedDark.ok) {
      return { ok: false, error: resolvedDark.error }
    }

    const resolvedLight = resolveThemeTokenColor(tokenValue.light, defs, token)

    if (!resolvedLight.ok) {
      return { ok: false, error: resolvedLight.error }
    }

    darkTheme[token] = resolvedDark.value
    lightTheme[token] = resolvedLight.value
  }

  return {
    ok: true,
    value: {
      format: 'combined',
      themeFile: exportCombinedThemeFile(darkTheme, lightTheme),
      modeThemes: {
        dark: darkTheme,
        light: lightTheme,
      },
    },
  }
}

function parseSingleModeTheme(
  theme: Record<string, unknown>,
  defs: Record<string, unknown>,
  tokenNames: ThemeTokenName[],
  activeMode: ThemeMode,
): ParseJsonThemeResult {
  const nextTheme = {} as ThemeTokens

  for (const token of tokenNames) {
    const tokenValue = theme[token]

    if (typeof tokenValue !== 'string') {
      return { ok: false, error: `Token \`${token}\` must be a string` }
    }

    const resolvedToken = resolveThemeTokenColor(tokenValue, defs, token)

    if (!resolvedToken.ok) {
      return { ok: false, error: resolvedToken.error }
    }

    nextTheme[token] = resolvedToken.value
  }

  const modeThemes: JsonThemeModeUpdates = {}
  modeThemes[activeMode] = nextTheme

  return {
    ok: true,
    value: {
      format: 'single',
      themeFile: exportThemeFile(nextTheme),
      modeThemes,
    },
  }
}

export function parseJsonThemeFile(value: string, tokenNames: ThemeTokenName[], activeMode: ThemeMode): ParseJsonThemeResult {
  let parsed: unknown

  try {
    parsed = JSON.parse(value)
  } catch {
    return { ok: false, error: 'JSON is not valid yet' }
  }

  const validatedRoot = validateThemeRoot(parsed)

  if (!validatedRoot.ok) {
    return validatedRoot
  }

  const { defs, theme } = validatedRoot.value
  const validatedNames = validateThemeTokenNames(theme, tokenNames)

  if (!validatedNames.ok) {
    return validatedNames
  }

  let hasSingleModeValues = false
  let hasCombinedModeValues = false

  for (const token of tokenNames) {
    const tokenValue = theme[token]

    if (typeof tokenValue === 'string') {
      hasSingleModeValues = true
      continue
    }

    if (isRecord(tokenValue)) {
      hasCombinedModeValues = true
      continue
    }

    return {
      ok: false,
      error: `Token \`${token}\` must be a string or an object with \`dark\` and \`light\``,
    }
  }

  if (hasSingleModeValues && hasCombinedModeValues) {
    return {
      ok: false,
      error: '`theme` cannot mix single-mode strings with combined dark/light objects',
    }
  }

  if (hasCombinedModeValues) {
    return parseCombinedTheme(theme, defs, tokenNames)
  }

  return parseSingleModeTheme(theme, defs, tokenNames, activeMode)
}
