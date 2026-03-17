import type { ThemeTokenName, ThemeTokens } from '../../domain/theme/model'

const tokenSections: Array<{
  title: string
  tokens: ThemeTokenName[]
}> = [
  {
    title: 'Core',
    tokens: ['primary', 'secondary', 'accent', 'text', 'textMuted'],
  },
  {
    title: 'Surfaces',
    tokens: ['background', 'backgroundPanel', 'backgroundElement', 'border', 'borderActive', 'borderSubtle'],
  },
  {
    title: 'Diffs',
    tokens: ['diffAdded', 'diffRemoved', 'diffContext', 'diffHunkHeader'],
  },
  {
    title: 'Markdown',
    tokens: ['markdownHeading', 'markdownCode'],
  },
  {
    title: 'Syntax',
    tokens: ['syntaxKeyword', 'syntaxFunction', 'syntaxString'],
  },
]

type AdvancedTokenEditorProps = {
  resolvedTokens: ThemeTokens
  overrides: Partial<ThemeTokens>
  onChange: (token: ThemeTokenName, value: string) => void
  onReset: (token: ThemeTokenName) => void
}

export function AdvancedTokenEditor({
  resolvedTokens,
  overrides,
  onChange,
  onReset,
}: AdvancedTokenEditorProps) {
  return (
    <section className="advanced-editor panel-card">
      <div className="editor-groups">
        {tokenSections.map((section) => (
          <section key={section.title} className="editor-group">
            <div className="editor-group-header">
              <p className="editor-group-label">{section.title}</p>
            </div>

            <div className="advanced-grid">
              {section.tokens.map((token) => {
                const isOverridden = overrides[token] !== undefined
                const colorInputId = `token-color-${token}`

                return (
                  <div key={token} className="advanced-field color-row advanced-row color-row-compact">
                    <div className="advanced-color-cell">
                      <label className="color-swatch" aria-label={`${token} color swatch`}>
                        <span className="color-swatch-surface" style={{ background: resolvedTokens[token] }} />
                        <input
                          id={colorInputId}
                          type="color"
                          value={resolvedTokens[token]}
                          onChange={(event) => onChange(token, event.target.value)}
                          aria-label={`${token} color`}
                        />
                      </label>

                      {isOverridden ? (
                        <button
                          type="button"
                          className="advanced-reset-icon"
                          onClick={() => onReset(token)}
                          aria-label={`Reset ${token}`}
                          title={`Reset ${token}`}
                        >
                          ×
                        </button>
                      ) : null}
                    </div>

                    <div className="color-row-copy">
                      <label className="color-row-label" htmlFor={colorInputId}>
                        {token}
                      </label>
                    </div>

                    <input
                      type="text"
                      className="color-value"
                      value={resolvedTokens[token]}
                      onChange={(event) => onChange(token, event.target.value)}
                      aria-label={`${token} value`}
                    />
                  </div>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </section>
  )
}
