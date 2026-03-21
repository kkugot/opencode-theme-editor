import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { RemixStrength, ThemePreset } from '../../domain/presets/themePresets'
import { createDefaultThemeDraft } from '../../domain/theme/createDefaultThemeDraft'
import { resolveThemeMode } from '../../domain/theme/resolveThemeMode'
import { ThemePresetPicker } from './ThemePresetPicker'

const draft = createDefaultThemeDraft()
const darkTokens = resolveThemeMode(draft.modes.dark)
const lightTokens = resolveThemeMode(draft.modes.light)

function buildPreset(overrides: Partial<ThemePreset> = {}): ThemePreset {
  return {
    id: 'aura',
    name: 'Aura',
    source: 'opencode',
    sourceLabel: 'OpenCode',
    themes: {
      dark: darkTokens,
      light: lightTokens,
    },
    usage: {
      dark: [
        { color: '#111111', weight: 2, tokens: ['background'] },
        { color: '#4c8bf5', weight: 1, tokens: ['primary'] },
      ],
      light: [
        { color: '#f4f4f4', weight: 2, tokens: ['background'] },
        { color: '#4c8bf5', weight: 1, tokens: ['primary'] },
      ],
    },
    ...overrides,
  }
}

function renderPicker(overrides: {
  selectedPresetId?: string | null
  selectedPresetPreview?: ThemePreset | null
  canRemixSelectedPreset?: boolean
  canUndoSelectedPreset?: boolean
  onApplyPreset?: (preset: ThemePreset) => void
  onRemixSelectedPreset?: (strength: RemixStrength) => void
  onUndoSelectedPreset?: () => void
} = {}) {
  return render(
    <ThemePresetPicker
      activeMode="dark"
      presets={[
        buildPreset(),
        buildPreset({
          id: 'community',
          name: 'Community',
          source: 'colorhunt',
          sourceLabel: 'Color Hunt',
          metaLabel: 'Warm',
          palette: ['#111111', '#f4f4f4', '#4c8bf5'],
        }),
      ]}
      selectedPresetId={overrides.selectedPresetId ?? null}
      selectedPresetPreview={overrides.selectedPresetPreview ?? null}
      canRemixSelectedPreset={overrides.canRemixSelectedPreset ?? false}
      canUndoSelectedPreset={overrides.canUndoSelectedPreset ?? false}
      onApplyPreset={overrides.onApplyPreset ?? vi.fn()}
      onRemixSelectedPreset={overrides.onRemixSelectedPreset ?? vi.fn()}
      onUndoSelectedPreset={overrides.onUndoSelectedPreset ?? vi.fn()}
    />,
  )
}

describe('ThemePresetPicker', () => {
  it('shows top search, style filter, and compact random controls', () => {
    renderPicker()

    expect(screen.getByRole('button', { name: 'Random' })).toBeInTheDocument()
    expect(screen.getByLabelText('Search presets')).toBeInTheDocument()
    expect(screen.getByLabelText('Filter community presets by style')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Search 2 presets')).toBeInTheDocument()
    expect(screen.queryByText('Generate first, then fine-tune once the preview feels close.')).not.toBeInTheDocument()
  })

  it('applies a random visible preset from the filtered list', () => {
    const onApplyPreset = vi.fn()
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.99)

    renderPicker({ onApplyPreset })

    fireEvent.click(screen.getByRole('button', { name: 'Random' }))

    expect(onApplyPreset).toHaveBeenCalledWith(expect.objectContaining({ id: 'community' }))

    randomSpy.mockRestore()
  })

  it('keeps built-in presets collapsed by default and shows their count', () => {
    renderPicker()

    const builtinToggle = screen.getByRole('button', { name: /OpenCode built-ins/i })

    expect(builtinToggle).toHaveTextContent('(1)')

    expect(screen.queryByText('Aura')).not.toBeInTheDocument()

    fireEvent.click(builtinToggle)

    expect(screen.getByText('Aura')).toBeInTheDocument()
  })

  it('filters community presets without showing source tokens on cards', () => {
    renderPicker()

    fireEvent.change(screen.getByLabelText('Search presets'), {
      target: { value: 'community' },
    })

    expect(screen.queryByText('Aura')).not.toBeInTheDocument()
    expect(screen.queryByText('Community palettes')).not.toBeInTheDocument()
    expect(screen.getByText('Community')).toBeInTheDocument()
    expect(screen.getAllByText('Warm').length).toBeGreaterThan(0)
    expect(screen.queryByText('Color Hunt')).not.toBeInTheDocument()
  })

  it('filters community presets by style', () => {
    renderPicker()

    fireEvent.change(screen.getByLabelText('Filter community presets by style'), {
      target: { value: 'warm' },
    })

    expect(screen.getByText('Community')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /OpenCode built-ins/i })).not.toBeInTheDocument()
  })

  it('allows collapsing style groups', () => {
    renderPicker()

    const warmToggle = screen
      .getAllByRole('button', { name: /Warm/i })
      .find((element) => element.className.includes('theme-preset-group-toggle'))

    expect(warmToggle).toBeDefined()

    fireEvent.click(warmToggle!)

    expect(screen.queryByText('Community')).not.toBeInTheDocument()
  })

  it('maps culture-specific palette groups to neutral labels', () => {
    render(
      <ThemePresetPicker
        activeMode="dark"
        presets={[
          buildPreset({
            id: 'christmas',
            name: 'Christmas Palette',
            source: 'colorhunt',
            sourceLabel: 'Color Hunt',
            metaLabel: 'Christmas',
            tags: ['christmas'],
            palette: ['#111111', '#f4f4f4', '#4c8bf5'],
          }),
          buildPreset({
            id: 'halloween',
            name: 'Halloween Palette',
            source: 'colorhunt',
            sourceLabel: 'Color Hunt',
            metaLabel: 'Halloween',
            tags: ['halloween'],
            palette: ['#222222', '#f0e6d2', '#ff7a18'],
          }),
          buildPreset({
            id: 'skin',
            name: 'Skin Palette',
            source: 'colorhunt',
            sourceLabel: 'Color Hunt',
            metaLabel: 'Skin',
            tags: ['skin'],
            palette: ['#432818', '#99582a', '#ffe6a7'],
          }),
          buildPreset({
            id: 'wedding',
            name: 'Wedding Palette',
            source: 'colorhunt',
            sourceLabel: 'Color Hunt',
            metaLabel: 'Wedding',
            tags: ['wedding'],
            palette: ['#faf3e0', '#eab676', '#b07d62'],
          }),
        ]}
        selectedPresetId={null}
        selectedPresetPreview={null}
        canRemixSelectedPreset={false}
        canUndoSelectedPreset={false}
        onApplyPreset={vi.fn()}
        onRemixSelectedPreset={vi.fn()}
        onUndoSelectedPreset={vi.fn()}
      />,
    )

    expect(screen.getAllByText('Holidays').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Earth').length).toBeGreaterThan(0)
    expect(screen.getByRole('option', { name: 'Holidays' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Earth' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Christmas' })).not.toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Halloween' })).not.toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Wedding' })).not.toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Skin' })).not.toBeInTheDocument()
  })

  it('shows remix and undo controls on the selected preset card', () => {
    const onRemixSelectedPreset = vi.fn()
    const onUndoSelectedPreset = vi.fn()

    renderPicker({
      selectedPresetId: 'community',
      selectedPresetPreview: buildPreset({
        id: 'community',
        name: 'Community',
        source: 'colorhunt',
        sourceLabel: 'Color Hunt',
        metaLabel: 'Warm',
        palette: ['#111111', '#f4f4f4', '#4c8bf5'],
      }),
      canRemixSelectedPreset: true,
      canUndoSelectedPreset: true,
      onRemixSelectedPreset,
      onUndoSelectedPreset,
    })

    fireEvent.click(screen.getByRole('button', { name: 'Hard remix preset' }))
    fireEvent.click(screen.getByRole('button', { name: 'Undo preset remix' }))

    expect(onRemixSelectedPreset).toHaveBeenCalledWith('balanced')
    expect(onUndoSelectedPreset).toHaveBeenCalledOnce()
  })
})
