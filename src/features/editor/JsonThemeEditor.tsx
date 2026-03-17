import { useEffect, useMemo, useState } from 'react'
import {
  exportCombinedThemeFile,
  exportThemeFile,
  serializeThemeFile,
  type OpenCodeCombinedThemeFile,
  type OpenCodeThemeFile,
} from '../../domain/opencode/exportTheme'
import type { ThemeMode, ThemeTokenName, ThemeTokens } from '../../domain/theme/model'

type JsonThemeModeUpdates = Partial<Record<ThemeMode, ThemeTokens>>

type JsonThemeEditorProps = {
  themeFile: OpenCodeThemeFile
  combinedThemeFile: OpenCodeCombinedThemeFile
  tokenNames: ThemeTokenName[]
  activeMode: ThemeMode
  onChange: (modeThemes: JsonThemeModeUpdates) => void
}

type ParseResult =
  | {
      ok: true
      value: {
        format: 'single' | 'combined'
        themeFile: OpenCodeThemeFile | OpenCodeCombinedThemeFile
        modeThemes: JsonThemeModeUpdates
      }
    }
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

function parseThemeFile(value: string, tokenNames: ThemeTokenName[], activeMode: ThemeMode): ParseResult {
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
  const theme = parsed.theme as Record<string, unknown>

  const tokenNameSet = new Set(tokenNames)

  for (const key of Object.keys(theme)) {
    if (!tokenNameSet.has(key as ThemeTokenName)) {
      return { ok: false, error: `Unknown token: ${key}` }
    }
  }

  let hasSingleModeValues = false
  let hasCombinedModeValues = false

  for (const token of tokenNames) {
    const tokenValue = theme[token]

    if (typeof tokenValue === 'string') {
      hasSingleModeValues = true
      continue
    }

    if (isRecord(tokenValue)) {
      hasCombinedModeValues = true
      continue
    }

    return {
      ok: false,
      error: `Token \`${token}\` must be a string or an object with \`dark\` and \`light\``,
    }
  }

  if (hasSingleModeValues && hasCombinedModeValues) {
    return {
      ok: false,
      error: '`theme` cannot mix single-mode strings with combined dark/light objects',
    }
  }

  if (hasCombinedModeValues) {
    const darkTheme = {} as ThemeTokens
    const lightTheme = {} as ThemeTokens

    for (const token of tokenNames) {
      const tokenValue = theme[token]

      if (!isRecord(tokenValue) || typeof tokenValue.dark !== 'string' || typeof tokenValue.light !== 'string') {
        return {
          ok: false,
          error: `Token \`${token}\` must include string \`dark\` and \`light\` values`,
        }
      }

      const resolvedDark = resolveThemeTokenColor(tokenValue.dark, defs, token)

      if (!resolvedDark.ok) {
        return { ok: false, error: resolvedDark.error }
      }

      const resolvedLight = resolveThemeTokenColor(tokenValue.light, defs, token)

      if (!resolvedLight.ok) {
        return { ok: false, error: resolvedLight.error }
      }

      darkTheme[token] = resolvedDark.value
      lightTheme[token] = resolvedLight.value
    }

    return {
      ok: true,
      value: {
        format: 'combined',
        themeFile: exportCombinedThemeFile(darkTheme, lightTheme),
        modeThemes: {
          dark: darkTheme,
          light: lightTheme,
        },
      },
    }
  }

  const nextTheme = {} as ThemeTokens

  for (const token of tokenNames) {
    const tokenValue = theme[token]

    if (typeof tokenValue !== 'string') {
      return { ok: false, error: `Token \`${token}\` must be a string` }
    }

    const resolvedToken = resolveThemeTokenColor(tokenValue, defs, token)

    if (!resolvedToken.ok) {
      return { ok: false, error: resolvedToken.error }
    }

    nextTheme[token] = resolvedToken.value
  }

  const modeThemes: JsonThemeModeUpdates = {}
  modeThemes[activeMode] = nextTheme

  return {
    ok: true,
    value: {
      format: 'single',
      themeFile: exportThemeFile(nextTheme),
      modeThemes,
    },
  }
}

export function JsonThemeEditor({
  themeFile,
  combinedThemeFile,
  tokenNames,
  activeMode,
  onChange,
}: JsonThemeEditorProps) {
  const [format, setFormat] = useState<'single' | 'combined'>('single')
  const formattedTheme = useMemo(
    () =>
      serializeThemeFile(
        format === 'combined'
          ? combinedThemeFile
          : themeFile,
      ).trimEnd(),
    [combinedThemeFile, format, themeFile],
  )
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

    const parsed = parseThemeFile(nextValue, tokenNames, activeMode)

    if (!parsed.ok) {
      setParseError(parsed.error)
      return
    }

    setParseError(null)
    setFormat(parsed.value.format)
    onChange(parsed.value.modeThemes)
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

            const parsed = parseThemeFile(jsonText, tokenNames, activeMode)

            if (!parsed.ok) {
              return
            }

            setFormat(parsed.value.format)
            setJsonText(serializeThemeFile(parsed.value.themeFile).trimEnd())
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
