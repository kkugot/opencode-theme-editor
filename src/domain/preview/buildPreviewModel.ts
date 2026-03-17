import type { ThemeMode, ThemeTokens } from '../theme/model'

export type PreviewModel = {
  mode: ThemeMode
  draftName: string
  tokens: ThemeTokens
}

export function buildPreviewModel(input: PreviewModel): PreviewModel {
  return input
}
