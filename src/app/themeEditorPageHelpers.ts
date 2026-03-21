import type { CSSProperties } from 'react'
import { parseThemeShareLocation } from '../domain/share/themeShareLink'
import type { ThemeDraft, ThemeMode, ThemeModeDraft, ThemeTokenName, ThemeTokens } from '../domain/theme/model'
import type { JsonThemeModeUpdates } from '../features/editor/jsonThemeEditorParser'
import { selectExportThemeFile } from '../state/selectors'

export type EditorTab = 'presets' | 'basic' | 'full' | 'json' | 'save'

export const EDITOR_TAB_OPTIONS: Array<{ id: EditorTab; label: string }> = [
  { id: 'presets', label: 'Presets' },
  { id: 'basic', label: 'Mixer' },
  { id: 'full', label: 'Tuner' },
  { id: 'json', label: 'Advanced' },
  { id: 'save', label: 'Export' },
]

export function getInitialEditorTab(location: { search: string; hash: string }) {
  return parseThemeShareLocation(location) ? 'full' : 'presets'
}

const MODE_ORDER: ThemeMode[] = ['dark', 'light']

export function buildThemeEditorFooterStyle(resolvedTokens: ThemeTokens) {
  return {
    ['--download-control-panel' as string]: resolvedTokens.backgroundPanel,
    ['--download-control-surface' as string]: resolvedTokens.backgroundElement,
    ['--download-control-border' as string]: resolvedTokens.borderSubtle,
    ['--download-control-text' as string]: resolvedTokens.text,
    ['--download-control-muted' as string]: resolvedTokens.textMuted,
    ['--download-control-accent' as string]: resolvedTokens.primary,
    ['--download-control-glow' as string]: resolvedTokens.accent,
    ['--download-button-bg' as string]: resolvedTokens.backgroundElement,
    ['--download-button-border' as string]: resolvedTokens.primary,
    ['--download-button-text' as string]: resolvedTokens.text,
    ['--preview-meta-text' as string]: resolvedTokens.textMuted,
    ['--preview-meta-divider' as string]: resolvedTokens.borderSubtle,
    ['--preview-meta-link' as string]: resolvedTokens.text,
  } as CSSProperties
}

export function applyJsonModeThemes(
  draft: ThemeDraft,
  tokenNames: ThemeTokenName[],
  modeThemes: JsonThemeModeUpdates,
  replaceModeDraft: (mode: ThemeMode, modeDraft: ThemeModeDraft) => void,
) {
  for (const mode of MODE_ORDER) {
    const modeTheme = modeThemes[mode]

    if (!modeTheme) {
      continue
    }

    const currentThemeFile = selectExportThemeFile(draft, mode)
    const hasChanges = tokenNames.some((token) => currentThemeFile.theme[token] !== modeTheme[token])

    if (!hasChanges) {
      continue
    }

    replaceModeDraft(mode, {
      ...draft.modes[mode],
      tokenOverrides: modeTheme,
    })
  }
}
