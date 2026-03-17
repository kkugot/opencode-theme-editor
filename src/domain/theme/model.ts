export type ThemeMode = 'dark' | 'light'

export type SemanticGroupName =
  | 'canvas'
  | 'panel'
  | 'text'
  | 'muted'
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger'

export type ThemeTokens = {
  primary: string
  secondary: string
  accent: string
  error: string
  warning: string
  success: string
  info: string
  text: string
  textMuted: string
  background: string
  backgroundPanel: string
  backgroundElement: string
  border: string
  borderActive: string
  borderSubtle: string
  diffAdded: string
  diffRemoved: string
  diffContext: string
  diffHunkHeader: string
  diffHighlightAdded: string
  diffHighlightRemoved: string
  diffAddedBg: string
  diffRemovedBg: string
  diffContextBg: string
  diffLineNumber: string
  diffAddedLineNumberBg: string
  diffRemovedLineNumberBg: string
  markdownText: string
  markdownHeading: string
  markdownLink: string
  markdownLinkText: string
  markdownCode: string
  markdownBlockQuote: string
  markdownEmph: string
  markdownStrong: string
  markdownHorizontalRule: string
  markdownListItem: string
  markdownListEnumeration: string
  markdownImage: string
  markdownImageText: string
  markdownCodeBlock: string
  syntaxComment: string
  syntaxKeyword: string
  syntaxFunction: string
  syntaxVariable: string
  syntaxString: string
  syntaxNumber: string
  syntaxType: string
  syntaxOperator: string
  syntaxPunctuation: string
}

export type ThemeTokenName = keyof ThemeTokens

export type ThemeModeDraft = {
  semanticGroups: Record<SemanticGroupName, string>
  tokenOverrides: Partial<ThemeTokens>
}

export type ThemeDraft = {
  id: string
  name: string
  activeMode: ThemeMode
  modes: Record<ThemeMode, ThemeModeDraft>
}
