import { createContext, type Dispatch } from 'react'
import type { SemanticGroupName, ThemeDraft, ThemeMode, ThemeModeDraft, ThemeTokenName } from '../domain/theme/model'

export type ThemeStoreAction =
  | { type: 'hydrate-draft'; draft: ThemeDraft }
  | { type: 'set-active-mode'; mode: ThemeMode }
  | { type: 'replace-mode-draft'; mode: ThemeMode; modeDraft: ThemeModeDraft }
  | { type: 'set-semantic-group'; mode: ThemeMode; group: SemanticGroupName; value: string }
  | { type: 'set-token-override'; mode: ThemeMode; token: ThemeTokenName; value: string }
  | { type: 'reset-token-override'; mode: ThemeMode; token: ThemeTokenName }

export type ThemeStoreValue = {
  draft: ThemeDraft
  dispatch: Dispatch<ThemeStoreAction>
}

export const ThemeStoreContext = createContext<ThemeStoreValue | null>(null)
