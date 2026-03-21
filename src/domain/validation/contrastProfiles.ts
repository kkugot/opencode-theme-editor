import { OPENCODE_BUILTIN_THEME_NAMES, OPENCODE_BUILTIN_THEMES } from '../opencode/builtins'
import { resolveOpenCodeTheme } from '../opencode/resolveTheme'
import type { ThemeMode } from '../theme/model'
import { measureContrastChecks, type ContrastCheckId } from './contrastChecks'

export type ContrastProfile = {
  minimum: number
  preferredMin: number
  preferredMax: number
  observedMin: number
  observedMax: number
}

type ContrastProfileConstraint = {
  minimum: number
  baselineTarget: number
  preferredCap: number
}

const CONTRAST_PROFILE_CONSTRAINTS = {
  'primary-text': {
    minimum: 4.25,
    baselineTarget: 4.5,
    preferredCap: 8.75,
  },
  'muted-text': {
    minimum: 2.4,
    baselineTarget: 3,
    preferredCap: 5.2,
  },
  'accent-text': {
    minimum: 1.75,
    baselineTarget: 3,
    preferredCap: 5.5,
  },
  'composer-text': {
    minimum: 4,
    baselineTarget: 4.5,
    preferredCap: 8.75,
  },
  'diff-added': {
    minimum: 1.75,
    baselineTarget: 3,
    preferredCap: 5.25,
  },
  'code-block': {
    minimum: 4,
    baselineTarget: 4.5,
    preferredCap: 8.5,
  },
} satisfies Record<ContrastCheckId, ContrastProfileConstraint>

function roundToHundredths(value: number) {
  return Math.round(value * 100) / 100
}

function quantile(values: readonly number[], position: number) {
  if (values.length === 0) {
    return 0
  }

  const boundedPosition = Math.max(0, Math.min(1, position))
  const scaledIndex = (values.length - 1) * boundedPosition
  const lowerIndex = Math.floor(scaledIndex)
  const upperIndex = Math.ceil(scaledIndex)
  const lowerValue = values[lowerIndex] ?? values[0] ?? 0
  const upperValue = values[upperIndex] ?? values.at(-1) ?? lowerValue

  if (lowerIndex === upperIndex) {
    return lowerValue
  }

  const mixAmount = scaledIndex - lowerIndex

  return lowerValue + (upperValue - lowerValue) * mixAmount
}

function buildContrastProfiles() {
  const measurements = Object.fromEntries(
    Object.keys(CONTRAST_PROFILE_CONSTRAINTS).map((key) => [key, [] as number[]]),
  ) as Record<ContrastCheckId, number[]>
  const modes: ThemeMode[] = ['dark', 'light']

  for (const themeName of OPENCODE_BUILTIN_THEME_NAMES) {
    const theme = OPENCODE_BUILTIN_THEMES[themeName]

    for (const mode of modes) {
      const tokens = resolveOpenCodeTheme(theme, mode)

      for (const measurement of measureContrastChecks(tokens)) {
        measurements[measurement.id].push(measurement.ratio)
      }
    }
  }

  return Object.fromEntries(
    (Object.entries(CONTRAST_PROFILE_CONSTRAINTS) as [ContrastCheckId, ContrastProfileConstraint][]).map(
      ([id, constraint]) => {
        const ratios = [...measurements[id]].sort((left, right) => left - right)
        const observedMin = ratios[0] ?? constraint.minimum
        const observedMax = ratios.at(-1) ?? constraint.preferredCap
        const preferredMin = Math.max(
          constraint.minimum,
          Math.min(constraint.baselineTarget, quantile(ratios, 0.2)),
        )
        const preferredMax = Math.max(
          preferredMin + 0.4,
          Math.min(quantile(ratios, 0.65), constraint.preferredCap),
        )

        return [
          id,
          {
            minimum: roundToHundredths(constraint.minimum),
            preferredMin: roundToHundredths(preferredMin),
            preferredMax: roundToHundredths(preferredMax),
            observedMin: roundToHundredths(observedMin),
            observedMax: roundToHundredths(observedMax),
          },
        ]
      },
    ),
  ) as Record<ContrastCheckId, ContrastProfile>
}

export const CONTRAST_PROFILES = buildContrastProfiles()

export function getContrastProfile(id: ContrastCheckId) {
  return CONTRAST_PROFILES[id]
}

export function sampleContrastTarget(id: ContrastCheckId, random: () => number) {
  const profile = getContrastProfile(id)
  const variation = (random() + random()) / 2

  return profile.preferredMin + (profile.preferredMax - profile.preferredMin) * variation
}
