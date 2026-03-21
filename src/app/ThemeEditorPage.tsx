import { useEffect, useMemo, useState } from 'react'
import { serializeThemeFile } from '../domain/opencode/exportTheme'
import {
  THEME_PRESETS,
  applyThemePresetToDraft,
  createRandomSemanticModeSelection,
  createSemanticModeSelectionFromPalette,
  extractStablePaletteFromThemes,
  extractPaletteFromThemeTokens,
  remixThemePreset,
  type RemixStrength,
  type ThemePreset,
} from '../domain/presets/themePresets'
import { ThemeEditorTabBar } from './ThemeEditorTabBar'
import { applyJsonModeThemes, getInitialEditorTab, type EditorTab } from './themeEditorPageHelpers'
import { useThemeEditorViewModel } from './useThemeEditorViewModel'
import { AdvancedTokenEditor } from '../features/editor/AdvancedTokenEditor'
import { JsonThemeEditor } from '../features/editor/JsonThemeEditor'
import { ModeSelector } from '../features/editor/ModeSelector'
import { ThemePresetPicker } from '../features/editor/ThemePresetPicker'
import { ThemeActionMenu } from '../features/export/ThemeActionMenu'
import { downloadThemeFile } from '../features/export/downloadThemeFile'
import { SemanticColorEditor } from '../features/editor/SemanticColorEditor'
import { PreviewSurface } from '../features/preview/PreviewSurface'
import { selectExportThemeFile, selectResolvedMode, selectSemanticGroupAffectedTokens } from '../state/selectors'
import { useThemeDraft, useThemeStoreActions } from '../state/theme-store-hooks'

export function ThemeEditorPage() {
  const draft = useThemeDraft()
  const isLightMode = draft.activeMode === 'light'
  const [editorTab, setEditorTab] = useState<EditorTab>(() => getInitialEditorTab(window.location))
  const [selectedPresetOrigin, setSelectedPresetOrigin] = useState<ThemePreset | null>(null)
  const [selectedPresetPreview, setSelectedPresetPreview] = useState<ThemePreset | null>(null)
  const [basicRandomPalette, setBasicRandomPalette] = useState<string[] | null>(null)
  const [basicRandomVariationSeed, setBasicRandomVariationSeed] = useState<number | null>(null)
  const { hydrateDraft, setActiveMode, setDraftName, setSemanticGroup, setTokenOverride, resetTokenOverride, replaceModeDraft } =
    useThemeStoreActions()
  const { previewModel, editorSemanticGroups, derivedTokens, resolvedTokens, tokenNames, activeModeThemeFile, combinedThemeFile, themeSlug } =
    useThemeEditorViewModel(draft)
  const stableDraftPalette = useMemo(
    () =>
      extractStablePaletteFromThemes({
        dark: selectResolvedMode(draft, 'dark'),
        light: selectResolvedMode(draft, 'light'),
      }),
    [draft],
  )
  const mixerPalette = selectedPresetPreview?.palette ?? basicRandomPalette ?? stableDraftPalette ?? extractPaletteFromThemeTokens(resolvedTokens)

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

  function applyPreset(preset: ThemePreset) {
    setBasicRandomPalette(null)
    setBasicRandomVariationSeed(null)
    setSelectedPresetOrigin(preset)
    setSelectedPresetPreview(preset)
    hydrateDraft(applyThemePresetToDraft(preset, draft))
  }

  function remixSelectedPreset(strength: RemixStrength) {
    if (!selectedPresetPreview?.palette) {
      return
    }

    const remixedPreset = remixThemePreset(selectedPresetPreview, {
      remixStrength: strength,
    })

    setSelectedPresetPreview(remixedPreset)
    hydrateDraft(applyThemePresetToDraft(remixedPreset, draft))
  }

  function undoPresetRemix() {
    if (!selectedPresetOrigin) {
      return
    }

    setSelectedPresetPreview(selectedPresetOrigin)
    hydrateDraft(applyThemePresetToDraft(selectedPresetOrigin, draft))
  }

  function applyMixerPalette(palette: string[], variationSeed?: number, name?: string) {
    const darkSelection = createSemanticModeSelectionFromPalette('dark', palette, {
      variationSeed,
    })
    const lightSelection = createSemanticModeSelectionFromPalette('light', palette, {
      variationSeed,
    })

    setBasicRandomPalette(palette)
    setBasicRandomVariationSeed(darkSelection.variationSeed)
    setDraftName(name ?? darkSelection.name)
    setSelectedPresetOrigin(null)
    setSelectedPresetPreview(null)
    hydrateDraft({
      ...draft,
      name: name ?? darkSelection.name,
      modes: {
        dark: darkSelection.modeDraft,
        light: lightSelection.modeDraft,
      },
    })
  }

  function randomizeActiveMode() {
    const selection = createRandomSemanticModeSelection(draft.activeMode)

    applyMixerPalette(selection.palette, selection.variationSeed, selection.name)
  }

  function updateRandomPaletteColor(index: number, value: string) {
    const currentPalette = selectedPresetPreview?.palette ?? basicRandomPalette

    if (!currentPalette || index < 0 || index >= currentPalette.length) {
      return
    }

    const nextPalette = currentPalette.map((color, colorIndex) => (colorIndex === index ? value : color))

    applyMixerPalette(nextPalette, basicRandomVariationSeed ?? undefined)
  }

  function toggleActiveMode() {
    setActiveMode(isLightMode ? 'dark' : 'light')
  }

  return (
    <main className="app-shell">
      <div className="app-backdrop" aria-hidden="true" />

      <aside className="editor-pane">
        <div className="editor-section-header">
          <div className="editor-rail-header">
            <div className="editor-identity">
              <div className="editor-identity-topline">
                <div className="editor-theme-title-field">
                  <div className="editor-theme-title-meta">
                    <ModeSelector activeMode={draft.activeMode} onChange={setActiveMode} />
                    <button
                      type="button"
                      className="editor-identity-kicker editor-identity-kicker-button"
                      aria-label={isLightMode ? 'Switch to dark mode' : 'Switch to light mode'}
                      title={isLightMode ? 'Switch to dark mode' : 'Switch to light mode'}
                      onClick={toggleActiveMode}
                    >
                      Theme
                    </button>
                  </div>
                  <input
                    id="editor-theme-name"
                    type="text"
                    className="editor-theme-title-input"
                    value={draft.name}
                    placeholder="Untitled theme"
                    spellCheck={false}
                    aria-label="Theme name"
                    onChange={(event) => {
                      setDraftName(event.target.value)
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="editor-rail-controls">
              <div className="editor-tab-row">
                <ThemeEditorTabBar activeTab={editorTab} onTabChange={setEditorTab} />
              </div>
            </div>
          </div>
        </div>

        <div className={editorTab === 'json' ? 'editor-stack editor-stack-json' : 'editor-stack'}>
          {editorTab === 'presets' ? (
            <ThemePresetPicker
              activeMode={draft.activeMode}
              presets={THEME_PRESETS}
              selectedPresetId={selectedPresetPreview?.id ?? null}
              selectedPresetPreview={selectedPresetPreview}
              canRemixSelectedPreset={Boolean(selectedPresetPreview?.palette)}
              canUndoSelectedPreset={Boolean(
                selectedPresetOrigin && selectedPresetPreview && selectedPresetOrigin !== selectedPresetPreview,
              )}
              onApplyPreset={applyPreset}
              onRemixSelectedPreset={remixSelectedPreset}
              onUndoSelectedPreset={undoPresetRemix}
            />
          ) : editorTab === 'basic' ? (
            <SemanticColorEditor
              activeMode={draft.activeMode}
              semanticGroups={editorSemanticGroups}
              randomPalette={mixerPalette}
              onRandomize={randomizeActiveMode}
              onChangeRandomPaletteColor={updateRandomPaletteColor}
              onChange={(group, value) => {
                setSemanticGroup(draft.activeMode, group, value)

                for (const token of selectSemanticGroupAffectedTokens(group)) {
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
          ) : editorTab === 'save' ? (
            <ThemeActionMenu
              themeSlug={themeSlug}
              themeFile={combinedThemeFile}
              onDownloadDark={() => exportMode('dark')}
              onDownloadLight={() => exportMode('light')}
              onDownloadCombined={exportCombined}
            />
          ) : (
            <JsonThemeEditor
              themeFile={activeModeThemeFile}
              combinedThemeFile={combinedThemeFile}
              tokenNames={tokenNames}
              activeMode={draft.activeMode}
              onChange={(modeThemes) => {
                applyJsonModeThemes(draft, tokenNames, modeThemes, replaceModeDraft)
              }}
            />
          )}
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
