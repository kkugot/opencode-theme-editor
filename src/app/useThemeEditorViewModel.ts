import { useMemo } from 'react'
import type { ThemeDraft, ThemeTokenName } from '../domain/theme/model'
import { buildThemeSlug } from '../domain/theme/themeName'
import {
  selectDerivedMode,
  selectEditorSemanticGroups,
  selectExportCombinedThemeFile,
  selectExportThemeFile,
  selectPreviewModel,
  selectResolvedMode,
} from '../state/selectors'
import { buildThemeEditorFooterStyle } from './themeEditorPageHelpers'

export function useThemeEditorViewModel(draft: ThemeDraft) {
  const previewModel = useMemo(() => selectPreviewModel(draft), [draft])
  const editorSemanticGroups = useMemo(() => selectEditorSemanticGroups(draft, draft.activeMode), [draft])
  const derivedTokens = useMemo(() => selectDerivedMode(draft, draft.activeMode), [draft])
  const resolvedTokens = useMemo(() => selectResolvedMode(draft, draft.activeMode), [draft])
  const tokenNames = useMemo(() => Object.keys(resolvedTokens) as ThemeTokenName[], [resolvedTokens])
  const activeModeThemeFile = useMemo(() => selectExportThemeFile(draft, draft.activeMode), [draft])
  const combinedThemeFile = useMemo(() => selectExportCombinedThemeFile(draft), [draft])
  const themeSlug = useMemo(() => buildThemeSlug(draft.name), [draft.name])
  const footerStyle = useMemo(() => buildThemeEditorFooterStyle(resolvedTokens), [resolvedTokens])

  return {
    previewModel,
    editorSemanticGroups,
    derivedTokens,
    resolvedTokens,
    tokenNames,
    activeModeThemeFile,
    combinedThemeFile,
    themeSlug,
    footerStyle,
  }
}
