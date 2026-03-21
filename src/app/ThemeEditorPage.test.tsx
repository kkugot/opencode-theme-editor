import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useEffect, type ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createDefaultThemeDraft } from '../domain/theme/createDefaultThemeDraft'
import type { ThemeDraft } from '../domain/theme/model'
import { resolveThemeMode } from '../domain/theme/resolveThemeMode'
import { ThemeStoreProvider } from '../state/theme-store'
import { useThemeStoreActions } from '../state/theme-store-hooks'
import { ThemeEditorPage } from './ThemeEditorPage'

const mockState = vi.hoisted(() => ({
  downloadThemeFile: vi.fn(),
  jsonModeThemes: {} as Record<string, unknown>,
}))

vi.mock('../domain/presets/themePresets', () => ({
  REMIX_STRENGTHS: ['subtle', 'balanced', 'wild'],
  THEME_PRESETS: [],
  applyThemePresetToDraft: (_preset: unknown, draft: ThemeDraft) => draft,
  createRandomSemanticModeSelection: (mode: 'dark' | 'light') => ({
    name: 'Randomized',
    palette: ['#112233', '#445566', '#778899'],
    variationSeed: 123,
    modeDraft: {
      semanticGroups: {
        canvas: mode === 'dark' ? '#0b1020' : '#f7f9fc',
        panel: mode === 'dark' ? '#121a2b' : '#e9eef5',
        text: mode === 'dark' ? '#e5eefb' : '#102030',
        muted: mode === 'dark' ? '#8fa1c1' : '#607080',
        accent: '#68a8ff',
        success: '#4fd1a5',
        warning: '#f6c177',
        danger: '#ff7b72',
      },
      tokenOverrides: {},
    },
  }),
  createSemanticModeSelectionFromPalette: (mode: 'dark' | 'light') => ({
    name: 'Edited Randomized',
    palette: ['#334455'],
    variationSeed: 123,
    modeDraft: {
      semanticGroups: {
        canvas: mode === 'dark' ? '#334455' : '#ddeeff',
        panel: mode === 'dark' ? '#121a2b' : '#f0f4f8',
        text: mode === 'dark' ? '#e5eefb' : '#223344',
        muted: mode === 'dark' ? '#8fa1c1' : '#6b7b8c',
        accent: '#68a8ff',
        success: '#4fd1a5',
        warning: '#f6c177',
        danger: '#ff7b72',
      },
      tokenOverrides: {},
    },
  }),
  extractStablePaletteFromThemes: () => ['#220033', '#445566', '#778899'],
  extractPaletteFromThemeTokens: () => ['#221122', '#774455', '#ddbbee'],
  remixThemePreset: (preset: unknown) => preset,
}))

vi.mock('../features/editor/ThemePresetPicker', () => ({
  ThemePresetPicker: ({ onApplyPreset }: { onApplyPreset: (preset: { id: string }) => void }) => (
    <div data-testid="preset-picker">
      preset picker
      <button
        type="button"
        onClick={() => {
          onApplyPreset({ id: 'aura' })
        }}
      >
        apply preset
      </button>
    </div>
  ),
}))

vi.mock('../features/editor/SemanticColorEditor', () => ({
  SemanticColorEditor: ({
    semanticGroups,
    randomPalette,
    onChange,
    onRandomize,
    onChangeRandomPaletteColor,
  }: {
    semanticGroups: Record<string, string>
    randomPalette: string[]
    onChange: (group: 'canvas', value: string) => void
    onRandomize: () => void
    onChangeRandomPaletteColor: (index: number, value: string) => void
  }) => (
    <div data-testid="semantic-editor">
      <span data-testid="semantic-canvas">{semanticGroups.canvas}</span>
      <span data-testid="random-palette-size">{randomPalette.length}</span>
      <span data-testid="random-palette-values">{randomPalette.join(',')}</span>
      <button type="button" onClick={onRandomize}>
        generate palette
      </button>
      <button type="button" onClick={() => onChange('canvas', '#123456')}>
        change canvas
      </button>
      <button type="button" onClick={() => onChangeRandomPaletteColor(0, '#334455')}>
        edit generated palette
      </button>
    </div>
  ),
}))

vi.mock('../features/editor/AdvancedTokenEditor', () => ({
  AdvancedTokenEditor: ({ overrides }: { overrides: Record<string, string> }) => (
    <div data-testid="advanced-editor">
      <span data-testid="advanced-overrides">{JSON.stringify(overrides)}</span>
    </div>
  ),
}))

vi.mock('../features/editor/JsonThemeEditor', () => ({
  JsonThemeEditor: ({ activeMode, onChange }: { activeMode: string; onChange: (modeThemes: Record<string, unknown>) => void }) => (
    <div data-testid="json-editor">
      <span data-testid="json-active-mode">{activeMode}</span>
      <button type="button" onClick={() => onChange(mockState.jsonModeThemes)}>
        apply json
      </button>
    </div>
  ),
}))

vi.mock('../features/export/ThemeActionMenu', () => ({
  ThemeActionMenu: ({ onDownloadDark, onDownloadLight, onDownloadCombined }: {
    onDownloadDark: () => void
    onDownloadLight: () => void
    onDownloadCombined: () => void
  }) => (
    <div data-testid="theme-action-menu">
      <button type="button" onClick={onDownloadDark}>
        download dark
      </button>
      <button type="button" onClick={onDownloadLight}>
        download light
      </button>
      <button type="button" onClick={onDownloadCombined}>
        download combined
      </button>
    </div>
  ),
}))

vi.mock('../features/export/downloadThemeFile', () => ({
  downloadThemeFile: mockState.downloadThemeFile,
}))

vi.mock('../features/preview/PreviewSurface', () => ({
  PreviewSurface: ({
    model,
    onModeChange,
    titlebarAction,
  }: {
    model: { mode: string }
    onModeChange: (mode: 'dark' | 'light') => void
    titlebarAction?: ReactNode
  }) => (
    <div data-testid="preview-surface">
      <span data-testid="preview-mode">{model.mode}</span>
      {titlebarAction}
      <button type="button" onClick={() => onModeChange('dark')}>
        switch dark
      </button>
      <button type="button" onClick={() => onModeChange('light')}>
        switch light
      </button>
    </div>
  ),
}))

function DraftInitializer({ draft }: { draft?: ThemeDraft }) {
  const { hydrateDraft } = useThemeStoreActions()

  useEffect(() => {
    if (!draft) {
      return
    }

    hydrateDraft(draft)
  }, [draft, hydrateDraft])

  return null
}

function renderPage(initialDraft?: ThemeDraft) {
  return render(
    <ThemeStoreProvider>
      <DraftInitializer draft={initialDraft} />
      <ThemeEditorPage />
    </ThemeStoreProvider>,
  )
}

afterEach(() => {
  mockState.downloadThemeFile.mockReset()
  mockState.jsonModeThemes = {}
  window.history.replaceState(null, '', '/')
})

describe('ThemeEditorPage', () => {
  it('switches between the editor tabs', () => {
    renderPage()

    expect(screen.getByTestId('preset-picker')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: 'Mixer' }))
    expect(screen.getByTestId('semantic-editor')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: 'Tuner' }))
    expect(screen.getByTestId('advanced-editor')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: 'Advanced' }))
    expect(screen.getByTestId('json-editor')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: 'Export' }))
    expect(screen.getByTestId('theme-action-menu')).toBeInTheDocument()
  })

  it('opens shared links on the Colors tab', () => {
    window.history.replaceState(null, '', '/?shared-theme=encoded-payload')

    renderPage()

    expect(screen.getByTestId('advanced-editor')).toBeInTheDocument()
    expect(screen.queryByTestId('preset-picker')).not.toBeInTheDocument()
  })

  it('keeps the inspire tab open after applying a preset', () => {
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'apply preset' }))

    expect(screen.getByTestId('preset-picker')).toBeInTheDocument()
    expect(screen.queryByTestId('semantic-editor')).not.toBeInTheDocument()
  })

  it('keeps save actions in the editor tabs without the legacy metadata row', () => {
    renderPage()

    expect(screen.getByLabelText('Theme name')).toBeInTheDocument()
    expect(screen.getByRole('switch', { name: 'Switch to light mode' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Export' })).toBeInTheDocument()
    expect(screen.queryByTestId('theme-action-menu')).not.toBeInTheDocument()
    expect(screen.queryByText(/editing dark/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Theme metadata')).not.toBeInTheDocument()
  })

  it('resets only semantic-group-affected overrides when a basic color changes', async () => {
    const draft = createDefaultThemeDraft()

    draft.modes.dark.tokenOverrides = {
      background: '#ffffff',
      primary: '#00ff00',
    }

    renderPage(draft)

    fireEvent.click(screen.getByRole('tab', { name: 'Tuner' }))

    await waitFor(() => {
      expect(screen.getByTestId('advanced-overrides')).toHaveTextContent('background')
      expect(screen.getByTestId('advanced-overrides')).toHaveTextContent('primary')
    })

    fireEvent.click(screen.getByRole('tab', { name: 'Mixer' }))
    fireEvent.click(screen.getByRole('button', { name: 'change canvas' }))
    fireEvent.click(screen.getByRole('tab', { name: 'Tuner' }))

    await waitFor(() => {
      expect(screen.getByTestId('advanced-overrides')).not.toHaveTextContent('background')
      expect(screen.getByTestId('advanced-overrides')).toHaveTextContent('primary')
    })
  })

  it('updates the generated theme when a generated palette color changes', () => {
    renderPage()

    fireEvent.click(screen.getByRole('tab', { name: 'Mixer' }))
    fireEvent.click(screen.getByRole('button', { name: 'generate palette' }))
    fireEvent.click(screen.getByRole('button', { name: 'edit generated palette' }))

    expect(screen.getByLabelText('Theme name')).toHaveValue('Edited Randomized')
  })

  it('keeps the generated mixer palette stable across dark and light mode switches', async () => {
    renderPage()

    fireEvent.click(screen.getByRole('tab', { name: 'Mixer' }))
    fireEvent.click(screen.getByRole('button', { name: 'generate palette' }))

    expect(screen.getByTestId('semantic-canvas')).toHaveTextContent('#334455')
    expect(screen.getByTestId('random-palette-values')).toHaveTextContent('#112233,#445566,#778899')

    fireEvent.click(screen.getByRole('button', { name: 'switch light' }))

    await waitFor(() => {
      expect(screen.getByTestId('semantic-canvas')).toHaveTextContent('#ddeeff')
      expect(screen.getByTestId('random-palette-values')).toHaveTextContent('#112233,#445566,#778899')
    })
  })

  it('shows a stable extracted palette in Mixer for loaded themes without a generated palette', async () => {
    renderPage()

    fireEvent.click(screen.getByRole('tab', { name: 'Mixer' }))

    expect(Number(screen.getByTestId('random-palette-size').textContent)).toBeGreaterThan(0)
    expect(screen.getByTestId('random-palette-values')).toHaveTextContent('#220033,#445566,#778899')

    fireEvent.click(screen.getByRole('button', { name: 'switch light' }))

    await waitFor(() => {
      expect(screen.getByTestId('random-palette-values')).toHaveTextContent('#220033,#445566,#778899')
    })
  })

  it('only replaces mode drafts from JSON when that mode actually changes', async () => {
    const draft = createDefaultThemeDraft()

    draft.modes.dark.tokenOverrides = {
      primary: '#123456',
    }

    mockState.jsonModeThemes = {
      dark: resolveThemeMode(draft.modes.dark),
      light: {
        ...resolveThemeMode(draft.modes.light),
        text: '#222222',
      },
    }

    renderPage(draft)

    fireEvent.click(screen.getByRole('tab', { name: 'Advanced' }))
    fireEvent.click(screen.getByRole('button', { name: 'apply json' }))
    fireEvent.click(screen.getByRole('tab', { name: 'Tuner' }))

    await waitFor(() => {
      expect(screen.getByTestId('advanced-overrides')).toHaveTextContent('"primary":"#123456"')
      expect(screen.getByTestId('advanced-overrides')).not.toHaveTextContent('"text":"#222222"')
    })

    fireEvent.click(screen.getByRole('button', { name: 'switch light' }))

    await waitFor(() => {
      expect(screen.getByTestId('preview-mode')).toHaveTextContent('light')
      expect(screen.getByTestId('advanced-overrides')).toHaveTextContent('"text":"#222222"')
    })
  })

  it('updates ui mode and exports slugged filenames', async () => {
    const { unmount } = renderPage()

    expect(document.documentElement.dataset.uiMode).toBe('dark')

    fireEvent.change(screen.getByLabelText('Theme name'), {
      target: {
        value: 'My Cool Theme!!',
      },
    })

    fireEvent.click(screen.getByRole('tab', { name: 'Export' }))
    fireEvent.click(screen.getByRole('button', { name: 'download dark' }))
    fireEvent.click(screen.getByRole('button', { name: 'download light' }))
    fireEvent.click(screen.getByRole('button', { name: 'download combined' }))

    expect(mockState.downloadThemeFile).toHaveBeenNthCalledWith(1, 'my-cool-theme.dark.json', expect.any(String))
    expect(mockState.downloadThemeFile).toHaveBeenNthCalledWith(2, 'my-cool-theme.light.json', expect.any(String))
    expect(mockState.downloadThemeFile).toHaveBeenNthCalledWith(3, 'my-cool-theme.json', expect.any(String))

    fireEvent.click(screen.getByRole('button', { name: 'switch light' }))

    await waitFor(() => {
      expect(document.documentElement.dataset.uiMode).toBe('light')
    })

    unmount()

    expect(document.documentElement.dataset.uiMode).toBeUndefined()
  })
})
