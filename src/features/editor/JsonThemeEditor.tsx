import { useEffect, useMemo, useState } from 'react'
import { serializeThemeFile, type OpenCodeThemeFile } from '../../domain/opencode/exportTheme'
import type { ThemeTokenName, ThemeTokens } from '../../domain/theme/model'

type JsonThemeEditorProps = {
  themeFile: OpenCodeThemeFile
  tokenNames: ThemeTokenName[]
  onChange: (themeFile: OpenCodeThemeFile) => void
}

type ParseResult =
  | { ok: true; value: OpenCodeThemeFile }
  | { ok: false; error: string }

type ResolveColorResult =
  | { ok: true; value: string }
  | { ok: false; error: string }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isHexColor(value: string) {
  return /^#[0-9a-f]{6}$/i.test(value)
}

function resolveThemeTokenColor(
  value: string,
  defs: Record<string, unknown>,
  token: ThemeTokenName,
  visitedDefs: Set<string> = new Set(),
): ResolveColorResult {
  if (isHexColor(value)) {
    return { ok: true, value }
  }

  if (!(value in defs)) {
    return {
      ok: false,
      error: `Token \`${token}\` must be a #RRGGBB color or a name from \`defs\``,
    }
  }

  if (visitedDefs.has(value)) {
    return {
      ok: false,
      error: `Token \`${token}\` has a circular \`defs\` reference at \`${value}\``,
    }
  }

  const nextValue = defs[value]

  if (typeof nextValue !== 'string') {
    return {
      ok: false,
      error: `\`defs.${value}\` must resolve to a string color value`,
    }
  }

  const nextVisitedDefs = new Set(visitedDefs)
  nextVisitedDefs.add(value)

  return resolveThemeTokenColor(nextValue, defs, token, nextVisitedDefs)
}

function parseThemeFile(value: string, tokenNames: ThemeTokenName[]): ParseResult {
  let parsed: unknown

  try {
    parsed = JSON.parse(value)
  } catch {
    return { ok: false, error: 'JSON is not valid yet' }
  }

  if (!isRecord(parsed)) {
    return { ok: false, error: 'Root value must stay a JSON object' }
  }

  if (parsed.$schema !== 'https://opencode.ai/theme.json') {
    return { ok: false, error: '`$schema` must be https://opencode.ai/theme.json' }
  }

  if (!isRecord(parsed.theme)) {
    return { ok: false, error: '`theme` must be an object of token colors' }
  }

  if (parsed.defs !== undefined && !isRecord(parsed.defs)) {
    return { ok: false, error: '`defs` must be an object when provided' }
  }

  const defs = (parsed.defs ?? {}) as Record<string, unknown>

  const tokenNameSet = new Set(tokenNames)

  for (const key of Object.keys(parsed.theme)) {
    if (!tokenNameSet.has(key as ThemeTokenName)) {
      return { ok: false, error: `Unknown token: ${key}` }
    }
  }

  const nextTheme = {} as ThemeTokens

  for (const token of tokenNames) {
    const tokenValue = parsed.theme[token]

    if (typeof tokenValue !== 'string') {
      return { ok: false, error: `Token \`${token}\` must be a string` }
    }

    const resolvedToken = resolveThemeTokenColor(tokenValue, defs, token)

    if (!resolvedToken.ok) {
      return { ok: false, error: resolvedToken.error }
    }

    nextTheme[token] = resolvedToken.value
  }

  return {
    ok: true,
    value: {
      $schema: 'https://opencode.ai/theme.json',
      theme: nextTheme,
    },
  }
}

export function JsonThemeEditor({ themeFile, tokenNames, onChange }: JsonThemeEditorProps) {
  const formattedTheme = useMemo(() => serializeThemeFile(themeFile).trimEnd(), [themeFile])
  const [jsonText, setJsonText] = useState(formattedTheme)
  const [parseError, setParseError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    if (isEditing || parseError) {
      return
    }

    setJsonText(formattedTheme)
  }, [formattedTheme, isEditing, parseError])

  function handleTextChange(nextValue: string) {
    setJsonText(nextValue)

    const parsed = parseThemeFile(nextValue, tokenNames)

    if (!parsed.ok) {
      setParseError(parsed.error)
      return
    }

    setParseError(null)
    onChange(parsed.value)
  }

  return (
    <section className="json-editor panel-card">
      <div className="editor-group-header">
        <p className="editor-group-label">Theme JSON</p>
      </div>

      <label className="json-editor-field" htmlFor="theme-json-editor">
        <textarea
          id="theme-json-editor"
          className="json-editor-input"
          value={jsonText}
          spellCheck={false}
          onFocus={() => setIsEditing(true)}
          onBlur={() => {
            setIsEditing(false)

            const parsed = parseThemeFile(jsonText, tokenNames)

            if (!parsed.ok) {
              return
            }

            setJsonText(serializeThemeFile(parsed.value).trimEnd())
          }}
          onChange={(event) => handleTextChange(event.target.value)}
          aria-label="Theme JSON editor"
        />
      </label>

      <p className="json-editor-status" data-state={parseError ? 'error' : 'ready'} role="status" aria-live="polite">
        {parseError ?? 'Changes apply while the JSON stays valid'}
      </p>
    </section>
  )
}
