import type { ThemeTokenName, ThemeTokens } from '../../domain/theme/model'
import { getColorInputValue, normalizeColorValue } from '../../domain/theme/color'

const tokenSections: Array<{
  title: string
  tokens: ThemeTokenName[]
}> = [
  {
    title: 'Core',
    tokens: ['primary', 'secondary', 'accent', 'text', 'textMuted', 'selectedListItemText'],
  },
  {
    title: 'Surfaces',
    tokens: ['background', 'backgroundPanel', 'backgroundElement', 'backgroundMenu', 'border', 'borderActive', 'borderSubtle'],
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
  derivedTokens: ThemeTokens
  overrides: Partial<ThemeTokens>
  onChange: (token: ThemeTokenName, value: string) => void
  onReset: (token: ThemeTokenName) => void
}

function formatTokenLabel(token: ThemeTokenName) {
  return token
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/^./, (value) => value.toUpperCase())
}

export function AdvancedTokenEditor({
  resolvedTokens,
  derivedTokens,
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
                const tokenLabel = formatTokenLabel(token)
                const overrideValue = overrides[token]
                const isOverridden = overrideValue !== undefined
                const isInSyncWithDerived =
                  isOverridden && overrideValue.toLowerCase() === derivedTokens[token].toLowerCase()
                const showReset = isOverridden && !isInSyncWithDerived
                const colorInputId = `token-color-${token}`

                return (
                  <div key={token} className="advanced-field color-row advanced-row color-row-compact">
                    <div className="advanced-color-cell">
                      <label
                        className="semantic-generated-palette-chip advanced-color-well"
                        aria-label={`${tokenLabel} color swatch`}
                        style={{ background: normalizeColorValue(resolvedTokens[token]) ?? resolvedTokens[token] }}
                      >
                        <input
                          id={colorInputId}
                          type="color"
                          value={getColorInputValue(resolvedTokens[token])}
                          onChange={(event) => onChange(token, event.target.value)}
                          aria-label={`${tokenLabel} color`}
                        />
                      </label>

                      {showReset ? (
                        <button
                          type="button"
                          className="advanced-reset-icon"
                          onClick={() => onReset(token)}
                          aria-label={`Reset ${tokenLabel}`}
                          title={`Reset ${tokenLabel}`}
                        >
                          ×
                        </button>
                      ) : null}
                    </div>

                    <div className="color-row-copy">
                      <label className="color-row-label" htmlFor={colorInputId}>
                        {tokenLabel}
                      </label>
                    </div>

                    <input
                      type="text"
                      className="color-value"
                      value={resolvedTokens[token]}
                      onChange={(event) => onChange(token, event.target.value)}
                      aria-label={`${tokenLabel} value`}
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
