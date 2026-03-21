import type { ThemeTokenName, ThemeTokens } from '../theme/model'
import { THEME_TOKEN_NAMES } from '../theme/model'
import { normalizeColorValue } from '../theme/color'

export type ThemeUsageSegment = {
  color: string
  weight: number
  tokens: ThemeTokenName[]
}

const THEME_USAGE_WEIGHTS = {
  primary: 28,
  secondary: 7,
  accent: 9,
  error: 27,
  warning: 20,
  success: 20,
  info: 3,
  text: 133,
  textMuted: 145,
  selectedListItemText: 6,
  background: 10,
  backgroundPanel: 18,
  backgroundElement: 27,
  backgroundMenu: 5,
  border: 4,
  borderActive: 3,
  borderSubtle: 0,
  diffAdded: 3,
  diffRemoved: 4,
  diffContext: 1,
  diffHunkHeader: 0,
  diffHighlightAdded: 3,
  diffHighlightRemoved: 3,
  diffAddedBg: 4,
  diffRemovedBg: 4,
  diffContextBg: 7,
  diffLineNumber: 3,
  diffAddedLineNumberBg: 3,
  diffRemovedLineNumberBg: 3,
  markdownText: 0,
  markdownHeading: 7,
  markdownLink: 3,
  markdownLinkText: 2,
  markdownCode: 2,
  markdownBlockQuote: 1,
  markdownEmph: 1,
  markdownStrong: 1,
  markdownHorizontalRule: 0,
  markdownListItem: 1,
  markdownListEnumeration: 0,
  markdownImage: 0,
  markdownImageText: 0,
  markdownCodeBlock: 0,
  syntaxComment: 2,
  syntaxKeyword: 9,
  syntaxFunction: 2,
  syntaxVariable: 4,
  syntaxString: 3,
  syntaxNumber: 3,
  syntaxType: 5,
  syntaxOperator: 4,
  syntaxPunctuation: 1,
} satisfies Record<ThemeTokenName, number>

export function buildThemeUsageSegments(tokens: ThemeTokens): ThemeUsageSegment[] {
  const segmentsByColor = new Map<string, ThemeUsageSegment>()

  for (const token of THEME_TOKEN_NAMES) {
    const weight = THEME_USAGE_WEIGHTS[token]

    if (weight <= 0) {
      continue
    }

    const color = normalizeColorValue(tokens[token]) ?? '#000000'
    const existing = segmentsByColor.get(color)

    if (existing) {
      existing.weight += weight
      existing.tokens.push(token)
      continue
    }

    segmentsByColor.set(color, {
      color,
      weight,
      tokens: [token],
    })
  }

  return [...segmentsByColor.values()].sort((left, right) => right.weight - left.weight)
}
