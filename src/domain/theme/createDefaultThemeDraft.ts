import type { ThemeDraft, ThemeMode, ThemeModeDraft } from './model'
import { generateSiblingMode } from './resolveThemeMode'

function createDarkMode(): ThemeModeDraft {
  return {
    semanticGroups: {
      canvas: '#0b1020',
      panel: '#121a2b',
      text: '#e5eefb',
      muted: '#8fa1c1',
      accent: '#68a8ff',
      success: '#4fd1a5',
      warning: '#f6c177',
      danger: '#ff7b72',
    },
    tokenOverrides: {},
  }
}

export function createDefaultThemeDraft(activeMode: ThemeMode = 'dark'): ThemeDraft {
  const dark = createDarkMode()
  const light = generateSiblingMode(dark, 'light')

  return {
    id: 'default-draft',
    name: 'Untitled',
    activeMode,
    modes: {
      dark,
      light,
    },
  }
}
