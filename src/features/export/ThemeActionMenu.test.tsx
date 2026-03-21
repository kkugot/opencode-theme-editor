import { render, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { exportCombinedThemeFile } from '../../domain/opencode/exportTheme'
import { createDefaultThemeDraft } from '../../domain/theme/createDefaultThemeDraft'
import { resolveThemeMode } from '../../domain/theme/resolveThemeMode'
import { ThemeActionMenu } from './ThemeActionMenu'
import { encodeThemeInstallPayload, supportsThemeInstallCodec } from '../../domain/share/themeInstallCodec'

vi.mock('../../domain/share/themeInstallCodec', () => ({
  encodeThemeInstallPayload: vi.fn(),
  supportsThemeInstallCodec: vi.fn(),
}))

describe('ThemeActionMenu', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    window.history.replaceState(null, '', '/editor')
    vi.mocked(supportsThemeInstallCodec).mockReturnValue(true)
    vi.mocked(encodeThemeInstallPayload).mockResolvedValue('encoded-payload')
  })

  it('does not rewrite the current URL while preparing share actions', async () => {
    const draft = createDefaultThemeDraft()
    const replaceStateSpy = vi.spyOn(window.history, 'replaceState')

    render(
      <ThemeActionMenu
        themeSlug="shared-theme"
        themeFile={exportCombinedThemeFile(resolveThemeMode(draft.modes.dark), resolveThemeMode(draft.modes.light))}
        onDownloadDark={() => {}}
        onDownloadLight={() => {}}
        onDownloadCombined={() => {}}
      />,
    )

    await waitFor(() => {
      expect(encodeThemeInstallPayload).toHaveBeenCalled()
    })

    expect(replaceStateSpy).not.toHaveBeenCalled()
    expect(window.location.pathname).toBe('/editor')
    expect(window.location.search).toBe('')
  })
})
