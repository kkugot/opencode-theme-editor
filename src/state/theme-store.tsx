import { useMemo, useReducer, type PropsWithChildren } from 'react'
import { createDefaultThemeDraft } from '../domain/theme/createDefaultThemeDraft'
import type { ThemeDraft } from '../domain/theme/model'
import { getSystemPreferredThemeMode } from './systemThemeMode'
import { ThemeStoreContext, type ThemeStoreAction } from './theme-store-context'

function themeReducer(state: ThemeDraft, action: ThemeStoreAction): ThemeDraft {
  switch (action.type) {
    case 'hydrate-draft':
      return action.draft
    case 'set-draft-name':
      return {
        ...state,
        name: action.name,
      }
    case 'set-active-mode':
      return {
        ...state,
        activeMode: action.mode,
      }
    case 'replace-mode-draft':
      return {
        ...state,
        modes: {
          ...state.modes,
          [action.mode]: action.modeDraft,
        },
      }
    case 'set-semantic-group':
      return {
        ...state,
        modes: {
          ...state.modes,
          [action.mode]: {
            ...state.modes[action.mode],
            semanticGroups: {
              ...state.modes[action.mode].semanticGroups,
              [action.group]: action.value,
            },
          },
        },
      }
    case 'set-token-override':
      return {
        ...state,
        modes: {
          ...state.modes,
          [action.mode]: {
            ...state.modes[action.mode],
            tokenOverrides: {
              ...state.modes[action.mode].tokenOverrides,
              [action.token]: action.value,
            },
          },
        },
      }
    case 'reset-token-override': {
      const nextOverrides = { ...state.modes[action.mode].tokenOverrides }
      delete nextOverrides[action.token]

      return {
        ...state,
        modes: {
          ...state.modes,
          [action.mode]: {
            ...state.modes[action.mode],
            tokenOverrides: nextOverrides,
          },
        },
      }
    }
  }
}

export function ThemeStoreProvider({ children }: PropsWithChildren) {
  const [draft, dispatch] = useReducer(themeReducer, undefined, () => createDefaultThemeDraft(getSystemPreferredThemeMode()))

  const value = useMemo(() => ({ draft, dispatch }), [draft])

  return <ThemeStoreContext.Provider value={value}>{children}</ThemeStoreContext.Provider>
}
