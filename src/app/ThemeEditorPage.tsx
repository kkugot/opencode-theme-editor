import { useEffect, useMemo, useRef, useState } from 'react'
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
import { ThemeImportGuide } from '../features/editor/ThemeImportGuide'
import { PreviewSurface } from '../features/preview/PreviewSurface'
import type { ThemeDraft, ThemeTokenName } from '../domain/theme/model'
import { selectExportThemeFile, selectResolvedMode, selectSemanticGroupAffectedTokens } from '../state/selectors'
import { useThemeDraft, useThemeStoreActions } from '../state/theme-store-hooks'
import type { HydratedDraftSource } from '../state/hydrateDraft'

type ThemeEditorPageProps = {
  startupSource?: HydratedDraftSource | null
}

type MixerHistoryEntry = {
  draft: ThemeDraft
  basicRandomPalette: string[] | null
  basicRandomVariationSeed: number | null
  manualTokenEdits: Record<'dark' | 'light', ThemeTokenName[]>
  selectedPresetOrigin: ThemePreset | null
  selectedPresetPreview: ThemePreset | null
  selectedPresetRemixHistory: ThemePreset[]
}

type MixerActionHistory = 'none' | 'generate' | 'shuffle'

const EMPTY_MANUAL_TOKEN_EDITS = {
  dark: [],
  light: [],
} satisfies Record<'dark' | 'light', ThemeTokenName[]>

function pickRandomPreset(presets: ThemePreset[]) {
  if (presets.length === 0) {
    return null
  }

  const randomIndex = Math.floor(Math.random() * presets.length)

  return presets[randomIndex] ?? null
}

export function ThemeEditorPage({ startupSource = null }: ThemeEditorPageProps) {
  const draft = useThemeDraft()
  const isLightMode = draft.activeMode === 'light'
  const [editorTab, setEditorTab] = useState<EditorTab>(() => getInitialEditorTab(window.location))
  const [presetToolbarPortalTarget, setPresetToolbarPortalTarget] = useState<HTMLDivElement | null>(null)
  const [selectedPresetOrigin, setSelectedPresetOrigin] = useState<ThemePreset | null>(null)
  const [selectedPresetPreview, setSelectedPresetPreview] = useState<ThemePreset | null>(null)
  const [selectedPresetRemixHistory, setSelectedPresetRemixHistory] = useState<ThemePreset[]>([])
  const [manualTokenEdits, setManualTokenEdits] = useState<Record<'dark' | 'light', ThemeTokenName[]>>(EMPTY_MANUAL_TOKEN_EDITS)
  const [basicRandomPalette, setBasicRandomPalette] = useState<string[] | null>(null)
  const [basicRandomVariationSeed, setBasicRandomVariationSeed] = useState<number | null>(null)
  const [generatedPaletteHistory, setGeneratedPaletteHistory] = useState<MixerHistoryEntry[]>([])
  const [shuffleHistory, setShuffleHistory] = useState<MixerHistoryEntry[]>([])
  const hasInitializedStartupPreset = useRef(false)
  const { hydrateDraft, setActiveMode, setDraftName, setSemanticGroup, setTokenOverride, resetTokenOverride, replaceModeDraft } =
    useThemeStoreActions()
  const { previewModel, editorSemanticGroups, derivedTokens, resolvedTokens, tokenNames, combinedThemeFile, themeSlug } =
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

  useEffect(() => {
    if (startupSource === 'shared' || startupSource === null || hasInitializedStartupPreset.current) {
      return
    }

    hasInitializedStartupPreset.current = true
    setEditorTab('presets')
    setGeneratedPaletteHistory([])
    setShuffleHistory([])

    const randomPreset = pickRandomPreset(THEME_PRESETS)

    if (!randomPreset) {
      return
    }

    setBasicRandomPalette(null)
    setBasicRandomVariationSeed(null)
    setSelectedPresetOrigin(randomPreset)
    setSelectedPresetPreview(randomPreset)
    setSelectedPresetRemixHistory([])
    setManualTokenEdits(EMPTY_MANUAL_TOKEN_EDITS)
    hydrateDraft(applyThemePresetToDraft(randomPreset, draft))
  }, [draft, hydrateDraft, startupSource])

  function resetManualTokenEdits() {
    setManualTokenEdits(EMPTY_MANUAL_TOKEN_EDITS)
  }

  function markManualTokenEdit(mode: 'dark' | 'light', token: ThemeTokenName) {
    setManualTokenEdits((current) => {
      if (current[mode].includes(token)) {
        return current
      }

      return {
        ...current,
        [mode]: [...current[mode], token],
      }
    })
  }

  function clearManualTokenEdit(mode: 'dark' | 'light', token: ThemeTokenName) {
    setManualTokenEdits((current) => {
      if (!current[mode].includes(token)) {
        return current
      }

      return {
        ...current,
        [mode]: current[mode].filter((currentToken) => currentToken !== token),
      }
    })
  }

  function exportMode(mode: 'dark' | 'light') {
    const themeFile = selectExportThemeFile(draft, mode)

    downloadThemeFile(`${themeSlug}.${mode}.json`, serializeThemeFile(themeFile))
  }

  function exportCombined() {
    downloadThemeFile(`${themeSlug}.json`, serializeThemeFile(combinedThemeFile))
  }

  function applyPreset(preset: ThemePreset) {
    setGeneratedPaletteHistory([])
    setShuffleHistory([])
    setBasicRandomPalette(null)
    setBasicRandomVariationSeed(null)
    setSelectedPresetOrigin(preset)
    setSelectedPresetPreview(preset)
    setSelectedPresetRemixHistory([])
    resetManualTokenEdits()
    hydrateDraft(applyThemePresetToDraft(preset, draft))
  }

  function remixSelectedPreset(strength: RemixStrength) {
    if (!selectedPresetPreview?.palette) {
      return
    }

    const remixedPreset = remixThemePreset(selectedPresetPreview, {
      remixStrength: strength,
    })

    setSelectedPresetRemixHistory((current) => [...current.slice(-11), selectedPresetPreview])
    resetManualTokenEdits()
    setSelectedPresetPreview(remixedPreset)
    hydrateDraft(applyThemePresetToDraft(remixedPreset, draft))
  }

  function undoPresetRemix() {
    const previousPreset = selectedPresetRemixHistory.at(-1)

    if (!previousPreset) {
      return
    }

    setSelectedPresetRemixHistory((current) => current.slice(0, -1))
    setSelectedPresetPreview(previousPreset)
    resetManualTokenEdits()
    hydrateDraft(applyThemePresetToDraft(previousPreset, draft))
  }

  function buildMixerHistoryEntry(): MixerHistoryEntry {
    return {
      draft,
      basicRandomPalette,
      basicRandomVariationSeed,
      manualTokenEdits,
      selectedPresetOrigin,
      selectedPresetPreview,
      selectedPresetRemixHistory,
    }
  }

  function restoreMixerHistoryEntry(entry: MixerHistoryEntry) {
    setBasicRandomPalette(entry.basicRandomPalette)
    setBasicRandomVariationSeed(entry.basicRandomVariationSeed)
    setManualTokenEdits(entry.manualTokenEdits)
    setSelectedPresetOrigin(entry.selectedPresetOrigin)
    setSelectedPresetPreview(entry.selectedPresetPreview)
    setSelectedPresetRemixHistory(entry.selectedPresetRemixHistory)
    hydrateDraft(entry.draft)
  }

  function applyMixerPalette(
    palette: string[],
    options: {
      variationSeed?: number
      name?: string
      remixStrength?: RemixStrength
      history?: MixerActionHistory
      resetShuffleHistory?: boolean
    } = {},
  ) {
    const history = options.history ?? 'none'

    if (history !== 'none') {
      const snapshot = buildMixerHistoryEntry()

      if (history === 'generate') {
        setGeneratedPaletteHistory((current) => [...current.slice(-11), snapshot])
      } else {
        setShuffleHistory((current) => [...current.slice(-11), snapshot])
      }
    }

    if (options.resetShuffleHistory) {
      setShuffleHistory([])
    }

    const darkSelection = createSemanticModeSelectionFromPalette('dark', palette, {
      variationSeed: options.variationSeed,
      remixStrength: options.remixStrength,
    })
    const lightSelection = createSemanticModeSelectionFromPalette('light', palette, {
      variationSeed: options.variationSeed,
      remixStrength: options.remixStrength,
    })
    const nextName = options.name ?? darkSelection.name

    setBasicRandomPalette(palette)
    setBasicRandomVariationSeed(darkSelection.variationSeed)
    setDraftName(nextName)
    setSelectedPresetOrigin(null)
    setSelectedPresetPreview(null)
    setSelectedPresetRemixHistory([])
    resetManualTokenEdits()
    hydrateDraft({
      ...draft,
      name: nextName,
      modes: {
        dark: darkSelection.modeDraft,
        light: lightSelection.modeDraft,
      },
    })
  }

  function randomizeActiveMode() {
    const selection = createRandomSemanticModeSelection(draft.activeMode)

    applyMixerPalette(selection.palette, {
      variationSeed: selection.variationSeed,
      name: selection.name,
      history: 'generate',
      resetShuffleHistory: true,
    })
  }

  function remixMixerPalette(strength: RemixStrength) {
    const palette = selectedPresetPreview?.palette ?? basicRandomPalette ?? stableDraftPalette ?? extractPaletteFromThemeTokens(resolvedTokens)
    const variationSeed = (basicRandomVariationSeed ?? Date.now()) ^ Math.floor(Math.random() * 0xffffffff)

    applyMixerPalette(palette, {
      variationSeed,
      remixStrength: strength,
      name: draft.name,
      history: 'shuffle',
    })
  }

  function undoGeneratedPalette() {
    const previousState = generatedPaletteHistory.at(-1)

    if (!previousState) {
      return
    }

    setGeneratedPaletteHistory((current) => current.slice(0, -1))
    setShuffleHistory([])
    restoreMixerHistoryEntry(previousState)
  }

  function undoShufflePalette() {
    const previousState = shuffleHistory.at(-1)

    if (!previousState) {
      return
    }

    setShuffleHistory((current) => current.slice(0, -1))
    restoreMixerHistoryEntry(previousState)
  }

  function updateRandomPaletteColor(index: number, value: string) {
    const currentPalette = selectedPresetPreview?.palette ?? basicRandomPalette

    if (!currentPalette || index < 0 || index >= currentPalette.length) {
      return
    }

    const nextPalette = currentPalette.map((color, colorIndex) => (colorIndex === index ? value : color))

    applyMixerPalette(nextPalette, {
      variationSeed: basicRandomVariationSeed ?? undefined,
      resetShuffleHistory: true,
    })
  }

  function toggleActiveMode() {
    setActiveMode(isLightMode ? 'dark' : 'light')
  }

  const editorContentClassName =
    editorTab === 'presets' ? 'editor-content-pane editor-content-pane-with-toolbar' : 'editor-content-pane'
  const editorStackClassName =
    editorTab === 'json'
      ? 'editor-stack editor-stack-json'
      : editorTab === 'presets'
        ? 'editor-stack editor-stack-presets'
        : 'editor-stack'

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

        <div className={editorContentClassName}>
          {editorTab === 'presets' ? (
            <div
              ref={(element) => {
                setPresetToolbarPortalTarget(element)
              }}
              className="editor-pane-toolbar-slot"
            />
          ) : null}

          <div className={editorStackClassName}>
            {editorTab === 'presets' ? (
              <ThemePresetPicker
                activeMode={draft.activeMode}
                presets={THEME_PRESETS}
                toolbarPortalTarget={presetToolbarPortalTarget}
                selectedPresetId={selectedPresetPreview?.id ?? null}
                selectedPresetPreview={selectedPresetPreview}
                canRemixSelectedPreset={Boolean(selectedPresetPreview?.palette)}
                canUndoSelectedPreset={selectedPresetRemixHistory.length > 0}
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
                onShuffleRandomize={remixMixerPalette}
                onUndoGeneratedPalette={undoGeneratedPalette}
                onUndoShuffleRandomize={undoShufflePalette}
                canUndoGeneratedPalette={generatedPaletteHistory.length > 0}
                canUndoShuffleRandomize={shuffleHistory.length > 0}
                onChangeRandomPaletteColor={updateRandomPaletteColor}
                onChange={(group, value) => {
                  setSemanticGroup(draft.activeMode, group, value)

                  for (const token of selectSemanticGroupAffectedTokens(group)) {
                    clearManualTokenEdit(draft.activeMode, token)
                    resetTokenOverride(draft.activeMode, token)
                  }
                }}
              />
            ) : editorTab === 'full' ? (
              <AdvancedTokenEditor
                resolvedTokens={resolvedTokens}
                derivedTokens={derivedTokens}
                overrides={draft.modes[draft.activeMode].tokenOverrides}
                manuallyEditedTokens={manualTokenEdits[draft.activeMode]}
                onChange={(token, value) => {
                  markManualTokenEdit(draft.activeMode, token)
                  setTokenOverride(draft.activeMode, token, value)
                }}
                onReset={(token) => {
                  clearManualTokenEdit(draft.activeMode, token)
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
              <section className="json-advanced-panel panel-card">
                <div className="editor-groups">
                  <ThemeImportGuide />

                  <section className="editor-group">
                    <div className="editor-group-header">
                      <p className="editor-group-label">Current theme JSON</p>
                    </div>

                    <p className="editor-group-caption">
                      Edit the full dark and light bundle directly, or paste your current theme JSON here if you do not want to run the import-export script. The JSON updates as you edit.
                    </p>

                    <JsonThemeEditor
                      combinedThemeFile={combinedThemeFile}
                      tokenNames={tokenNames}
                      activeMode={draft.activeMode}
                      onChange={(modeThemes) => {
                        resetManualTokenEdits()
                        applyJsonModeThemes(draft, tokenNames, modeThemes, replaceModeDraft)
                      }}
                    />
                  </section>
                </div>
              </section>
            )}
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
