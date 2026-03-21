import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { exportCombinedThemeFile } from '../domain/opencode/exportTheme'
import { buildSharedDraftId } from '../domain/share/themeShareLink'
import { createDefaultThemeDraft } from '../domain/theme/createDefaultThemeDraft'
import { resolveThemeMode } from '../domain/theme/resolveThemeMode'
import { getHydratedDraft } from './hydrateDraft'
import { loadCurrentDraft } from '../persistence/drafts-db'
import { decodeThemeInstallPayload } from '../domain/share/themeInstallCodec'

vi.mock('../persistence/drafts-db', () => ({
  loadCurrentDraft: vi.fn(),
}))

vi.mock('../domain/share/themeInstallCodec', () => ({
  decodeThemeInstallPayload: vi.fn(),
}))

describe('getHydratedDraft', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    window.history.replaceState(null, '', '/')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('reuses the persisted draft for the same shared link', async () => {
    const sharedTheme = {
      themeSlug: 'shared-theme',
      encodedPayload: 'encoded-payload',
    }
    const persistedDraft = {
      ...createDefaultThemeDraft(),
      id: buildSharedDraftId(sharedTheme),
      name: 'Local edits',
    }

    vi.mocked(loadCurrentDraft).mockResolvedValue({
      version: 1,
      savedAt: '2026-03-21T12:00:00.000Z',
      draft: persistedDraft,
    })
    window.history.replaceState(null, '', `/?${sharedTheme.themeSlug}=${sharedTheme.encodedPayload}`)

    const hydratedDraft = await getHydratedDraft()

    expect(hydratedDraft).toBe(persistedDraft)
    expect(decodeThemeInstallPayload).not.toHaveBeenCalled()
  })

  it('imports a shared theme when the saved draft belongs to something else', async () => {
    const sharedTheme = {
      themeSlug: 'shared-theme',
      encodedPayload: 'encoded-payload',
    }
    const sourceDraft = createDefaultThemeDraft()

    vi.mocked(loadCurrentDraft).mockResolvedValue({
      version: 1,
      savedAt: '2026-03-21T12:00:00.000Z',
      draft: createDefaultThemeDraft(),
    })
    vi.mocked(decodeThemeInstallPayload).mockResolvedValue({
      themeSlug: sharedTheme.themeSlug,
      themeFile: exportCombinedThemeFile(resolveThemeMode(sourceDraft.modes.dark), resolveThemeMode(sourceDraft.modes.light)),
    })
    vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-color-scheme: light)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })))
    window.history.replaceState(null, '', `/?${sharedTheme.themeSlug}=${sharedTheme.encodedPayload}`)

    const hydratedDraft = await getHydratedDraft()

    expect(decodeThemeInstallPayload).toHaveBeenCalledWith(sharedTheme.encodedPayload, sharedTheme.themeSlug)
    expect(hydratedDraft?.id).toBe(buildSharedDraftId(sharedTheme))
    expect(hydratedDraft?.activeMode).toBe('light')
  })
})
