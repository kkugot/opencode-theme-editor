import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  serializeThemeFile,
  type OpenCodeCombinedThemeFile,
  type OpenCodeThemeFile,
} from '../../domain/opencode/exportTheme'
import type { ThemeMode, ThemeTokenName } from '../../domain/theme/model'
import { parseJsonThemeFile, type JsonThemeModeUpdates } from './jsonThemeEditorParser'


type JsonThemeEditorProps = {
  themeFile: OpenCodeThemeFile
  combinedThemeFile: OpenCodeCombinedThemeFile
  tokenNames: ThemeTokenName[]
  activeMode: ThemeMode
  onChange: (modeThemes: JsonThemeModeUpdates) => void
}

function CopyIcon() {
  return (
    <svg className="theme-action-copy-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path
        d="M5.25 3.25A1.5 1.5 0 0 1 6.75 1.75h5A1.5 1.5 0 0 1 13.25 3.25v6.5a1.5 1.5 0 0 1-1.5 1.5h-5a1.5 1.5 0 0 1-1.5-1.5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M3.25 5.25v6a1.5 1.5 0 0 0 1.5 1.5h4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function getCopyButtonState(label: string) {
  if (label === 'Copied') {
    return 'copied'
  }

  if (label === 'Unavailable') {
    return 'unavailable'
  }

  return 'idle'
}

function getCopyButtonA11yLabel(label: string) {
  if (label === 'Copied') {
    return 'JSON copied'
  }

  if (label === 'Unavailable') {
    return 'Copy unavailable'
  }

  return 'Copy JSON'
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
  const [copyLabel, setCopyLabel] = useState('Copy')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const syncTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current

    if (!textarea) {
      return
    }

    textarea.style.height = '0px'
    textarea.style.height = `${textarea.scrollHeight}px`
  }, [])

  useEffect(() => {
    if (isEditing || parseError) {
      return
    }

    setJsonText(formattedTheme)
  }, [formattedTheme, isEditing, parseError])

  useLayoutEffect(() => {
    syncTextareaHeight()
  }, [jsonText, syncTextareaHeight])

  useEffect(() => {
    const handleResize = () => {
      syncTextareaHeight()
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [syncTextareaHeight])

  function handleTextChange(nextValue: string) {
    setJsonText(nextValue)

    const parsed = parseJsonThemeFile(nextValue, tokenNames, activeMode)

    if (!parsed.ok) {
      setParseError(parsed.error)
      return
    }

    setParseError(null)
    setFormat(parsed.value.format)
    onChange(parsed.value.modeThemes)
  }

  async function copyJsonText() {
    try {
      await navigator.clipboard.writeText(jsonText)
      setCopyLabel('Copied')

      window.setTimeout(() => {
        setCopyLabel('Copy')
      }, 1600)
    } catch {
      setCopyLabel('Unavailable')
    }
  }

  return (
    <section className="json-editor panel-card">
      <p className="json-editor-status" data-state={parseError ? 'error' : 'ready'} role="status" aria-live="polite">
        {parseError ?? 'Changes apply while the JSON stays valid'}
      </p>

      <div className="json-editor-shell">
        <button
          type="button"
          className="theme-action-copy theme-action-copy-icon-only json-editor-copy"
          aria-label={getCopyButtonA11yLabel(copyLabel)}
          title={getCopyButtonA11yLabel(copyLabel)}
          data-state={getCopyButtonState(copyLabel)}
          onClick={() => {
            void copyJsonText()
          }}
        >
          <CopyIcon />
        </button>

        <label className="json-editor-field" htmlFor="theme-json-editor">
          <textarea
            id="theme-json-editor"
            ref={textareaRef}
            className="json-editor-input"
            value={jsonText}
            spellCheck={false}
            onFocus={() => setIsEditing(true)}
            onBlur={() => {
              setIsEditing(false)

              const parsed = parseJsonThemeFile(jsonText, tokenNames, activeMode)

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
      </div>
    </section>
  )
}
