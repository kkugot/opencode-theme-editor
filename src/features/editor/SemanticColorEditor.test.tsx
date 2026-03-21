import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { colorToHsl, getColorLightness, hueDistance } from '../../domain/theme/color'
import { createDefaultThemeDraft } from '../../domain/theme/createDefaultThemeDraft'
import { SemanticColorEditor } from './SemanticColorEditor'

function getSuggestionColors(label: string) {
  return within(screen.getByLabelText(label))
    .getAllByRole('button')
    .map((button) => button.getAttribute('style')?.match(/--semantic-swatch-color:\s*(#[0-9a-f]+)/i)?.[1] ?? '')
}

describe('SemanticColorEditor', () => {
  it('keeps five canvas suggestion options even when generated colors collapse', () => {
    const draft = createDefaultThemeDraft()
    const onChange = vi.fn()

    render(
      <SemanticColorEditor
        activeMode="dark"
        semanticGroups={draft.modes.dark.semanticGroups}
        randomPalette={['#19291f', '#355446', '#64d3b0', '#deef8c']}
        onChange={onChange}
        onRandomize={vi.fn()}
        onChangeRandomPaletteColor={vi.fn()}
      />,
    )

    const canvasChoices = within(screen.getByLabelText('canvas palette choices')).getAllByRole('button')

    expect(canvasChoices).toHaveLength(5)
    expect(onChange).not.toHaveBeenCalled()
  })

  it('keeps light-mode canvas suggestions inside a light surface band', () => {
    const draft = createDefaultThemeDraft()

    render(
      <SemanticColorEditor
        activeMode="light"
        semanticGroups={draft.modes.light.semanticGroups}
        randomPalette={['#f6f5ea', '#8ec3f4', '#6e9fc8', '#365777']}
        onChange={vi.fn()}
        onRandomize={vi.fn()}
        onChangeRandomPaletteColor={vi.fn()}
      />,
    )

    const canvasSuggestionColors = getSuggestionColors('canvas palette choices')

    expect(canvasSuggestionColors).toHaveLength(5)
    expect(canvasSuggestionColors.every((color) => (getColorLightness(color) ?? 0) >= 0.9)).toBe(true)
  })

  it('keeps dark-mode signal suggestions in their intended hue families', () => {
    const draft = createDefaultThemeDraft()
    const semanticGroups = {
      ...draft.modes.dark.semanticGroups,
      success: '#59d67f',
      warning: '#d7b44a',
      danger: '#d96d7d',
    }

    render(
      <SemanticColorEditor
        activeMode="dark"
        semanticGroups={semanticGroups}
        randomPalette={['#f6f5ea', '#8ec3f4', '#6e9fc8', '#365777']}
        onChange={vi.fn()}
        onRandomize={vi.fn()}
        onChangeRandomPaletteColor={vi.fn()}
      />,
    )

    const successColors = getSuggestionColors('success palette choices')
    const warningColors = getSuggestionColors('warning palette choices')
    const dangerColors = getSuggestionColors('danger palette choices')

    expect(successColors.every((color) => hueDistance(colorToHsl(color)?.h ?? 0, 132) <= 18)).toBe(true)
    expect(warningColors.every((color) => hueDistance(colorToHsl(color)?.h ?? 0, 42) <= 18)).toBe(true)
    expect(dangerColors.every((color) => hueDistance(colorToHsl(color)?.h ?? 0, 356) <= 18)).toBe(true)
  })

  it('lets mixer swatches change foundation and signal colors directly', () => {
    const draft = createDefaultThemeDraft()
    const onChange = vi.fn()

    render(
      <SemanticColorEditor
        activeMode="dark"
        semanticGroups={draft.modes.dark.semanticGroups}
        randomPalette={['#19291f', '#355446', '#64d3b0', '#deef8c']}
        onChange={onChange}
        onRandomize={vi.fn()}
        onChangeRandomPaletteColor={vi.fn()}
      />,
    )

    fireEvent.change(screen.getByLabelText('canvas color'), {
      target: {
        value: '#123456',
      },
    })

    fireEvent.change(screen.getByLabelText('success color'), {
      target: {
        value: '#4fd675',
      },
    })

    expect(onChange).toHaveBeenNthCalledWith(1, 'canvas', '#123456')
    expect(onChange).toHaveBeenNthCalledWith(2, 'success', '#4fd675')
  })
})
