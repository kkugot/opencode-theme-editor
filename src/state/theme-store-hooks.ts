import { useContext, useMemo } from 'react'
import type { SemanticGroupName, ThemeMode, ThemeModeDraft, ThemeDraft, ThemeTokenName } from '../domain/theme/model'
import { ThemeStoreContext } from './theme-store-context'

function useThemeStoreValue() {
  const value = useContext(ThemeStoreContext)

  if (!value) {
    throw new Error('ThemeStoreProvider is missing')
  }

  return value
}

export function useThemeDraft() {
  return useThemeStoreValue().draft
}

export function useThemeStoreActions() {
  const { dispatch } = useThemeStoreValue()

  return useMemo(
    () => ({
      hydrateDraft(draft: ThemeDraft) {
        dispatch({ type: 'hydrate-draft', draft })
      },
      setActiveMode(mode: ThemeMode) {
        dispatch({ type: 'set-active-mode', mode })
      },
      replaceModeDraft(mode: ThemeMode, modeDraft: ThemeModeDraft) {
        dispatch({ type: 'replace-mode-draft', mode, modeDraft })
      },
      setSemanticGroup(mode: ThemeMode, group: SemanticGroupName, value: string) {
        dispatch({ type: 'set-semantic-group', mode, group, value })
      },
      setTokenOverride(mode: ThemeMode, token: ThemeTokenName, value: string) {
        dispatch({ type: 'set-token-override', mode, token, value })
      },
      resetTokenOverride(mode: ThemeMode, token: ThemeTokenName) {
        dispatch({ type: 'reset-token-override', mode, token })
      },
    }),
    [dispatch],
  )
}
