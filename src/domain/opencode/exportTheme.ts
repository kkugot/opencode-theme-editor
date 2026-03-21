import type { ThemeTokenName, ThemeTokens } from '../theme/model'
import { THEME_TOKEN_NAMES } from '../theme/model'

const OPENCODE_THEME_SCHEMA = 'https://opencode.ai/theme.json'

type OpenCodeThemeSchema = typeof OPENCODE_THEME_SCHEMA

export type OpenCodeThemeFile = {
  $schema: OpenCodeThemeSchema
  theme: ThemeTokens
}

export type OpenCodeCombinedThemeFile = {
  $schema: OpenCodeThemeSchema
  theme: Record<ThemeTokenName, { dark: string; light: string }>
}

export function exportThemeFile(tokens: ThemeTokens): OpenCodeThemeFile {
  return {
    $schema: OPENCODE_THEME_SCHEMA,
    theme: tokens,
  }
}

export function exportCombinedThemeFile(darkTokens: ThemeTokens, lightTokens: ThemeTokens): OpenCodeCombinedThemeFile {
  const theme = {} as OpenCodeCombinedThemeFile['theme']

  for (const token of Object.keys(darkTokens) as ThemeTokenName[]) {
    theme[token] = {
      dark: darkTokens[token],
      light: lightTokens[token],
    }
  }

  return {
    $schema: OPENCODE_THEME_SCHEMA,
    theme,
  }
}

export function expandCombinedThemeFile(themeFile: OpenCodeCombinedThemeFile) {
  const dark = {} as ThemeTokens
  const light = {} as ThemeTokens

  for (const token of THEME_TOKEN_NAMES) {
    dark[token] = themeFile.theme[token].dark
    light[token] = themeFile.theme[token].light
  }

  return {
    dark,
    light,
  } satisfies Record<'dark' | 'light', ThemeTokens>
}

export function serializeThemeFile(theme: OpenCodeThemeFile | OpenCodeCombinedThemeFile) {
  return `${JSON.stringify(theme, null, 2)}\n`
}
