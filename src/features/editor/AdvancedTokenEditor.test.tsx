import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { THEME_TOKEN_NAMES, type ThemeTokens } from '../../domain/theme/model'
import { AdvancedTokenEditor } from './AdvancedTokenEditor'

function createTokens() {
  const tokens = {} as ThemeTokens

  THEME_TOKEN_NAMES.forEach((token, index) => {
    tokens[token] = `#${(index + 1).toString(16).padStart(6, '0')}`
  })

  return tokens
}

describe('AdvancedTokenEditor', () => {
  it('renders every theme token in the tuner', () => {
    const tokens = createTokens()

    render(
        <AdvancedTokenEditor
          resolvedTokens={tokens}
          derivedTokens={tokens}
          overrides={{}}
          manuallyEditedTokens={[]}
          onChange={vi.fn()}
          onReset={vi.fn()}
        />,
    )

    const renderedValues = screen.getAllByRole('textbox').map((input) => (input as HTMLInputElement).value)

    expect(renderedValues).toHaveLength(THEME_TOKEN_NAMES.length)
    expect([...renderedValues].sort()).toEqual(Object.values(tokens).sort())
  })

  it('only shows reset controls for manually edited overrides', () => {
    const resolvedTokens = createTokens()
    const derivedTokens = createTokens()

    resolvedTokens.primary = '#ff00aa'

    render(
      <AdvancedTokenEditor
        resolvedTokens={resolvedTokens}
        derivedTokens={derivedTokens}
        overrides={{
          primary: '#ff00aa',
          secondary: '#00ffaa',
        }}
        manuallyEditedTokens={['primary']}
        onChange={vi.fn()}
        onReset={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: 'Reset Primary' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Reset Secondary' })).not.toBeInTheDocument()
  })
})
