import type { ThemeMode, ThemeModeDraft, ThemeTokens } from './model'

function mix(hex: string, amount: number, target: number) {
  const value = Number.parseInt(hex.slice(1), 16)
  const r = (value >> 16) & 0xff
  const g = (value >> 8) & 0xff
  const b = value & 0xff

  const next = (channel: number) => Math.round(channel + (target - channel) * amount)

  return `#${[next(r), next(g), next(b)].map((channel) => channel.toString(16).padStart(2, '0')).join('')}`
}

export function lighten(hex: string, amount: number) {
  return mix(hex, amount, 255)
}

export function darken(hex: string, amount: number) {
  return mix(hex, amount, 0)
}

function normalizeHex(value: string) {
  return /^#[0-9a-f]{6}$/i.test(value) ? value : '#000000'
}

function invertTowardMode(hex: string, targetMode: ThemeMode) {
  const safeHex = normalizeHex(hex)

  if (targetMode === 'light') {
    return lighten(darken(safeHex, 0.78), 0.9)
  }

  return darken(lighten(safeHex, 0.78), 0.78)
}

export function generateSiblingMode(source: ThemeModeDraft, targetMode: ThemeMode): ThemeModeDraft {
  return {
    semanticGroups: {
      canvas:
        targetMode === 'light'
          ? lighten(darken(source.semanticGroups.canvas, 0.82), 0.94)
          : darken(source.semanticGroups.canvas, 0.18),
      panel:
        targetMode === 'light'
          ? lighten(darken(source.semanticGroups.panel, 0.8), 0.97)
          : darken(source.semanticGroups.panel, 0.14),
      text:
        targetMode === 'light'
          ? darken(source.semanticGroups.text, 0.86)
          : lighten(source.semanticGroups.text, 0.12),
      muted: invertTowardMode(source.semanticGroups.muted, targetMode),
      accent: invertTowardMode(source.semanticGroups.accent, targetMode),
      success: invertTowardMode(source.semanticGroups.success, targetMode),
      warning: invertTowardMode(source.semanticGroups.warning, targetMode),
      danger: invertTowardMode(source.semanticGroups.danger, targetMode),
    },
    tokenOverrides: {},
  }
}

export function resolveThemeMode(mode: ThemeModeDraft): ThemeTokens {
  const { semanticGroups, tokenOverrides } = mode

  const backgroundElement = lighten(semanticGroups.panel, 0.06)
  const border = lighten(semanticGroups.panel, 0.18)
  const borderActive = semanticGroups.accent
  const borderSubtle = lighten(semanticGroups.panel, 0.1)
  const diffAddedBg = darken(semanticGroups.success, 0.72)
  const diffRemovedBg = darken(semanticGroups.danger, 0.74)
  const diffContextBg = semanticGroups.panel

  const derived: ThemeTokens = {
    primary: semanticGroups.accent,
    secondary: lighten(semanticGroups.accent, 0.18),
    accent: lighten(semanticGroups.accent, 0.12),
    error: semanticGroups.danger,
    warning: semanticGroups.warning,
    success: semanticGroups.success,
    info: lighten(semanticGroups.accent, 0.08),
    text: semanticGroups.text,
    textMuted: semanticGroups.muted,
    background: semanticGroups.canvas,
    backgroundPanel: semanticGroups.panel,
    backgroundElement,
    border,
    borderActive,
    borderSubtle,
    diffAdded: semanticGroups.success,
    diffRemoved: semanticGroups.danger,
    diffContext: semanticGroups.muted,
    diffHunkHeader: lighten(semanticGroups.accent, 0.2),
    diffHighlightAdded: lighten(semanticGroups.success, 0.16),
    diffHighlightRemoved: lighten(semanticGroups.danger, 0.12),
    diffAddedBg,
    diffRemovedBg,
    diffContextBg,
    diffLineNumber: semanticGroups.muted,
    diffAddedLineNumberBg: darken(semanticGroups.success, 0.78),
    diffRemovedLineNumberBg: darken(semanticGroups.danger, 0.8),
    markdownText: semanticGroups.text,
    markdownHeading: semanticGroups.accent,
    markdownLink: semanticGroups.accent,
    markdownLinkText: lighten(semanticGroups.accent, 0.18),
    markdownCode: semanticGroups.success,
    markdownBlockQuote: semanticGroups.warning,
    markdownEmph: semanticGroups.warning,
    markdownStrong: lighten(semanticGroups.warning, 0.06),
    markdownHorizontalRule: borderSubtle,
    markdownListItem: semanticGroups.accent,
    markdownListEnumeration: lighten(semanticGroups.accent, 0.18),
    markdownImage: semanticGroups.accent,
    markdownImageText: lighten(semanticGroups.accent, 0.18),
    markdownCodeBlock: semanticGroups.text,
    syntaxComment: semanticGroups.muted,
    syntaxKeyword: semanticGroups.accent,
    syntaxFunction: lighten(semanticGroups.accent, 0.16),
    syntaxVariable: semanticGroups.danger,
    syntaxString: semanticGroups.success,
    syntaxNumber: semanticGroups.warning,
    syntaxType: lighten(semanticGroups.warning, 0.06),
    syntaxOperator: lighten(semanticGroups.accent, 0.12),
    syntaxPunctuation: semanticGroups.text,
  }

  return {
    ...derived,
    ...tokenOverrides,
  }
}
