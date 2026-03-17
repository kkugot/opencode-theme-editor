import type { ThemeTokens } from '../theme/model'

export type OpenCodeThemeFile = {
  $schema: 'https://opencode.ai/theme.json'
  theme: ThemeTokens
}

export function exportThemeFile(tokens: ThemeTokens): OpenCodeThemeFile {
  return {
    $schema: 'https://opencode.ai/theme.json',
    theme: tokens,
  }
}

export function serializeThemeFile(theme: OpenCodeThemeFile) {
  return `${JSON.stringify(theme, null, 2)}\n`
}
