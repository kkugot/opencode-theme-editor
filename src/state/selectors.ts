import { buildPreviewModel } from '../domain/preview/buildPreviewModel'
import { exportThemeFile } from '../domain/opencode/exportTheme'
import { resolveThemeMode } from '../domain/theme/resolveThemeMode'
import { analyzeContrast } from '../domain/validation/analyzeContrast'
import type { SemanticGroupName, ThemeDraft, ThemeMode, ThemeModeDraft, ThemeTokenName } from '../domain/theme/model'

const semanticGroupLinkedTokens = {
  canvas: ['background'],
  panel: ['backgroundPanel'],
  text: ['text'],
  muted: ['textMuted'],
  accent: ['primary', 'accent'],
  success: ['success'],
  warning: ['warning'],
  danger: ['error'],
} satisfies Record<SemanticGroupName, ThemeTokenName[]>

function selectSemanticGroupColor(modeDraft: ThemeModeDraft, group: SemanticGroupName) {
  for (const token of semanticGroupLinkedTokens[group]) {
    const override = modeDraft.tokenOverrides[token]

    if (override !== undefined) {
      return override
    }
  }

  return modeDraft.semanticGroups[group]
}

export function selectActiveModeDraft(draft: ThemeDraft) {
  return draft.modes[draft.activeMode]
}

export function selectResolvedActiveMode(draft: ThemeDraft) {
  return resolveThemeMode(selectActiveModeDraft(draft))
}

export function selectResolvedMode(draft: ThemeDraft, mode: ThemeMode) {
  return resolveThemeMode(draft.modes[mode])
}

export function selectEditorSemanticGroups(draft: ThemeDraft, mode: ThemeMode) {
  const modeDraft = draft.modes[mode]

  return {
    canvas: selectSemanticGroupColor(modeDraft, 'canvas'),
    panel: selectSemanticGroupColor(modeDraft, 'panel'),
    text: selectSemanticGroupColor(modeDraft, 'text'),
    muted: selectSemanticGroupColor(modeDraft, 'muted'),
    accent: selectSemanticGroupColor(modeDraft, 'accent'),
    success: selectSemanticGroupColor(modeDraft, 'success'),
    warning: selectSemanticGroupColor(modeDraft, 'warning'),
    danger: selectSemanticGroupColor(modeDraft, 'danger'),
  }
}

export function selectSemanticGroupLinkedTokens(group: SemanticGroupName) {
  return semanticGroupLinkedTokens[group]
}

export function selectPreviewModel(draft: ThemeDraft) {
  return buildPreviewModel({
    mode: draft.activeMode,
    draftName: draft.name,
    tokens: selectResolvedActiveMode(draft),
  })
}

export function selectExportThemeFile(draft: ThemeDraft, mode: ThemeMode) {
  return exportThemeFile(selectResolvedMode(draft, mode))
}

export function selectContrastWarnings(draft: ThemeDraft, mode: ThemeMode) {
  return analyzeContrast(selectResolvedMode(draft, mode))
}
