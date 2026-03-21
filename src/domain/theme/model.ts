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

export const SEMANTIC_GROUP_NAMES = [
  'canvas',
  'panel',
  'text',
  'muted',
  'accent',
  'success',
  'warning',
  'danger',
] as const satisfies SemanticGroupName[]

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
  selectedListItemText: string
  background: string
  backgroundPanel: string
  backgroundElement: string
  backgroundMenu: string
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

export const THEME_TOKEN_NAMES = [
  'primary',
  'secondary',
  'accent',
  'error',
  'warning',
  'success',
  'info',
  'text',
  'textMuted',
  'selectedListItemText',
  'background',
  'backgroundPanel',
  'backgroundElement',
  'backgroundMenu',
  'border',
  'borderActive',
  'borderSubtle',
  'diffAdded',
  'diffRemoved',
  'diffContext',
  'diffHunkHeader',
  'diffHighlightAdded',
  'diffHighlightRemoved',
  'diffAddedBg',
  'diffRemovedBg',
  'diffContextBg',
  'diffLineNumber',
  'diffAddedLineNumberBg',
  'diffRemovedLineNumberBg',
  'markdownText',
  'markdownHeading',
  'markdownLink',
  'markdownLinkText',
  'markdownCode',
  'markdownBlockQuote',
  'markdownEmph',
  'markdownStrong',
  'markdownHorizontalRule',
  'markdownListItem',
  'markdownListEnumeration',
  'markdownImage',
  'markdownImageText',
  'markdownCodeBlock',
  'syntaxComment',
  'syntaxKeyword',
  'syntaxFunction',
  'syntaxVariable',
  'syntaxString',
  'syntaxNumber',
  'syntaxType',
  'syntaxOperator',
  'syntaxPunctuation',
] as const satisfies ThemeTokenName[]

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
