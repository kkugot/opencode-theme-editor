import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { serializeThemeFile } from '../domain/opencode/exportTheme'
import type { ThemeMode, ThemeTokenName } from '../domain/theme/model'
import { AdvancedTokenEditor } from '../features/editor/AdvancedTokenEditor'
import { JsonThemeEditor } from '../features/editor/JsonThemeEditor'
import { DownloadMenu } from '../features/export/DownloadMenu'
import { downloadThemeFile } from '../features/export/downloadThemeFile'
import { SemanticColorEditor } from '../features/editor/SemanticColorEditor'
import { PreviewSurface } from '../features/preview/PreviewSurface'
import { useDraftPersistenceStatus } from '../state/persistence-status'
import {
  selectDerivedMode,
  selectExportCombinedThemeFile,
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
  const { setActiveMode, setDraftName, setSemanticGroup, setTokenOverride, resetTokenOverride, replaceModeDraft } =
    useThemeStoreActions()
  const { status: autosaveStatus, savedAt } = useDraftPersistenceStatus()

  const previewModel = useMemo(() => selectPreviewModel(draft), [draft])
  const editorSemanticGroups = useMemo(() => selectEditorSemanticGroups(draft, draft.activeMode), [draft])
  const derivedTokens = useMemo(() => selectDerivedMode(draft, draft.activeMode), [draft])
  const resolvedTokens = useMemo(() => selectResolvedMode(draft, draft.activeMode), [draft])
  const tokenNames = useMemo(() => Object.keys(resolvedTokens) as ThemeTokenName[], [resolvedTokens])
  const activeModeThemeFile = useMemo(() => selectExportThemeFile(draft, draft.activeMode), [draft])
  const combinedThemeFile = useMemo(() => selectExportCombinedThemeFile(draft), [draft])
  const themeSlug = useMemo(
    () => draft.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'untitled',
    [draft.name],
  )
  const footerStyle = useMemo(
    () =>
      ({
        ['--download-button-bg' as string]: resolvedTokens.backgroundElement,
        ['--download-button-border' as string]: resolvedTokens.primary,
        ['--download-button-text' as string]: resolvedTokens.accent,
      }) as CSSProperties,
    [resolvedTokens],
  )
  const autosaveMessage =
    autosaveStatus === 'idle'
      ? 'Draft not saved yet'
      : autosaveStatus === 'saving'
        ? 'Saving draft'
        : autosaveStatus === 'saved'
          ? `Draft saved locally${savedAt ? ` at ${savedAt}` : ''}`
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

    downloadThemeFile(`${themeSlug}.${mode}.json`, serializeThemeFile(themeFile))
  }

  function exportCombined() {
    downloadThemeFile(`${themeSlug}.json`, serializeThemeFile(combinedThemeFile))
  }

  return (
    <main className="app-shell">
      <div className="app-backdrop" aria-hidden="true" />

      <aside className="editor-pane">
        <div className="editor-section-header">
          <div className="editor-theme-controls">
            <div className="editor-theme-file-row">
              <input
                id="theme-file-name"
                type="text"
                className="editor-theme-file-input"
                value={draft.name}
                placeholder="untitled"
                spellCheck={false}
                onChange={(event) => {
                  setDraftName(event.target.value)
                }}
                aria-label="Theme file name"
              />
              <span className="editor-theme-file-ext" aria-hidden="true">
                .json
              </span>
            </div>

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
              derivedTokens={derivedTokens}
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
              combinedThemeFile={combinedThemeFile}
              tokenNames={tokenNames}
              activeMode={draft.activeMode}
              onChange={(modeThemes) => {
                const modeOrder: ThemeMode[] = ['dark', 'light']

                for (const mode of modeOrder) {
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
              }}
            />
          )}
        </div>

        <div className="editor-pane-footer" style={footerStyle}>
          <DownloadMenu
            themeSlug={themeSlug}
            onDownloadDark={() => exportMode('dark')}
            onDownloadLight={() => exportMode('light')}
            onDownloadCombined={exportCombined}
          />

          <div className="editor-footer-meta">
            <p
              className="editor-save-status editor-footer-save-status"
              data-status={autosaveStatus}
              role="status"
              aria-live="polite"
            >
              {autosaveMessage}
            </p>

            <a
              className="editor-footer-project-link"
              href="https://github.com/kkugot/opencode-theme-editor"
              target="_blank"
              rel="noreferrer"
            >
              GitHub project
            </a>
          </div>
        </div>
      </aside>

      <section className="preview-pane">
        <div className="preview-stage">
          <PreviewSurface model={previewModel} onModeChange={setActiveMode} />
        </div>
      </section>
    </main>
  )
}
