import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ThemeStoreProvider } from './theme-store'
import { useThemeDraft } from './theme-store-hooks'

function DraftModeProbe() {
  const draft = useThemeDraft()

  return <span>{draft.activeMode}</span>
}

describe('ThemeStoreProvider', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('uses the system preferred light mode for the initial draft', () => {
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

    render(
      <ThemeStoreProvider>
        <DraftModeProbe />
      </ThemeStoreProvider>,
    )

    expect(screen.getByText('light')).toBeInTheDocument()
  })
})
