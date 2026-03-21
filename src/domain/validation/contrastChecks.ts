import { getContrastRatio } from '../theme/color'
import type { ThemeTokens } from '../theme/model'

export type ContrastCheckId =
  | 'primary-text'
  | 'muted-text'
  | 'accent-text'
  | 'composer-text'
  | 'diff-added'
  | 'code-block'

export type ContrastMeasurement = {
  id: ContrastCheckId
  label: string
  foreground: string
  background: string
  backdrop?: string
  ratio: number
}

type ContrastCheckDefinition = {
  id: ContrastCheckId
  label: string
  selectColors: (tokens: ThemeTokens) => {
    foreground: string
    background: string
    backdrop?: string
  }
}

const CONTRAST_CHECKS = [
  {
    id: 'primary-text',
    label: 'Text on background',
    selectColors: (tokens) => ({
      foreground: tokens.text,
      background: tokens.background,
      backdrop: tokens.backgroundMenu,
    }),
  },
  {
    id: 'muted-text',
    label: 'Muted text on background',
    selectColors: (tokens) => ({
      foreground: tokens.textMuted,
      background: tokens.background,
      backdrop: tokens.backgroundMenu,
    }),
  },
  {
    id: 'accent-text',
    label: 'Accent on panel',
    selectColors: (tokens) => ({
      foreground: tokens.accent,
      background: tokens.backgroundPanel,
      backdrop: tokens.background,
    }),
  },
  {
    id: 'composer-text',
    label: 'Text on element background',
    selectColors: (tokens) => ({
      foreground: tokens.text,
      background: tokens.backgroundElement,
      backdrop: tokens.backgroundPanel,
    }),
  },
  {
    id: 'diff-added',
    label: 'Diff added on added background',
    selectColors: (tokens) => ({
      foreground: tokens.diffAdded,
      background: tokens.diffAddedBg,
      backdrop: tokens.backgroundPanel,
    }),
  },
  {
    id: 'code-block',
    label: 'Markdown code block on element background',
    selectColors: (tokens) => ({
      foreground: tokens.markdownCodeBlock,
      background: tokens.backgroundElement,
      backdrop: tokens.backgroundPanel,
    }),
  },
] as const satisfies readonly ContrastCheckDefinition[]

export function measureContrastChecks(tokens: ThemeTokens): ContrastMeasurement[] {
  return CONTRAST_CHECKS.map((check) => {
    const colors = check.selectColors(tokens)

    return {
      ...colors,
      id: check.id,
      label: check.label,
      ratio: getContrastRatio(colors.foreground, colors.background, colors.backdrop),
    }
  })
}
