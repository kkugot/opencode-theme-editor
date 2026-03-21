import type { ThemeDraft, ThemeMode, ThemeModeDraft, ThemeTokens } from './model'
import { areColorValuesEqual } from './color'
import { resolveThemeMode } from './resolveThemeMode'

function createModeDraftFromTokens(tokens: ThemeTokens): ThemeModeDraft {
  const semanticGroups = {
    canvas: tokens.background,
    panel: tokens.backgroundPanel,
    text: tokens.text,
    muted: tokens.textMuted,
    accent: tokens.primary,
    success: tokens.success,
    warning: tokens.warning,
    danger: tokens.error,
  }

  const derivedTokens = resolveThemeMode({
    semanticGroups,
    tokenOverrides: {},
  })

  const tokenOverrides = Object.fromEntries(
    Object.entries(tokens).filter(([token, value]) => !areColorValuesEqual(value, derivedTokens[token as keyof ThemeTokens])),
  )

  return {
    semanticGroups,
    tokenOverrides,
  }
}

type CreateDraftFromResolvedThemesInput = {
  id: string
  name: string
  activeMode: ThemeMode
  themes: Record<ThemeMode, ThemeTokens>
}

export function createDraftFromResolvedThemes({
  id,
  name,
  activeMode,
  themes,
}: CreateDraftFromResolvedThemesInput): ThemeDraft {
  return {
    id,
    name,
    activeMode,
    modes: {
      dark: createModeDraftFromTokens(themes.dark),
      light: createModeDraftFromTokens(themes.light),
    },
  }
}
