import type { ThemeTokenName, ThemeTokens } from '../theme/model'

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

export function serializeThemeFile(theme: OpenCodeThemeFile | OpenCodeCombinedThemeFile) {
  return `${JSON.stringify(theme, null, 2)}\n`
}
