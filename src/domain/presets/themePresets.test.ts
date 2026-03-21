import { describe, expect, it } from 'vitest'
import { createDefaultThemeDraft } from '../theme/createDefaultThemeDraft'
import { colorToHsl, hueDistance } from '../theme/color'
import { resolveThemeMode } from '../theme/resolveThemeMode'
import {
  buildRolePaletteForRemix,
  createSemanticModeSelectionFromPalette,
  extractStablePaletteFromThemes,
  remixThemePreset,
  THEME_PRESETS,
  type ThemePreset,
} from './themePresets'

const draft = createDefaultThemeDraft()
const darkTokens = resolveThemeMode(draft.modes.dark)
const lightTokens = resolveThemeMode(draft.modes.light)

function buildPreset(palette: string[]): ThemePreset {
  return {
    id: 'wild-test',
    name: 'Wild Test',
    source: 'coolors',
    sourceLabel: 'Coolors',
    palette,
    themes: {
      dark: darkTokens,
      light: lightTokens,
    },
    usage: {
      dark: [],
      light: [],
    },
  }
}

function normalizeName(value: string) {
  return value.trim().replace(/\s+/gu, ' ').toLowerCase()
}

function buildPaletteSignature(preset: ThemePreset) {
  if (!preset.palette) {
    return null
  }

  return [...new Set(preset.palette.map((color) => color.toLowerCase()))].sort((left, right) => left.localeCompare(right)).join('|')
}

function buildThemeSignature(preset: ThemePreset) {
  return JSON.stringify([
    Object.entries(preset.themes.dark).sort(([left], [right]) => left.localeCompare(right)),
    Object.entries(preset.themes.light).sort(([left], [right]) => left.localeCompare(right)),
  ])
}

describe('buildRolePaletteForRemix', () => {
  it('keeps non-wild remix roles sorted by lightness', () => {
    expect(buildRolePaletteForRemix(['#ffee00', '#001122', '#ff00aa'], 1, 'balanced')).toEqual([
      '#001122',
      '#ffee00',
      '#ff00aa',
    ])
  })

  it('lets wild remix sometimes reshuffle only interior roles and sometimes move anchors', () => {
    const palette = ['#001122', '#223344', '#445566', '#ff00aa', '#ffee00']
    const sorted = buildRolePaletteForRemix(palette, 1, 'balanced')
    const variants = Array.from({ length: 48 }, (_, index) => buildRolePaletteForRemix(palette, index + 1, 'wild'))

    expect(
      variants.some(
        (variant) =>
          variant[0] === sorted[0] &&
          variant.at(-1) === sorted.at(-1) &&
          variant.join('|') !== sorted.join('|'),
      ),
    ).toBe(true)

    expect(
      variants.some(
        (variant) => variant[0] !== sorted[0] || variant.at(-1) !== sorted.at(-1),
      ),
    ).toBe(true)
  })
})

describe('remixThemePreset', () => {
  it('uses wild role shuffling to produce a different background assignment', () => {
    const preset = buildPreset(['#001122', '#223344', '#445566', '#ff00aa', '#ffee00'])
    const balanced = remixThemePreset(preset, {
      variationSeed: 1,
      remixStrength: 'balanced',
    })
    const wild = remixThemePreset(preset, {
      variationSeed: 1,
      remixStrength: 'wild',
    })

    expect(wild.themes.dark.background).not.toBe(balanced.themes.dark.background)
    expect(wild.themes.light.background).not.toBe(balanced.themes.light.background)
  })
})

describe('createSemanticModeSelectionFromPalette', () => {
  it('produces distinct mixer results for dark and light modes from the same palette', () => {
    const palette = ['#101827', '#182235', '#5fa8ff', '#8bd3dd', '#f4d58d']
    const darkSelection = createSemanticModeSelectionFromPalette('dark', palette, { variationSeed: 12345 })
    const lightSelection = createSemanticModeSelectionFromPalette('light', palette, { variationSeed: 12345 })

    expect(darkSelection.modeDraft.semanticGroups).not.toEqual(lightSelection.modeDraft.semanticGroups)
    expect(darkSelection.modeDraft.semanticGroups.canvas).not.toBe(lightSelection.modeDraft.semanticGroups.canvas)
    expect(darkSelection.modeDraft.semanticGroups.text).not.toBe(lightSelection.modeDraft.semanticGroups.text)
  })

  it('keeps generated signals near their intended hue families', () => {
    const palette = ['#f6f5ea', '#8ec3f4', '#6e9fc8', '#365777']
    const darkSelection = createSemanticModeSelectionFromPalette('dark', palette, { variationSeed: 2468 })
    const lightSelection = createSemanticModeSelectionFromPalette('light', palette, { variationSeed: 2468 })

    expect(hueDistance(colorToHsl(darkSelection.modeDraft.semanticGroups.success)?.h ?? 0, 132)).toBeLessThanOrEqual(28)
    expect(hueDistance(colorToHsl(darkSelection.modeDraft.semanticGroups.warning)?.h ?? 0, 42)).toBeLessThanOrEqual(28)
    expect(hueDistance(colorToHsl(darkSelection.modeDraft.semanticGroups.danger)?.h ?? 0, 356)).toBeLessThanOrEqual(28)
    expect(hueDistance(colorToHsl(lightSelection.modeDraft.semanticGroups.success)?.h ?? 0, 132)).toBeLessThanOrEqual(28)
    expect(hueDistance(colorToHsl(lightSelection.modeDraft.semanticGroups.warning)?.h ?? 0, 42)).toBeLessThanOrEqual(28)
    expect(hueDistance(colorToHsl(lightSelection.modeDraft.semanticGroups.danger)?.h ?? 0, 356)).toBeLessThanOrEqual(28)
  })
})

describe('extractStablePaletteFromThemes', () => {
  it('uses the darker mode as the stable fallback palette source', () => {
    const stablePalette = extractStablePaletteFromThemes({
      dark: {
        ...darkTokens,
        background: '#101827',
        primary: '#5fa8ff',
      },
      light: {
        ...lightTokens,
        background: '#f7f9fc',
        primary: '#ff7a59',
      },
    })

    expect(stablePalette).toContain('#101827')
    expect(stablePalette).toContain('#5fa8ff')
    expect(stablePalette).not.toContain('#ff7a59')
  })
})

describe('THEME_PRESETS', () => {
  it('keeps preset display names unique', () => {
    const nameMap = new Map<string, ThemePreset[]>()

    for (const preset of THEME_PRESETS) {
      const normalizedName = normalizeName(preset.name)
      const matchingPresets = nameMap.get(normalizedName) ?? []

      matchingPresets.push(preset)
      nameMap.set(normalizedName, matchingPresets)
    }

    const duplicateNames = [...nameMap.values()].filter((presets) => presets.length > 1)

    expect(duplicateNames).toEqual([])
  })

  it('deduplicates palette-based presets that share the same palette', () => {
    const paletteMap = new Map<string, ThemePreset[]>()

    for (const preset of THEME_PRESETS) {
      const signature = buildPaletteSignature(preset)

      if (!signature) {
        continue
      }

      const matchingPresets = paletteMap.get(signature) ?? []

      matchingPresets.push(preset)
      paletteMap.set(signature, matchingPresets)
    }

    const duplicatePalettes = [...paletteMap.values()].filter((presets) => presets.length > 1)

    expect(duplicatePalettes).toEqual([])
  })

  it('deduplicates presets that resolve to the same dark and light themes', () => {
    const themeMap = new Map<string, ThemePreset[]>()

    for (const preset of THEME_PRESETS) {
      const signature = buildThemeSignature(preset)
      const matchingPresets = themeMap.get(signature) ?? []

      matchingPresets.push(preset)
      themeMap.set(signature, matchingPresets)
    }

    const duplicateThemes = [...themeMap.values()].filter((presets) => presets.length > 1)

    expect(duplicateThemes).toEqual([])
  })
})
