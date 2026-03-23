import { useMemo } from 'react'
import type { RemixStrength } from '../../domain/presets/themePresets'
import type { SemanticGroupName, ThemeMode } from '../../domain/theme/model'
import {
  colorToHsl,
  darken,
  getColorInputValue,
  getColorLightness,
  hslToColor,
  hueDistance,
  lighten,
  mixColors,
  normalizeColorValue,
  parseColor,
} from '../../domain/theme/color'

const SIGNAL_COLOR_BASES: Record<'success' | 'warning' | 'danger', string> = {
  success: '#4fd675',
  warning: '#f5b83d',
  danger: '#f15b6c',
}

const semanticSections: Array<{
  title: string
  groups: SemanticGroupName[]
}> = [
  {
    title: 'Foundation',
    groups: ['canvas', 'panel', 'text', 'muted', 'accent'],
  },
  {
    title: 'Signals',
    groups: ['success', 'warning', 'danger'],
  },
]

type SemanticColorEditorProps = {
  activeMode: ThemeMode
  semanticGroups: Record<SemanticGroupName, string>
  randomPalette: string[]
  onChange: (group: SemanticGroupName, value: string) => void
  onRandomize: () => void
  onShuffleRandomize: (strength: RemixStrength) => void
  onUndoGeneratedPalette: () => void
  onUndoShuffleRandomize: () => void
  canUndoGeneratedPalette: boolean
  canUndoShuffleRandomize: boolean
  onChangeRandomPaletteColor: (index: number, value: string) => void
}

const REMIX_ACTIONS: Array<{ strength: RemixStrength; label: string; pips: 2 | 4 | 6 }> = [
  { strength: 'subtle', label: 'Soft shuffle', pips: 2 },
  { strength: 'balanced', label: 'Balanced shuffle', pips: 4 },
  { strength: 'wild', label: 'Wild shuffle', pips: 6 },
]

const SUGGESTION_COUNT = 5

const FOUNDATION_LIGHTNESS_STOPS = {
  dark: {
    canvas: [0.04, 0.06, 0.08, 0.1, 0.12],
    panel: [0.11, 0.13, 0.155, 0.18, 0.21],
    text: [0.72, 0.78, 0.84, 0.88, 0.92],
    muted: [0.48, 0.54, 0.6, 0.66, 0.72],
    accent: [0.5, 0.56, 0.62, 0.68, 0.74],
  },
  light: {
    canvas: [0.93, 0.95, 0.97, 0.985, 0.995],
    panel: [0.86, 0.89, 0.92, 0.95, 0.97],
    text: [0.08, 0.12, 0.16, 0.2, 0.24],
    muted: [0.36, 0.42, 0.48, 0.54, 0.6],
    accent: [0.38, 0.46, 0.54, 0.62, 0.68],
  },
} satisfies Record<ThemeMode, Record<Exclude<SemanticGroupName, 'success' | 'warning' | 'danger'>, number[]>>

const SIGNAL_LIGHTNESS_LIMITS = {
  dark: {
    success: [0.46, 0.64],
    warning: [0.52, 0.7],
    danger: [0.54, 0.68],
  },
  light: {
    success: [0.34, 0.5],
    warning: [0.42, 0.58],
    danger: [0.48, 0.62],
  },
} satisfies Record<ThemeMode, Record<'success' | 'warning' | 'danger', [number, number]>>

const SIGNAL_SATURATION_LIMITS = {
  dark: {
    success: [0.42, 0.66],
    warning: [0.5, 0.72],
    danger: [0.48, 0.7],
  },
  light: {
    success: [0.34, 0.56],
    warning: [0.42, 0.62],
    danger: [0.42, 0.64],
  },
} satisfies Record<ThemeMode, Record<'success' | 'warning' | 'danger', [number, number]>>

function clampUnit(value: number) {
  return Math.max(0, Math.min(1, value))
}

function clampRange(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(maximum, value))
}

function dedupeSuggestions(colors: string[]) {
  return colors.filter((color, index) => colors.findIndex((candidate) => candidate === color) === index)
}

function finalizeSuggestions(colors: string[]) {
  const uniqueSuggestions = dedupeSuggestions(colors)

  if (uniqueSuggestions.length >= SUGGESTION_COUNT) {
    return uniqueSuggestions.slice(0, SUGGESTION_COUNT)
  }

  const expandedSuggestions = [...uniqueSuggestions]
  const candidateSources = dedupeSuggestions(colors)
  const adjustmentSteps = [0.02, 0.04, 0.06, 0.08]

  for (const step of adjustmentSteps) {
    for (const color of candidateSources) {
      const darker = normalizeColorValue(darken(color, step))

      if (darker && !expandedSuggestions.includes(darker)) {
        expandedSuggestions.push(darker)
      }

      if (expandedSuggestions.length >= SUGGESTION_COUNT) {
        return sortPaletteByLightness(expandedSuggestions).slice(0, SUGGESTION_COUNT)
      }

      const lighter = normalizeColorValue(lighten(color, step))

      if (lighter && !expandedSuggestions.includes(lighter)) {
        expandedSuggestions.push(lighter)
      }

      if (expandedSuggestions.length >= SUGGESTION_COUNT) {
        return sortPaletteByLightness(expandedSuggestions).slice(0, SUGGESTION_COUNT)
      }
    }
  }

  return sortPaletteByLightness(expandedSuggestions).slice(0, SUGGESTION_COUNT)
}

function getPaletteVividColors(palette: string[]) {
  return [...palette].sort((left, right) => {
    const leftHsl = colorToHsl(left)
    const rightHsl = colorToHsl(right)
    const score = (value: ReturnType<typeof colorToHsl>) => (value?.s ?? 0) * 1.75 + (1 - Math.abs((value?.l ?? 0.5) - 0.56)) * 0.35

    return score(rightHsl) - score(leftHsl)
  })
}

function reframeSuggestionColor(
  value: string,
  lightness: number,
  minimumSaturation: number,
  maximumSaturation: number,
  targetHue?: number,
) {
  const hsl = colorToHsl(value)

  if (!hsl) {
    return hslToColor(targetHue ?? 220, minimumSaturation, lightness)
  }

  return hslToColor(
    targetHue ?? hsl.h,
    Math.min(Math.max(hsl.s, minimumSaturation), maximumSaturation),
    clampUnit(lightness),
    hsl.a,
  )
}

function buildScaleFromAnchors(
  anchors: string[],
  lightnessStops: number[],
  minimumSaturation: number,
  maximumSaturation: number,
  targetHue?: number,
) {
  const normalizedAnchors = anchors.map((anchor) => normalizeColorValue(anchor) ?? anchor)
  const fallbackAnchor = normalizedAnchors.at(-1) ?? '#5fa8ff'

  return finalizeSuggestions(
    lightnessStops.map((stop, index) => {
      const anchor = normalizedAnchors[index] ?? fallbackAnchor

      return normalizeColorValue(reframeSuggestionColor(anchor, stop, minimumSaturation, maximumSaturation, targetHue)) ?? anchor
    }),
  )
}

function buildCenteredStops(center: number, minimum: number, maximum: number, step: number) {
  return [-2, -1, 0, 1, 2].map((offset) => clampRange(center + offset * step, minimum, maximum))
}

function getColorDistance(left: string, right: string) {
  const leftColor = parseColor(left)
  const rightColor = parseColor(right)

  if (!leftColor || !rightColor) {
    return Number.POSITIVE_INFINITY
  }

  return Math.sqrt(
    (leftColor.r - rightColor.r) ** 2 +
      (leftColor.g - rightColor.g) ** 2 +
      (leftColor.b - rightColor.b) ** 2,
  )
}

function getClosestSuggestion(value: string, suggestions: string[]) {
  const normalizedValue = normalizeColorValue(value) ?? value

  return suggestions.reduce<string | null>((closest, suggestion) => {
    if (!closest) {
      return suggestion
    }

    return getColorDistance(normalizedValue, suggestion) < getColorDistance(normalizedValue, closest) ? suggestion : closest
  }, null)
}

function buildSelectableSuggestions(current: string, suggestions: string[]) {
  const normalizedCurrent = normalizeColorValue(current)

  if (!normalizedCurrent || suggestions.includes(normalizedCurrent)) {
    return suggestions
  }

  const closestSuggestion = getClosestSuggestion(normalizedCurrent, suggestions)

  if (!closestSuggestion) {
    return suggestions
  }

  const closestIndex = suggestions.indexOf(closestSuggestion)

  if (closestIndex < 0) {
    return suggestions
  }

  return suggestions.map((suggestion, index) => (index === closestIndex ? normalizedCurrent : suggestion))
}

function sortPaletteByLightness(palette: string[]) {
  return [...palette].sort((left, right) => {
    const leftLightness = getColorLightness(left) ?? 0
    const rightLightness = getColorLightness(right) ?? 0

    return leftLightness - rightLightness
  })
}

function DiceIcon({ pips }: { pips: 2 | 4 | 6 }) {
  const pipMap: Record<2 | 4 | 6, Array<[number, number]>> = {
    2: [
      [8.5, 8.5],
      [15.5, 15.5],
    ],
    4: [
      [8.5, 8.5],
      [15.5, 8.5],
      [8.5, 15.5],
      [15.5, 15.5],
    ],
    6: [
      [8.5, 8],
      [15.5, 8],
      [8.5, 12],
      [15.5, 12],
      [8.5, 16],
      [15.5, 16],
    ],
  }

  return (
    <svg className="semantic-random-icon" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4.75" y="4.75" width="14.5" height="14.5" rx="3.25" fill="none" stroke="currentColor" strokeWidth="1.7" />
      {pipMap[pips].map(([cx, cy]) => (
        <circle key={`${pips}-${cx}-${cy}`} cx={cx} cy={cy} r="1.08" fill="currentColor" />
      ))}
    </svg>
  )
}

function UndoIcon() {
  return (
    <svg className="semantic-random-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M10 7.5 6 11.5l4 4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
      <path d="M6.5 11.5H14a4.5 4.5 0 1 1 0 9h-2.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </svg>
  )
}

function buildFoundationSuggestions(
  group: Exclude<SemanticGroupName, 'success' | 'warning' | 'danger'>,
  palette: string[],
  activeMode: ThemeMode,
) {
  const sortedPalette = sortPaletteByLightness(palette)
  const darkest = sortedPalette[0] ?? palette[0] ?? '#101827'
  const secondDarkest = sortedPalette[1] ?? darkest
  const middle = sortedPalette[Math.floor(sortedPalette.length / 2)] ?? secondDarkest
  const secondLightest = sortedPalette.at(-2) ?? middle
  const lightest = sortedPalette.at(-1) ?? secondLightest
  const vividPalette = getPaletteVividColors(sortedPalette)
  const vivid = vividPalette[0] ?? middle
  const vividSecondary = vividPalette[1] ?? vivid
  const surfaceAnchors = activeMode === 'dark'
    ? [darkest, mixColors(darkest, secondDarkest, 0.2), secondDarkest, mixColors(secondDarkest, middle, 0.12), middle]
    : [middle, mixColors(middle, secondLightest, 0.22), secondLightest, mixColors(secondLightest, lightest, 0.35), lightest]
  const panelAnchors = activeMode === 'dark'
    ? [secondDarkest, mixColors(secondDarkest, middle, 0.14), middle, mixColors(middle, secondLightest, 0.12), secondLightest]
    : [darkest, middle, mixColors(middle, secondLightest, 0.28), secondLightest, lightest]
  const textAnchors = activeMode === 'dark'
    ? [middle, secondLightest, secondLightest, lightest, lightest]
    : [darkest, mixColors(darkest, secondDarkest, 0.15), secondDarkest, mixColors(secondDarkest, middle, 0.18), middle]
  const mutedAnchors = activeMode === 'dark'
    ? [middle, mixColors(middle, secondLightest, 0.1), secondLightest, mixColors(secondLightest, lightest, 0.08), lightest]
    : [darkest, secondDarkest, mixColors(secondDarkest, middle, 0.18), middle, mixColors(middle, secondLightest, 0.1)]
  const accentAnchors = [
    mixColors(vivid, darkest, activeMode === 'dark' ? 0.08 : 0.14),
    vivid,
    mixColors(vivid, vividSecondary, 0.2),
    vividSecondary,
    mixColors(vivid, lightest, activeMode === 'dark' ? 0.08 : 0.12),
  ]

  switch (group) {
    case 'canvas':
      return buildScaleFromAnchors(surfaceAnchors, FOUNDATION_LIGHTNESS_STOPS[activeMode].canvas, 0.01, activeMode === 'dark' ? 0.18 : 0.08)
    case 'panel':
      return buildScaleFromAnchors(panelAnchors, FOUNDATION_LIGHTNESS_STOPS[activeMode].panel, 0.02, activeMode === 'dark' ? 0.22 : 0.12)
    case 'text':
      return buildScaleFromAnchors(textAnchors, FOUNDATION_LIGHTNESS_STOPS[activeMode].text, 0.01, activeMode === 'dark' ? 0.14 : 0.22)
    case 'muted':
      return buildScaleFromAnchors(mutedAnchors, FOUNDATION_LIGHTNESS_STOPS[activeMode].muted, 0.03, activeMode === 'dark' ? 0.2 : 0.24)
    case 'accent':
      return buildScaleFromAnchors(accentAnchors, FOUNDATION_LIGHTNESS_STOPS[activeMode].accent, 0.42, 0.95)
  }
}

function buildSignalSuggestions(
  group: 'success' | 'warning' | 'danger',
  palette: string[],
  activeMode: ThemeMode,
  currentColor: string,
) {
  const signalBase = SIGNAL_COLOR_BASES[group]
  const vividPalette = getPaletteVividColors(palette)
  const vivid = vividPalette[0] ?? signalBase
  const targetHue = colorToHsl(signalBase)?.h
  const currentHsl = colorToHsl(currentColor)
  const currentHueDistance = currentHsl && targetHue !== undefined ? hueDistance(currentHsl.h, targetHue) : Number.POSITIVE_INFINITY
  const [minimumLightness, maximumLightness] = SIGNAL_LIGHTNESS_LIMITS[activeMode][group]
  const [minimumSaturation, maximumSaturation] = SIGNAL_SATURATION_LIMITS[activeMode][group]
  const vividSaturation = colorToHsl(vivid)?.s ?? 0.5
  const fallbackLightness = activeMode === 'dark'
    ? (minimumLightness + maximumLightness) / 2
    : minimumLightness + (maximumLightness - minimumLightness) * 0.55
  const fallbackAnchor = reframeSuggestionColor(
    mixColors(signalBase, vivid, activeMode === 'dark' ? 0.08 : 0.12),
    fallbackLightness,
    clampRange(vividSaturation * 0.3 + 0.18, minimumSaturation, maximumSaturation),
    maximumSaturation,
    targetHue,
  )
  const anchorSource = currentHueDistance <= 28 ? currentColor : fallbackAnchor
  const anchorHsl = colorToHsl(anchorSource) ?? colorToHsl(fallbackAnchor)
  const centeredLightness = clampRange(anchorHsl?.l ?? fallbackLightness, minimumLightness, maximumLightness)
  const stops = buildCenteredStops(centeredLightness, minimumLightness, maximumLightness, activeMode === 'dark' ? 0.03 : 0.025)
  const repeatedAnchors = Array.from({ length: SUGGESTION_COUNT }, () => anchorSource)

  return buildScaleFromAnchors(
    repeatedAnchors,
    stops,
    minimumSaturation,
    maximumSaturation,
    targetHue,
  )
}

function buildGroupSuggestions(
  group: SemanticGroupName,
  palette: string[],
  activeMode: ThemeMode,
  semanticGroups: Record<SemanticGroupName, string>,
) {
  if (group === 'success' || group === 'warning' || group === 'danger') {
    return buildSignalSuggestions(group, palette, activeMode, semanticGroups[group])
  }

  return buildFoundationSuggestions(group, palette, activeMode)
}

export function SemanticColorEditor({
  activeMode,
  semanticGroups,
  randomPalette,
  onChange,
  onRandomize,
  onShuffleRandomize,
  onUndoGeneratedPalette,
  onUndoShuffleRandomize,
  canUndoGeneratedPalette,
  canUndoShuffleRandomize,
  onChangeRandomPaletteColor,
}: SemanticColorEditorProps) {
  const suggestionMap = useMemo(
    () =>
      Object.fromEntries(
        semanticSections.flatMap((section) => section.groups.map((group) => [group, buildGroupSuggestions(group, randomPalette, activeMode, semanticGroups)])),
      ) as Record<SemanticGroupName, string[]>,
    [activeMode, randomPalette, semanticGroups],
  )
  const randomPaletteRows = useMemo(() => {
    if (randomPalette.length === 0) {
      return [] as Array<Array<{ color: string; index: number }>>
    }

    if (randomPalette.length < 4) {
      return [randomPalette.map((color, index) => ({ color, index }))]
    }

    const splitIndex = Math.ceil(randomPalette.length / 2)

    return [
      randomPalette.slice(0, splitIndex).map((color, index) => ({ color, index })),
      randomPalette.slice(splitIndex).map((color, index) => ({ color, index: index + splitIndex })),
    ]
  }, [randomPalette])

  return (
    <section className="semantic-editor panel-card">
      <section className="editor-group semantic-editor-toolbar-group">
        <div className="editor-group-header semantic-editor-toolbar-header">
          <p className="editor-group-label">Color Palette</p>
        </div>

        <p className="editor-group-caption semantic-editor-toolbar-caption">
          Theme generation balances contrast, luminosity, and color relationships so surfaces, accents, and signals stay readable together. When you like the palette, throw the dice to shuffle the generated theme softly, harder, or completely insane.
        </p>

        <div className="semantic-generated-palette-row">
          <div className="semantic-generated-controls">
            <div className="semantic-random-pill-group semantic-random-generate-group" role="group" aria-label="Generate palette controls">
              <button type="button" className="semantic-random-group-button semantic-random-generate-button" onClick={onRandomize}>
                Generate
              </button>

              <button
                type="button"
                className="semantic-random-group-button"
                aria-label="Undo generated palette"
                title="Undo generated palette"
                disabled={!canUndoGeneratedPalette}
                onClick={onUndoGeneratedPalette}
              >
                <UndoIcon />
              </button>
            </div>

            <div className="semantic-random-pill-group semantic-random-button-group" role="group" aria-label="Shuffle palette generation">
              {REMIX_ACTIONS.map((action) => (
                <button
                  key={action.strength}
                  type="button"
                  className="semantic-random-group-button"
                  aria-label={action.label}
                  title={action.label}
                  onClick={() => {
                    onShuffleRandomize(action.strength)
                  }}
                >
                  <DiceIcon pips={action.pips} />
                </button>
              ))}

              <button
                type="button"
                className="semantic-random-group-button"
                aria-label="Undo palette shuffle"
                title="Undo palette shuffle"
                disabled={!canUndoShuffleRandomize}
                onClick={onUndoShuffleRandomize}
              >
                <UndoIcon />
              </button>
            </div>
          </div>

          {randomPalette.length > 0 ? (
            <div
              className={
                randomPaletteRows.length > 1
                  ? 'semantic-generated-palette semantic-generated-palette-balanced'
                  : 'semantic-generated-palette'
              }
              aria-label="Generated random palette"
            >
              {randomPaletteRows.map((paletteRow, rowIndex) => (
                <div key={`generated-palette-row-${rowIndex}`} className="semantic-generated-palette-line">
                  {paletteRow.map(({ color, index }) => (
                    <label
                      key={`generated-palette-${index}`}
                      className="semantic-generated-palette-chip semantic-generated-palette-chip-pill"
                      style={{ background: normalizeColorValue(color) ?? color }}
                      title={color}
                    >
                      <input
                        type="color"
                        value={getColorInputValue(color)}
                        aria-label={`Generated palette color ${index + 1}`}
                        onChange={(event) => {
                          onChangeRandomPaletteColor(index, event.target.value)
                        }}
                      />
                    </label>
                  ))}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <div className="editor-groups">
        {semanticSections.map((section) => (
          <section key={section.title} className="editor-group">
            <div className="editor-group-header">
              <p className="editor-group-label">{section.title}</p>
            </div>

            <div className="color-grid">
              {section.groups.map((group) => {
                const selectedColor = normalizeColorValue(semanticGroups[group]) ?? semanticGroups[group]
                const selectableSuggestions = buildSelectableSuggestions(selectedColor, suggestionMap[group])
                const colorInputId = `semantic-color-${group}`

                return (
                  <div key={group} className="color-field color-row color-row-compact">
                    <label
                      className="semantic-generated-palette-chip semantic-generated-palette-well"
                      style={{ background: normalizeColorValue(selectedColor) ?? selectedColor }}
                      title={selectedColor}
                    >
                      <input
                        id={colorInputId}
                        type="color"
                        value={getColorInputValue(selectedColor)}
                        aria-label={`${group} color`}
                        onChange={(event) => {
                          onChange(group, event.target.value)
                        }}
                      />
                    </label>

                    <div className="color-row-copy">
                      <label className="color-row-label" htmlFor={colorInputId}>
                        {group}
                      </label>
                    </div>

                    <input
                      type="text"
                      className="color-value semantic-color-value"
                      value={selectedColor}
                      aria-label={`${group} value`}
                      readOnly
                    />

                    {randomPalette.length > 0 ? (
                      <div className="semantic-color-suggestions" aria-label={`${group} palette choices`}>
                        {selectableSuggestions.map((color, index) => {
                          const normalized = normalizeColorValue(color) ?? color
                          const isActive = selectedColor === normalized

                          return (
                            <button
                              key={`${group}-${color}-${index}`}
                              type="button"
                              className={isActive ? 'semantic-color-suggestion active' : 'semantic-color-suggestion'}
                              style={{
                                ['--semantic-swatch-color' as string]: normalized,
                              }}
                              aria-label={`Set ${group} to ${normalized}`}
                              aria-pressed={isActive}
                              onClick={() => onChange(group, normalized)}
                            />
                          )
                        })}
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </section>
  )
}
