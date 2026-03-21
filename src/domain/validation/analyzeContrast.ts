import type { ThemeTokens } from '../theme/model'
import { measureContrastChecks } from './contrastChecks'
import { getContrastProfile } from './contrastProfiles'

export type ContrastSeverity = 'good' | 'warning'

export type ContrastWarning = {
  id: string
  label: string
  foreground: string
  background: string
  ratio: number
  target: number
  preferredMin: number
  preferredMax: number
  severity: ContrastSeverity
}

export function analyzeContrast(tokens: ThemeTokens): ContrastWarning[] {
  return measureContrastChecks(tokens).map((check) => {
    const profile = getContrastProfile(check.id)

    return {
      ...check,
      target: profile.minimum,
      preferredMin: profile.preferredMin,
      preferredMax: profile.preferredMax,
      severity: check.ratio >= profile.minimum ? 'good' : 'warning',
    }
  })
}
