import { expandCombinedThemeFile } from '../domain/opencode/exportTheme'
import { decodeThemeInstallPayload } from '../domain/share/themeInstallCodec'
import { buildSharedDraftId, parseThemeShareLocation } from '../domain/share/themeShareLink'
import { createDraftFromResolvedThemes } from '../domain/theme/createDraftFromResolvedThemes'
import { buildThemeNameFromSlug } from '../domain/theme/themeName'
import { loadCurrentDraft } from '../persistence/drafts-db'
import { getSystemPreferredThemeMode } from './systemThemeMode'

export async function getHydratedDraft() {
  const sharedTheme = parseThemeShareLocation(window.location)
  const persisted = await loadCurrentDraft()

  if (sharedTheme) {
    const sharedDraftId = buildSharedDraftId(sharedTheme)

    if (persisted?.draft.id === sharedDraftId) {
      return persisted.draft
    }

    try {
      const decodedTheme = await decodeThemeInstallPayload(sharedTheme.encodedPayload, sharedTheme.themeSlug)

      return createDraftFromResolvedThemes({
        id: sharedDraftId,
        name: buildThemeNameFromSlug(sharedTheme.themeSlug),
        activeMode: getSystemPreferredThemeMode(),
        themes: expandCombinedThemeFile(decodedTheme.themeFile),
      })
    } catch {
      // Fall through to persisted state if the hash is invalid.
    }
  }

  return persisted?.draft ?? null
}
