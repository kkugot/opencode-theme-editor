import { THEME_TOKEN_NAMES, type ThemeTokenName, type ThemeTokens } from '../../domain/theme/model'
import { getColorInputValue, normalizeColorValue } from '../../domain/theme/color'

function isSurfaceToken(token: ThemeTokenName) {
  return token.startsWith('background') || token.startsWith('border')
}

function isDiffToken(token: ThemeTokenName) {
  return token.startsWith('diff')
}

function isMarkdownToken(token: ThemeTokenName) {
  return token.startsWith('markdown')
}

function isSyntaxToken(token: ThemeTokenName) {
  return token.startsWith('syntax')
}

const tokenSections = [
  {
    title: 'Core',
    tokens: THEME_TOKEN_NAMES.filter(
      (token) => !isSurfaceToken(token) && !isDiffToken(token) && !isMarkdownToken(token) && !isSyntaxToken(token),
    ),
  },
  {
    title: 'Surfaces',
    tokens: THEME_TOKEN_NAMES.filter(isSurfaceToken),
  },
  {
    title: 'Diffs',
    tokens: THEME_TOKEN_NAMES.filter(isDiffToken),
  },
  {
    title: 'Markdown',
    tokens: THEME_TOKEN_NAMES.filter(isMarkdownToken),
  },
  {
    title: 'Syntax',
    tokens: THEME_TOKEN_NAMES.filter(isSyntaxToken),
  },
] satisfies Array<{
  title: string
  tokens: ThemeTokenName[]
}>

type AdvancedTokenEditorProps = {
  resolvedTokens: ThemeTokens
  derivedTokens: ThemeTokens
  overrides: Partial<ThemeTokens>
  manuallyEditedTokens: ThemeTokenName[]
  onChange: (token: ThemeTokenName, value: string) => void
  onReset: (token: ThemeTokenName) => void
}

function formatTokenLabel(token: ThemeTokenName) {
  return token
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/^./, (value) => value.toUpperCase())
}

function UndoIcon() {
  return (
    <svg className="advanced-reset-icon-glyph" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M10 7.5 6 11.5l4 4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M6.5 11.5H14a4.5 4.5 0 1 1 0 9h-2.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

export function AdvancedTokenEditor({
  resolvedTokens,
  derivedTokens,
  overrides,
  manuallyEditedTokens,
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
                const showReset = manuallyEditedTokens.includes(token) && isOverridden && !isInSyncWithDerived
                const colorInputId = `token-color-${token}`

                return (
                  <div key={token} className="advanced-field color-row advanced-row color-row-compact">
                    <div className="advanced-color-cell">
                      <label
                        className="semantic-generated-palette-chip semantic-generated-palette-chip-pill advanced-color-well"
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
                          <UndoIcon />
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
