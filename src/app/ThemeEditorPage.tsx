import { useEffect, useMemo, useState } from 'react'
import type { ContrastWarning } from '../domain/validation/analyzeContrast'
import { serializeThemeFile } from '../domain/opencode/exportTheme'
import type { ThemeTokenName } from '../domain/theme/model'
import { AdvancedTokenEditor } from '../features/editor/AdvancedTokenEditor'
import { ContrastGuidance } from '../features/editor/ContrastGuidance'
import { JsonThemeEditor } from '../features/editor/JsonThemeEditor'
import { ExportPanel } from '../features/export/ExportPanel'
import { downloadThemeFile } from '../features/export/downloadThemeFile'
import { SemanticColorEditor } from '../features/editor/SemanticColorEditor'
import { PreviewSurface } from '../features/preview/PreviewSurface'
import { useDraftPersistenceStatus } from '../state/persistence-status'
import {
  selectContrastWarnings,
  selectEditorSemanticGroups,
  selectExportThemeFile,
  selectPreviewModel,
  selectResolvedMode,
  selectSemanticGroupLinkedTokens,
} from '../state/selectors'
import { useThemeDraft, useThemeStoreActions } from '../state/theme-store-hooks'

export function ThemeEditorPage() {
  const draft = useThemeDraft()
  const [editorTab, setEditorTab] = useState<'basic' | 'full' | 'json'>('basic')
  const { setActiveMode, setSemanticGroup, setTokenOverride, resetTokenOverride, replaceModeDraft } = useThemeStoreActions()
  const { status: autosaveStatus, savedAt } = useDraftPersistenceStatus()

  const previewModel = useMemo(() => selectPreviewModel(draft), [draft])
  const contrastWarnings = useMemo(() => selectContrastWarnings(draft, draft.activeMode), [draft])
  const editorSemanticGroups = useMemo(() => selectEditorSemanticGroups(draft, draft.activeMode), [draft])
  const resolvedTokens = useMemo(() => selectResolvedMode(draft, draft.activeMode), [draft])
  const tokenNames = useMemo(() => Object.keys(resolvedTokens) as ThemeTokenName[], [resolvedTokens])
  const activeModeThemeFile = useMemo(() => selectExportThemeFile(draft, draft.activeMode), [draft])
  const themeSlug = useMemo(
    () => draft.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'theme',
    [draft.name],
  )
  const [exportThemeName, setExportThemeName] = useState(themeSlug)
  const exportThemeSlug = useMemo(
    () => exportThemeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || themeSlug,
    [exportThemeName, themeSlug],
  )
  const autosaveMessage =
    autosaveStatus === 'idle'
      ? 'Draft not saved yet'
      : autosaveStatus === 'saving'
        ? 'Saving draft'
        : autosaveStatus === 'saved'
          ? `Draft saved locally${savedAt ? ` · ${savedAt}` : ''}`
          : 'Draft save failed'

  useEffect(() => {
    const root = document.documentElement

    root.dataset.uiMode = draft.activeMode

    return () => {
      delete root.dataset.uiMode
    }
  }, [draft.activeMode])

  function exportMode(mode: 'dark' | 'light') {
    const themeFile = selectExportThemeFile(draft, mode)

    downloadThemeFile(`${exportThemeSlug}.${mode}.json`, serializeThemeFile(themeFile))
  }

  function fixContrastIssue(warning: ContrastWarning) {
    switch (warning.id) {
      case 'muted-text':
        setTokenOverride(draft.activeMode, 'textMuted', draft.activeMode === 'dark' ? '#8e97a8' : '#5f6675')
        break
      case 'accent-text':
        setTokenOverride(draft.activeMode, 'accent', draft.activeMode === 'dark' ? '#9ecbff' : '#245d9c')
        break
      case 'diff-added':
        setTokenOverride(draft.activeMode, 'diffAdded', draft.activeMode === 'dark' ? '#b8f2cb' : '#1f6a3d')
        break
      case 'code-block':
        setTokenOverride(draft.activeMode, 'markdownCodeBlock', draft.activeMode === 'dark' ? '#f2d38f' : '#7a4d00')
        break
      case 'primary-text':
      case 'composer-text':
        setTokenOverride(draft.activeMode, 'text', draft.activeMode === 'dark' ? '#f3f6fb' : '#11161f')
        break
      default:
        break
    }
  }

  return (
    <main className="app-shell">
      <div className="app-backdrop" aria-hidden="true" />

      <aside className="editor-pane">
        <div className="editor-section-header">
          <div className="editor-tabs" role="tablist" aria-label="Editor section">
            <button
              type="button"
              role="tab"
              aria-selected={editorTab === 'basic'}
              className={editorTab === 'basic' ? 'editor-tab active' : 'editor-tab'}
              onClick={() => setEditorTab('basic')}
            >
              Basic
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={editorTab === 'full'}
              className={editorTab === 'full' ? 'editor-tab active' : 'editor-tab'}
              onClick={() => setEditorTab('full')}
            >
              Full
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={editorTab === 'json'}
              className={editorTab === 'json' ? 'editor-tab active' : 'editor-tab'}
              onClick={() => setEditorTab('json')}
            >
              Advanced
            </button>
          </div>
        </div>

        <div className="editor-stack">
          {editorTab === 'basic' ? (
            <SemanticColorEditor
              semanticGroups={editorSemanticGroups}
              onChange={(group, value) => {
                setSemanticGroup(draft.activeMode, group, value)

                for (const token of selectSemanticGroupLinkedTokens(group)) {
                  resetTokenOverride(draft.activeMode, token)
                }
              }}
            />
          ) : editorTab === 'full' ? (
            <AdvancedTokenEditor
              resolvedTokens={resolvedTokens}
              overrides={draft.modes[draft.activeMode].tokenOverrides}
              onChange={(token, value) => {
                setTokenOverride(draft.activeMode, token, value)
              }}
              onReset={(token) => {
                resetTokenOverride(draft.activeMode, token)
              }}
            />
          ) : (
            <JsonThemeEditor
              themeFile={activeModeThemeFile}
              tokenNames={tokenNames}
              onChange={(themeFile) => {
                const hasChanges = tokenNames.some((token) => activeModeThemeFile.theme[token] !== themeFile.theme[token])

                if (!hasChanges) {
                  return
                }

                replaceModeDraft(draft.activeMode, {
                  ...draft.modes[draft.activeMode],
                  tokenOverrides: themeFile.theme,
                })
              }}
            />
          )}
        </div>
      </aside>

      <section className="preview-pane">
        <div className="preview-stage">
          <PreviewSurface model={previewModel} onModeChange={setActiveMode} />
        </div>

        <div className="preview-save-status-row">
          <p className="editor-save-status preview-save-status" data-status={autosaveStatus} role="status" aria-live="polite">
            <span className="editor-save-indicator" aria-hidden="true" />
            {autosaveMessage}
          </p>
        </div>
      </section>

      <aside className="side-pane">
        <div className="side-pane-stack">
          {contrastWarnings.some((warning) => warning.severity !== 'good') ? (
            <ContrastGuidance warnings={contrastWarnings} onFix={fixContrastIssue} />
          ) : null}

          <ExportPanel
            themeName={exportThemeName}
            themeSlug={exportThemeSlug}
            onThemeNameChange={setExportThemeName}
            onExportDark={() => exportMode('dark')}
            onExportLight={() => exportMode('light')}
          />
        </div>
      </aside>
    </main>
  )
}
