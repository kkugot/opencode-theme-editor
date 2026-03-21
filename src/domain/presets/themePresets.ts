import { OPENCODE_BUILTIN_THEME_NAMES, OPENCODE_BUILTIN_THEMES } from '../opencode/builtins'
import { type OpenCodeThemeJson, resolveOpenCodeTheme } from '../opencode/resolveTheme'
import { buildThemeUsageSegments, type ThemeUsageSegment } from '../opencode/themeUsage'
import {
  colorToHsl,
  getColorLightness,
  getContrastRatio,
  hslToColor,
  mixColors,
  hueDistance,
  normalizeColorValue,
} from '../theme/color'
import { createDraftFromResolvedThemes } from '../theme/createDraftFromResolvedThemes'
import type { ThemeDraft, ThemeMode, ThemeModeDraft, ThemeTokens } from '../theme/model'
import { resolveThemeMode } from '../theme/resolveThemeMode'
import { getContrastProfile } from '../validation/contrastProfiles'
import { ONLINE_PALETTE_PROVIDERS } from './onlinePaletteLibraries'
import { buildGeneratedPaletteThemeName } from './paletteNames'
import { getPresetCategoryLabel } from './presetCategories'
import { buildPaletteLibraryEntryName, type PaletteLibraryEntry, type PaletteLibraryProviderId } from './paletteLibraryContract'

export type ThemePresetSource = 'opencode' | PaletteLibraryProviderId | 'random'
export type RemixStrength = 'subtle' | 'balanced' | 'wild'

export type ThemePreset = {
  id: string
  name: string
  source: ThemePresetSource
  sourceLabel: string
  metaLabel?: string
  tags?: string[]
  likesLabel?: string
  palette?: string[]
  themes: Record<ThemeMode, ThemeTokens>
  usage: Record<ThemeMode, ThemeUsageSegment[]>
}

export const THEME_PRESET_SOURCE_ORDER = ['opencode', 'coolors', 'colorhunt', 'random'] as const satisfies ThemePresetSource[]

type PaletteGenerationOptions = {
  variationSeed?: number
  remixStrength?: RemixStrength
}

type ModeGenerationSettings = {
  canvasLightness: number
  panelLightness: number
  textLightness: number
  mutedLightness: number
  accentLightness: number
  successLightness: number
  warningLightness: number
  dangerLightness: number
  textContrastTarget: number
  mutedContrastTarget: number
  accentContrastTarget: number
  signalContrastTarget: number
}

type RemixProfile = {
  variance: number
  contrastVariance: number
  anchorMix: readonly [number, number]
  textMix: readonly [number, number]
  candidateAdjacentMix: readonly [number, number]
  candidateSpanMix: readonly [number, number]
}

export const REMIX_STRENGTHS = ['subtle', 'balanced', 'wild'] as const satisfies RemixStrength[]

const REMIX_PROFILES = {
  subtle: {
    variance: 0.62,
    contrastVariance: 0.48,
    anchorMix: [0.04, 0.16],
    textMix: [0.03, 0.12],
    candidateAdjacentMix: [0.08, 0.22],
    candidateSpanMix: [0.04, 0.14],
  },
  balanced: {
    variance: 1,
    contrastVariance: 0.78,
    anchorMix: [0.08, 0.28],
    textMix: [0.06, 0.2],
    candidateAdjacentMix: [0.16, 0.4],
    candidateSpanMix: [0.08, 0.24],
  },
  wild: {
    variance: 1.42,
    contrastVariance: 1,
    anchorMix: [0.16, 0.42],
    textMix: [0.1, 0.28],
    candidateAdjacentMix: [0.28, 0.58],
    candidateSpanMix: [0.16, 0.34],
  },
} satisfies Record<RemixStrength, RemixProfile>

function titleCase(value: string) {
  return value
    .split(/[-\s]+/u)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function normalizePresetName(value: string) {
  return value.trim().replace(/\s+/gu, ' ').toLowerCase()
}

function clampUnit(value: number) {
  return Math.max(0, Math.min(1, value))
}

function hashString(value: string) {
  let hash = 2166136261

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return hash >>> 0
}

function createSeededRandom(seed: number) {
  let state = seed >>> 0

  if (state === 0) {
    state = 0x6d2b79f5
  }

  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let result = Math.imul(state ^ (state >>> 15), 1 | state)

    result ^= result + Math.imul(result ^ (result >>> 7), 61 | result)

    return ((result ^ (result >>> 14)) >>> 0) / 4294967296
  }
}

function pickInRange(random: () => number, minimum: number, maximum: number) {
  return minimum + (maximum - minimum) * random()
}

function getRemixProfile(remixStrength: RemixStrength) {
  return REMIX_PROFILES[remixStrength]
}

function pickScaledUnitRange(random: () => number, minimum: number, maximum: number, variance: number) {
  const center = (minimum + maximum) / 2
  const halfRange = ((maximum - minimum) / 2) * variance

  return pickInRange(random, clampUnit(center - halfRange), clampUnit(center + halfRange))
}

function pickContrastTarget(id: Parameters<typeof getContrastProfile>[0], random: () => number, remixStrength: RemixStrength) {
  const contrastProfile = getContrastProfile(id)
  const center = (contrastProfile.preferredMin + contrastProfile.preferredMax) / 2
  const halfRange = ((contrastProfile.preferredMax - contrastProfile.preferredMin) / 2) * getRemixProfile(remixStrength).contrastVariance

  return pickInRange(random, center - halfRange, center + halfRange)
}

function rotatePalette(colors: string[], shift: number) {
  if (colors.length === 0) {
    return []
  }

  const normalizedShift = ((shift % colors.length) + colors.length) % colors.length

  return colors.map((_, index) => colors[(index + normalizedShift) % colors.length] ?? colors[index] ?? '#000000')
}

function shufflePalette(colors: string[], random: () => number) {
  const next = [...colors]

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    const current = next[index]

    next[index] = next[swapIndex] ?? current ?? '#000000'
    next[swapIndex] = current ?? next[swapIndex] ?? '#000000'
  }

  return next
}

function shuffleItems<T>(items: T[], random: () => number) {
  const next = [...items]

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    const current = next[index]

    next[index] = next[swapIndex] as T
    next[swapIndex] = current as T
  }

  return next
}

function resolvePaletteSource(colors: string[]) {
  const normalizedPalette = normalizePalette(colors)

  return normalizedPalette.length >= 3
    ? normalizedPalette
    : ['#101827', '#182235', '#5fa8ff', '#8bd3dd', '#f4d58d']
}

export function buildRolePaletteForRemix(colors: string[], variationSeed: number, remixStrength: RemixStrength) {
  const sourcePalette = resolvePaletteSource(colors)

  if (remixStrength !== 'wild') {
    return getSortedPalette(sourcePalette)
  }

  const random = createSeededRandom(variationSeed ^ 0x9e3779b9)

  if (sourcePalette.length <= 3) {
    return shufflePalette(sourcePalette, random)
  }

  const sortedPalette = getSortedPalette(sourcePalette)
  const strategy = random()

  if (strategy < 0.4) {
    return shufflePalette(sourcePalette, random)
  }

  if (strategy < 0.8) {
    return [sortedPalette[0] ?? '#101827', ...shufflePalette(sortedPalette.slice(1, -1), random), sortedPalette.at(-1) ?? '#eff6ff']
  }

  const remixedPalette = [...sortedPalette]
  const candidateIndexes = Array.from({ length: remixedPalette.length - 1 }, (_, index) => index + 1)
  const shuffledIndexes = shuffleItems(candidateIndexes, random)
  const subsetSize = Math.min(Math.max(2, Math.floor(random() * 3) + 2), shuffledIndexes.length)
  const selectedIndexes = shuffledIndexes.slice(0, subsetSize).sort((left, right) => left - right)
  const remixedValues = shuffleItems(selectedIndexes.map((index) => remixedPalette[index] ?? '#000000'), random)

  selectedIndexes.forEach((index, valueIndex) => {
    remixedPalette[index] = remixedValues[valueIndex] ?? remixedPalette[index] ?? '#000000'
  })

  return remixedPalette
}

function mixPaletteAnchor(base: string, partner: string | undefined, random: () => number, minimumMix: number, maximumMix: number) {
  if (!partner || partner === base) {
    return base
  }

  return mixColors(base, partner, pickInRange(random, minimumMix, maximumMix))
}

function buildShiftedPaletteCandidates(colors: string[], random: () => number, remixStrength: RemixStrength) {
  if (colors.length <= 1) {
    return colors
  }

  const remixProfile = getRemixProfile(remixStrength)
  const rotatedPalette = rotatePalette(colors, Math.floor(random() * colors.length))
  const sortedPalette = getSortedPalette(colors)
  const adjacentMixes = rotatedPalette.map((color, index) =>
    mixPaletteAnchor(
      color,
      rotatedPalette[(index + 1) % rotatedPalette.length],
      random,
      remixProfile.candidateAdjacentMix[0],
      remixProfile.candidateAdjacentMix[1],
    ),
  )
  const spanMixes = sortedPalette.map((color, index) =>
    mixPaletteAnchor(
      color,
      sortedPalette[Math.min(sortedPalette.length - 1, index + 2)],
      random,
      remixProfile.candidateSpanMix[0],
      remixProfile.candidateSpanMix[1],
    ),
  )

  return normalizePalette([...colors, ...adjacentMixes, ...spanMixes])
}

function normalizePalette(colors: string[]) {
  const uniqueColors = new Set<string>()

  for (const color of colors) {
    const normalized = normalizeColorValue(color)

    if (normalized) {
      uniqueColors.add(normalized)
    }
  }

  return [...uniqueColors]
}

function getSortedPalette(colors: string[]) {
  return [...colors].sort((left, right) => {
    const leftLightness = getColorLightness(left) ?? 0
    const rightLightness = getColorLightness(right) ?? 0

    return leftLightness - rightLightness
  })
}

function reframePaletteColor(color: string, lightness: number, minSaturation: number, maxSaturation: number) {
  const hsl = colorToHsl(color)

  if (!hsl) {
    return hslToColor(220, minSaturation, lightness)
  }

  return hslToColor(hsl.h, Math.min(Math.max(hsl.s, minSaturation), maxSaturation), clampUnit(lightness), hsl.a)
}

function ensureColorContrast(color: string, background: string, targetRatio: number, preference: 'lighter' | 'darker') {
  const hsl = colorToHsl(color)

  if (!hsl) {
    return color
  }

  let candidate = color
  let lightness = hsl.l

  for (let index = 0; index < 32; index += 1) {
    if (getContrastRatio(candidate, background) >= targetRatio) {
      return candidate
    }

    lightness = clampUnit(lightness + (preference === 'lighter' ? 0.025 : -0.025))
    candidate = hslToColor(hsl.h, hsl.s, lightness, hsl.a)
  }

  return hslToColor(hsl.h, Math.min(hsl.s, 0.18), preference === 'lighter' ? 0.985 : 0.12, hsl.a)
}

function fitColorContrast(
  color: string,
  background: string,
  minimumRatio: number,
  targetRatio: number,
  relation: 'lighter' | 'darker',
) {
  const hsl = colorToHsl(color)
  const backgroundHsl = colorToHsl(background)

  if (!hsl || !backgroundHsl) {
    return ensureColorContrast(color, background, minimumRatio, relation)
  }

  const minimumLightnessGap = 0.08
  const searchStart = relation === 'lighter' ? clampUnit(backgroundHsl.l + minimumLightnessGap) : 0.02
  const searchEnd = relation === 'lighter' ? 0.98 : clampUnit(backgroundHsl.l - minimumLightnessGap)

  if (searchStart >= searchEnd) {
    return ensureColorContrast(color, background, minimumRatio, relation)
  }

  let bestCandidate: { color: string; score: number } | null = null
  let bestPassingCandidate: { color: string; score: number } | null = null

  for (let index = 0; index <= 48; index += 1) {
    const progress = index / 48
    const lightness = searchStart + (searchEnd - searchStart) * progress
    const candidate = hslToColor(hsl.h, hsl.s, lightness, hsl.a)
    const ratio = getContrastRatio(candidate, background)
    const score = Math.abs(ratio - targetRatio) + Math.abs(lightness - hsl.l) * 0.16
    const candidateData = {
      color: candidate,
      score,
    }

    if (!bestCandidate || candidateData.score < bestCandidate.score) {
      bestCandidate = candidateData
    }

    if (ratio >= minimumRatio && (!bestPassingCandidate || candidateData.score < bestPassingCandidate.score)) {
      bestPassingCandidate = candidateData
    }
  }

  return bestPassingCandidate?.color ?? ensureColorContrast(bestCandidate?.color ?? color, background, minimumRatio, relation)
}

function ensureRelativeLightness(
  color: string,
  reference: string,
  minGap: number,
  relation: 'lighter' | 'darker',
) {
  const colorHsl = colorToHsl(color)
  const referenceHsl = colorToHsl(reference)

  if (!colorHsl || !referenceHsl) {
    return color
  }

  if (relation === 'lighter') {
    if (colorHsl.l >= referenceHsl.l + minGap) {
      return color
    }

    return hslToColor(colorHsl.h, colorHsl.s, clampUnit(referenceHsl.l + minGap), colorHsl.a)
  }

  if (colorHsl.l <= referenceHsl.l - minGap) {
    return color
  }

  return hslToColor(colorHsl.h, colorHsl.s, clampUnit(referenceHsl.l - minGap), colorHsl.a)
}

function pickAccentColor(colors: string[], reserved: Set<string>, targetMode: ThemeMode, panelBackground: string) {
  const candidates = colors.filter((color) => !reserved.has(color))
  const palette = candidates.length > 0 ? candidates : colors

  return [...palette]
    .map((color) => {
      const hsl = colorToHsl(color)
      const reframed = reframePaletteColor(color, targetMode === 'dark' ? 0.64 : 0.44, 0.48, 0.95)
      const contrastScore = Math.min(getContrastRatio(reframed, panelBackground), 5)

      return {
        color,
        score:
          (hsl?.s ?? 0) * 1.65 +
          (1 - Math.abs((hsl?.l ?? 0.5) - 0.54)) * 0.38 +
          contrastScore * 0.55,
      }
    })
    .sort((left, right) => right.score - left.score)[0]?.color ?? '#68a8ff'
}

function deriveSignalColor(anchor: string, targetHue: number, targetMode: ThemeMode) {
  const anchorHsl = colorToHsl(anchor)

  return hslToColor(
    targetHue,
    Math.max(anchorHsl?.s ?? 0.62, 0.58),
    targetMode === 'dark'
      ? Math.min(Math.max(anchorHsl?.l ?? 0.58, 0.52), 0.66)
      : Math.max(Math.min(anchorHsl?.l ?? 0.42, 0.48), 0.34),
  )
}

function pickSignalColor(
  colors: string[],
  excluded: Set<string>,
  targetHue: number,
  targetMode: ThemeMode,
  panelBackground: string,
  fallback: string,
) {
  const candidates = colors
    .filter((color) => !excluded.has(color))
    .map((color) => {
      const hsl = colorToHsl(color)

      if (!hsl) {
        return {
          color,
          hueDelta: Number.POSITIVE_INFINITY,
          score: -1,
        }
      }

      const reframed = reframePaletteColor(color, targetMode === 'dark' ? 0.58 : 0.4, 0.42, 0.82)
      const contrastScore = Math.min(getContrastRatio(reframed, panelBackground), 5)
      const hueDelta = hueDistance(hsl.h, targetHue)
      const hueAlignment = 1 - Math.min(hueDelta, 90) / 90
      const huePenalty = hueDelta > 42 ? ((hueDelta - 42) / 138) * 2.6 : 0

      return {
        color,
        hueDelta,
        score:
          hueAlignment * 2.6 +
          hsl.s * 0.85 +
          contrastScore * 0.42 +
          (1 - Math.abs(hsl.l - (targetMode === 'dark' ? 0.56 : 0.44))) * 0.35 -
          huePenalty,
      }
    })
    .sort((left, right) => right.score - left.score)

  const best = candidates[0]

  if (best && best.score > 1.7 && best.hueDelta <= 36) {
    excluded.add(best.color)
    return best.color
  }

  return fallback
}

function buildModeGenerationSettings(targetMode: ThemeMode, random: () => number, remixStrength: RemixStrength): ModeGenerationSettings {
  const remixProfile = getRemixProfile(remixStrength)

  if (targetMode === 'dark') {
    return {
      canvasLightness: pickScaledUnitRange(random, 0.06, 0.11, remixProfile.variance),
      panelLightness: pickScaledUnitRange(random, 0.12, 0.19, remixProfile.variance),
      textLightness: pickScaledUnitRange(random, 0.76, 0.9, remixProfile.variance),
      mutedLightness: pickScaledUnitRange(random, 0.54, 0.72, remixProfile.variance),
      accentLightness: pickScaledUnitRange(random, 0.54, 0.7, remixProfile.variance),
      successLightness: pickScaledUnitRange(random, 0.5, 0.62, remixProfile.variance),
      warningLightness: pickScaledUnitRange(random, 0.56, 0.68, remixProfile.variance),
      dangerLightness: pickScaledUnitRange(random, 0.5, 0.62, remixProfile.variance),
      textContrastTarget: pickContrastTarget('primary-text', random, remixStrength),
      mutedContrastTarget: pickContrastTarget('muted-text', random, remixStrength),
      accentContrastTarget: pickContrastTarget('accent-text', random, remixStrength),
      signalContrastTarget: pickContrastTarget('diff-added', random, remixStrength),
    }
  }

  return {
    canvasLightness: pickScaledUnitRange(random, 0.94, 0.99, remixProfile.variance),
    panelLightness: pickScaledUnitRange(random, 0.89, 0.96, remixProfile.variance),
    textLightness: pickScaledUnitRange(random, 0.08, 0.24, remixProfile.variance),
    mutedLightness: pickScaledUnitRange(random, 0.4, 0.6, remixProfile.variance),
    accentLightness: pickScaledUnitRange(random, 0.38, 0.68, remixProfile.variance),
    successLightness: pickScaledUnitRange(random, 0.32, 0.52, remixProfile.variance),
    warningLightness: pickScaledUnitRange(random, 0.38, 0.6, remixProfile.variance),
    dangerLightness: pickScaledUnitRange(random, 0.46, 0.62, remixProfile.variance),
    textContrastTarget: pickContrastTarget('primary-text', random, remixStrength),
    mutedContrastTarget: pickContrastTarget('muted-text', random, remixStrength),
    accentContrastTarget: pickContrastTarget('accent-text', random, remixStrength),
    signalContrastTarget: pickContrastTarget('diff-added', random, remixStrength),
  }
}

function buildReadableTextPair(
  textBase: string,
  mutedBase: string,
  canvas: string,
  targetMode: ThemeMode,
  settings: ModeGenerationSettings,
) {
  const contrastRelation = targetMode === 'dark' ? 'lighter' : 'darker'
  const textProfile = getContrastProfile('primary-text')
  const mutedProfile = getContrastProfile('muted-text')

  const text = fitColorContrast(
    reframePaletteColor(textBase, settings.textLightness, 0.01, targetMode === 'dark' ? 0.18 : 0.3),
    canvas,
    textProfile.minimum,
    settings.textContrastTarget,
    contrastRelation,
  )
  let muted = fitColorContrast(
    reframePaletteColor(mutedBase, settings.mutedLightness, 0.02, targetMode === 'dark' ? 0.2 : 0.26),
    canvas,
    mutedProfile.minimum,
    settings.mutedContrastTarget,
    contrastRelation,
  )

  muted = ensureRelativeLightness(muted, text, targetMode === 'dark' ? 0.08 : 0.1, targetMode === 'dark' ? 'darker' : 'lighter')
  muted = fitColorContrast(muted, canvas, mutedProfile.minimum, settings.mutedContrastTarget, contrastRelation)

  return {
    text,
    muted,
  }
}

function createModeDraftFromPalette(
  palette: string[],
  targetMode: ThemeMode,
  variationSeed: number,
  remixStrength: RemixStrength = 'balanced',
): ThemeModeDraft {
  const sourcePalette = resolvePaletteSource(palette)
  const random = createSeededRandom(variationSeed)
  const rolePalette = buildRolePaletteForRemix(sourcePalette, variationSeed, remixStrength)
  const darkest = rolePalette[0] ?? '#101827'
  const secondDarkest = rolePalette[1] ?? darkest
  const thirdDarkest = rolePalette[2] ?? secondDarkest
  const lightest = rolePalette.at(-1) ?? '#eff6ff'
  const secondLightest = rolePalette.at(-2) ?? lightest
  const thirdLightest = rolePalette.at(-3) ?? secondLightest
  const remixProfile = getRemixProfile(remixStrength)
  const settings = buildModeGenerationSettings(targetMode, random, remixStrength)
  const candidatePalette = buildShiftedPaletteCandidates(sourcePalette, random, remixStrength)
  const accentProfile = getContrastProfile('accent-text')
  const signalProfile = getContrastProfile('diff-added')

  if (targetMode === 'dark') {
    const canvasSource = mixPaletteAnchor(darkest, secondDarkest, random, remixProfile.anchorMix[0], remixProfile.anchorMix[1])
    const panelSource = mixPaletteAnchor(secondDarkest, thirdDarkest, random, remixProfile.anchorMix[0], remixProfile.anchorMix[1])
    const textSource = mixPaletteAnchor(lightest, secondLightest, random, remixProfile.textMix[0], remixProfile.textMix[1])
    const mutedSource = mixPaletteAnchor(secondLightest, thirdLightest, random, remixProfile.anchorMix[0], remixProfile.anchorMix[1])
    const canvas = reframePaletteColor(canvasSource, settings.canvasLightness, 0.02, 0.16)
    const panel = ensureRelativeLightness(
      reframePaletteColor(panelSource, settings.panelLightness, 0.03, 0.22),
      canvas,
      0.035,
      'lighter',
    )
    const { text, muted } = buildReadableTextPair(textSource, mutedSource, canvas, 'dark', settings)
    const reserved = new Set([canvasSource, panelSource, textSource, mutedSource])
    const accentBase = pickAccentColor(candidatePalette, reserved, 'dark', panel)
    const accent = fitColorContrast(
      reframePaletteColor(accentBase, settings.accentLightness, 0.48, 0.95),
      panel,
      accentProfile.minimum,
      settings.accentContrastTarget,
      'lighter',
    )
    const signalExclusions = new Set(reserved)

    signalExclusions.add(accentBase)

    const success = fitColorContrast(
      reframePaletteColor(
        pickSignalColor(candidatePalette, signalExclusions, 132, 'dark', panel, deriveSignalColor(accentBase, 132, 'dark')),
        settings.successLightness,
        0.42,
        0.82,
      ),
      panel,
      signalProfile.minimum,
      settings.signalContrastTarget,
      'lighter',
    )
    const warning = fitColorContrast(
      reframePaletteColor(
        pickSignalColor(candidatePalette, signalExclusions, 42, 'dark', panel, deriveSignalColor(accentBase, 42, 'dark')),
        settings.warningLightness,
        0.42,
        0.82,
      ),
      panel,
      signalProfile.minimum,
      settings.signalContrastTarget,
      'lighter',
    )
    const danger = fitColorContrast(
      reframePaletteColor(
        pickSignalColor(candidatePalette, signalExclusions, 356, 'dark', panel, deriveSignalColor(accentBase, 356, 'dark')),
        settings.dangerLightness,
        0.42,
        0.82,
      ),
      panel,
      signalProfile.minimum,
      settings.signalContrastTarget,
      'lighter',
    )

    return {
      semanticGroups: {
        canvas,
        panel,
        text,
        muted,
        accent,
        success,
        warning,
        danger,
      },
      tokenOverrides: {},
    }
  }

  const canvasSource = mixPaletteAnchor(lightest, secondLightest, random, remixProfile.anchorMix[0], remixProfile.anchorMix[1])
  const panelSource = mixPaletteAnchor(secondLightest, thirdLightest, random, remixProfile.anchorMix[0], remixProfile.anchorMix[1])
  const textSource = mixPaletteAnchor(darkest, secondDarkest, random, remixProfile.textMix[0], remixProfile.textMix[1])
  const mutedSource = mixPaletteAnchor(secondDarkest, thirdDarkest, random, remixProfile.anchorMix[0], remixProfile.anchorMix[1])
  const canvas = reframePaletteColor(canvasSource, settings.canvasLightness, 0.01, 0.08)
  const panel = ensureRelativeLightness(
    reframePaletteColor(panelSource, settings.panelLightness, 0.02, 0.1),
    canvas,
    0.035,
    'darker',
  )
  const { text, muted } = buildReadableTextPair(textSource, mutedSource, canvas, 'light', settings)
  const reserved = new Set([canvasSource, panelSource, textSource, mutedSource])
  const accentBase = pickAccentColor(candidatePalette, reserved, 'light', panel)
  const accent = fitColorContrast(
    reframePaletteColor(accentBase, settings.accentLightness, 0.5, 0.95),
    panel,
    accentProfile.minimum,
    settings.accentContrastTarget,
    'darker',
  )
  const signalExclusions = new Set(reserved)

  signalExclusions.add(accentBase)

  const success = fitColorContrast(
    reframePaletteColor(
      pickSignalColor(candidatePalette, signalExclusions, 132, 'light', panel, deriveSignalColor(accentBase, 132, 'light')),
      settings.successLightness,
      0.42,
      0.82,
    ),
    panel,
    signalProfile.minimum,
    settings.signalContrastTarget,
    'darker',
  )
  const warning = fitColorContrast(
    reframePaletteColor(
      pickSignalColor(candidatePalette, signalExclusions, 42, 'light', panel, deriveSignalColor(accentBase, 42, 'light')),
      settings.warningLightness,
      0.42,
      0.82,
    ),
    panel,
    signalProfile.minimum,
    settings.signalContrastTarget,
    'darker',
  )
  const danger = fitColorContrast(
    reframePaletteColor(
      pickSignalColor(candidatePalette, signalExclusions, 356, 'light', panel, deriveSignalColor(accentBase, 356, 'light')),
      settings.dangerLightness,
      0.42,
      0.82,
    ),
    panel,
    signalProfile.minimum,
    settings.signalContrastTarget,
    'darker',
  )

  return {
    semanticGroups: {
      canvas,
      panel,
      text,
      muted,
      accent,
      success,
      warning,
      danger,
    },
    tokenOverrides: {},
  }
}

function getModeVariationSeed(baseSeed: number, mode: ThemeMode) {
  return baseSeed ^ (mode === 'dark' ? 0x3c6ef35f : 0x9e3779b9)
}

function createThemesFromPalette(palette: string[], options: PaletteGenerationOptions = {}) {
  const normalizedPalette = normalizePalette(palette)
  const baseSeed = options.variationSeed ?? hashString(normalizedPalette.join('|'))
  const remixStrength = options.remixStrength ?? 'balanced'

  return {
    dark: resolveThemeMode(createModeDraftFromPalette(normalizedPalette, 'dark', getModeVariationSeed(baseSeed, 'dark'), remixStrength)),
    light: resolveThemeMode(createModeDraftFromPalette(normalizedPalette, 'light', getModeVariationSeed(baseSeed, 'light'), remixStrength)),
  } satisfies Record<ThemeMode, ThemeTokens>
}

function createRandomPalette() {
  const baseHue = Math.random() * 360
  const accentCount = 2 + Math.floor(Math.random() * 4)
  const accentStep = 280 / Math.max(1, accentCount - 1)
  const accentColors = Array.from({ length: accentCount }, (_, index) => {
    const hue = baseHue + 20 + accentStep * index + (Math.random() * 28 - 14)
    const saturation = 0.54 + Math.random() * 0.22
    const lightness = index === accentCount - 1
      ? 0.74 + Math.random() * 0.1
      : 0.5 + Math.random() * 0.16

    return hslToColor(hue, saturation, lightness)
  })

  if (Math.random() > 0.52) {
    accentColors.splice(1, 0, hslToColor(baseHue + 8 + Math.random() * 18, 0.34 + Math.random() * 0.16, 0.34 + Math.random() * 0.12))
  }

  return [
    hslToColor(baseHue + Math.random() * 10, 0.18 + Math.random() * 0.08, 0.1 + Math.random() * 0.05),
    hslToColor(baseHue + 10 + Math.random() * 16, 0.22 + Math.random() * 0.1, 0.18 + Math.random() * 0.08),
    ...accentColors,
  ]
}

export function createRandomSemanticModeSelection(mode: ThemeMode) {
  const palette = createRandomPalette()
  const randomId = `${Date.now().toString(36)}:${Math.floor(Math.random() * 100000).toString(36)}`

  return createSemanticModeSelectionFromPalette(mode, palette, {
    fallbackId: `basic:${mode}:${randomId}`,
    variationSeed: hashString(`basic:${mode}:${randomId}`),
  })
}

export function createSemanticModeSelectionFromPalette(
  mode: ThemeMode,
  palette: string[],
  options: {
    fallbackId?: string
    variationSeed?: number
  } = {},
) {
  const normalizedPalette = normalizePalette(palette)
  const fallbackId = options.fallbackId ?? `basic:${mode}:${normalizedPalette.join('|') || 'generated'}`
  const variationSeed = options.variationSeed ?? hashString(fallbackId)

  return {
    name: buildGeneratedPaletteThemeName({
      palette: normalizedPalette,
      fallbackId,
    }),
    palette: normalizedPalette,
    variationSeed,
    modeDraft: createModeDraftFromPalette(normalizedPalette, mode, getModeVariationSeed(variationSeed, mode), 'balanced'),
  }
}

function detectThemeIntent(tokens: ThemeTokens): ThemeMode {
  const backgroundLightness = getColorLightness(tokens.background) ?? 0.5
  const panelLightness = getColorLightness(tokens.backgroundPanel) ?? backgroundLightness
  const textLightness = getColorLightness(tokens.text) ?? 0.5
  const surfaceLightness = (backgroundLightness + panelLightness) / 2

  if (surfaceLightness < textLightness) {
    return 'dark'
  }

  if (surfaceLightness > textLightness) {
    return 'light'
  }

  return surfaceLightness < 0.5 ? 'dark' : 'light'
}

function getThemeSurfaceLightness(tokens: ThemeTokens) {
  const backgroundLightness = getColorLightness(tokens.background) ?? 0.5
  const panelLightness = getColorLightness(tokens.backgroundPanel) ?? backgroundLightness

  return (backgroundLightness + panelLightness) / 2
}

export function extractPaletteFromThemeTokens(tokens: ThemeTokens) {
  return normalizePalette([
    tokens.background,
    tokens.backgroundPanel,
    tokens.backgroundElement,
    tokens.text,
    tokens.textMuted,
    tokens.primary,
    tokens.secondary,
    tokens.accent,
    tokens.success,
    tokens.warning,
    tokens.error,
    tokens.info,
    tokens.markdownCode,
    tokens.syntaxString,
    tokens.syntaxNumber,
  ])
}

export function extractStablePaletteFromThemes(themes: Record<ThemeMode, ThemeTokens>) {
  const canonicalTheme = getThemeSurfaceLightness(themes.dark) <= getThemeSurfaceLightness(themes.light)
    ? themes.dark
    : themes.light

  return extractPaletteFromThemeTokens(canonicalTheme)
}

function resolveBuiltinPresetThemes(theme: OpenCodeThemeJson) {
  const resolvedDark = resolveOpenCodeTheme(theme, 'dark')
  const resolvedLight = resolveOpenCodeTheme(theme, 'light')
  const darkIntent = detectThemeIntent(resolvedDark)
  const lightIntent = detectThemeIntent(resolvedLight)
  const explicitDark = darkIntent === 'dark' ? resolvedDark : lightIntent === 'dark' ? resolvedLight : null
  const explicitLight = lightIntent === 'light' ? resolvedLight : darkIntent === 'light' ? resolvedDark : null
  const generatedThemes = createThemesFromPalette(
    extractStablePaletteFromThemes({
      dark: explicitDark ?? resolvedDark,
      light: explicitLight ?? resolvedLight,
    }),
  )

  return {
    dark: explicitDark ?? generatedThemes.dark,
    light: explicitLight ?? generatedThemes.light,
  } satisfies Record<ThemeMode, ThemeTokens>
}

function createPreset(input: Omit<ThemePreset, 'usage'>): ThemePreset {
  return {
    ...input,
    usage: {
      dark: buildThemeUsageSegments(input.themes.dark),
      light: buildThemeUsageSegments(input.themes.light),
    },
  }
}

function buildPresetPaletteSignature(preset: ThemePreset) {
  if (!preset.palette) {
    return null
  }

  const normalizedPalette = [...new Set(preset.palette.map((color) => normalizeColorValue(color)).filter((color): color is string => color !== null))]
    .sort((left, right) => left.localeCompare(right))

  return normalizedPalette.length > 0 ? normalizedPalette.join('|') : null
}

function buildThemeTokensSignature(tokens: ThemeTokens) {
  return JSON.stringify(
    Object.entries(tokens).sort(([left], [right]) => left.localeCompare(right)),
  )
}

function buildPresetThemeSignature(preset: ThemePreset) {
  return `${buildThemeTokensSignature(preset.themes.dark)}::${buildThemeTokensSignature(preset.themes.light)}`
}

function getPresetNameQualifier(preset: ThemePreset) {
  return getPresetCategoryLabel(preset.metaLabel, preset.tags) ?? preset.sourceLabel
}

function deduplicateThemePresets(presets: ThemePreset[]) {
  const seenPaletteSignatures = new Set<string>()
  const seenThemeSignatures = new Set<string>()
  const deduplicatedPresets: ThemePreset[] = []

  for (const preset of presets) {
    const paletteSignature = buildPresetPaletteSignature(preset)
    const themeSignature = buildPresetThemeSignature(preset)

    if (seenThemeSignatures.has(themeSignature)) {
      continue
    }

    if (paletteSignature && seenPaletteSignatures.has(paletteSignature)) {
      continue
    }

    deduplicatedPresets.push(preset)
    seenThemeSignatures.add(themeSignature)

    if (paletteSignature) {
      seenPaletteSignatures.add(paletteSignature)
    }
  }

  return deduplicatedPresets
}

function ensureUniqueThemePresetNames(presets: ThemePreset[]) {
  const nameCounts = new Map<string, number>()

  for (const preset of presets) {
    const normalizedName = normalizePresetName(preset.name)

    nameCounts.set(normalizedName, (nameCounts.get(normalizedName) ?? 0) + 1)
  }

  const usedNames = new Set<string>()
  const renamedPresetCounts = new Map<string, number>()

  return presets.map((preset) => {
    const baseName = preset.name.trim()
    const normalizedBaseName = normalizePresetName(baseName)

    if ((nameCounts.get(normalizedBaseName) ?? 0) === 1 && !usedNames.has(normalizedBaseName)) {
      usedNames.add(normalizedBaseName)
      return preset
    }

    const qualifier = getPresetNameQualifier(preset)

    if (qualifier) {
      const qualifiedName = `${baseName} (${qualifier})`
      const normalizedQualifiedName = normalizePresetName(qualifiedName)

      if (!usedNames.has(normalizedQualifiedName)) {
        usedNames.add(normalizedQualifiedName)

        return {
          ...preset,
          name: qualifiedName,
        }
      }
    }

    let suffix = (renamedPresetCounts.get(normalizedBaseName) ?? 0) + 2
    let numberedName = `${baseName} (${suffix})`
    let normalizedNumberedName = normalizePresetName(numberedName)

    while (usedNames.has(normalizedNumberedName)) {
      suffix += 1
      numberedName = `${baseName} (${suffix})`
      normalizedNumberedName = normalizePresetName(numberedName)
    }

    renamedPresetCounts.set(normalizedBaseName, suffix)
    usedNames.add(normalizedNumberedName)

    return {
      ...preset,
      name: numberedName,
    }
  })
}

function createBuiltinPreset(name: string): ThemePreset {
  const theme = OPENCODE_BUILTIN_THEMES[name]
  const label = name === 'opencode' ? 'OpenCode' : titleCase(name)
  const themes = resolveBuiltinPresetThemes(theme)

  return createPreset({
    id: `opencode:${name}`,
    name: label,
    source: 'opencode',
    sourceLabel: 'OpenCode',
    palette: extractStablePaletteFromThemes(themes),
    themes,
  })
}

function createPaletteLibraryPreset(source: PaletteLibraryProviderId, sourceLabel: string, entry: PaletteLibraryEntry): ThemePreset {
  return createPreset({
    id: `${source}:${entry.id}`,
    name: buildPaletteLibraryEntryName(entry),
    source,
    sourceLabel,
    metaLabel: entry.metaLabel,
    tags: entry.tags,
    likesLabel: entry.likesLabel,
    palette: entry.palette,
    themes: createThemesFromPalette(entry.palette),
  })
}

export const THEME_PRESETS = ensureUniqueThemePresetNames(
  deduplicateThemePresets([
    ...OPENCODE_BUILTIN_THEME_NAMES.map(createBuiltinPreset),
    ...ONLINE_PALETTE_PROVIDERS.flatMap((provider) =>
      provider.entries.map((entry) =>
        createPaletteLibraryPreset(provider.id, provider.label, entry),
      ),
    ),
  ]),
)

export function createRandomThemePreset() {
  const palette = createRandomPalette()
  const randomId = `${Date.now().toString(36)}:${Math.floor(Math.random() * 100000).toString(36)}`
  const name = buildGeneratedPaletteThemeName({
    palette,
    fallbackId: randomId,
  })

  return createPreset({
    id: `random:${randomId}`,
    name,
    source: 'random',
    sourceLabel: 'Random',
    palette,
    themes: createThemesFromPalette(palette, {
      variationSeed: hashString(randomId),
    }),
  })
}

export function remixThemePreset(
  preset: ThemePreset,
  options: {
    variationSeed?: number
    remixStrength?: RemixStrength
  } = {},
) {
  if (!preset.palette) {
    return preset
  }

  const variationSeed = options.variationSeed ?? (Date.now() ^ Math.floor(Math.random() * 0xffffffff))
  const remixStrength = options.remixStrength ?? 'balanced'

  return createPreset({
    id: preset.id,
    name: preset.name,
    source: preset.source,
    sourceLabel: preset.sourceLabel,
    metaLabel: preset.metaLabel,
    tags: preset.tags,
    likesLabel: preset.likesLabel,
    palette: preset.palette,
    themes: createThemesFromPalette(preset.palette, {
      variationSeed,
      remixStrength,
    }),
  })
}

export function applyThemePresetToDraft(preset: ThemePreset, draft: ThemeDraft) {
  return createDraftFromResolvedThemes({
    id: draft.id,
    name: preset.name,
    activeMode: draft.activeMode,
    themes: preset.themes,
  })
}
