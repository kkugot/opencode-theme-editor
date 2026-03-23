import { useMemo, useState } from 'react'

function buildImportScriptUrl() {
  const basePath = window.location.pathname.endsWith('/') ? window.location.pathname : `${window.location.pathname}/`

  return new URL('import-export.sh', new URL(basePath, window.location.origin)).toString()
}

function buildStudioUrl() {
  const url = new URL(window.location.href)

  url.search = ''
  url.hash = ''

  return url.toString()
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
    return 'Import command copied'
  }

  if (label === 'Unavailable') {
    return 'Copy unavailable'
  }

  return 'Copy import command'
}

export function ThemeImportGuide() {
  const [copyLabel, setCopyLabel] = useState('Copy')
  const importCommand = useMemo(() => {
    return `curl -fsSL ${buildImportScriptUrl()} | bash -s -- import '${buildStudioUrl()}'`
  }, [])

  async function copyImportCommand() {
    try {
      await navigator.clipboard.writeText(importCommand)
      setCopyLabel('Copied')

      window.setTimeout(() => {
        setCopyLabel('Copy')
      }, 1600)
    } catch {
      setCopyLabel('Unavailable')
    }
  }

  return (
    <section className="theme-action-group editor-group">
      <div className="editor-group-header">
        <p className="editor-group-label">Import from OpenCode</p>
      </div>

      <p className="editor-group-caption theme-action-group-caption">
        Open your current local OpenCode theme in Theme Studio.
      </p>

      <ol className="theme-action-step-list">
        <li>
          In OpenCode, type <code className="theme-action-inline-code">!</code>
        </li>
        <li>Paste the command below and press Enter</li>
        <li>Theme Studio opens with the theme loaded</li>
      </ol>

      <div className="theme-action-code-shell theme-action-code-shell-command">
        <code className="theme-action-code theme-action-code-command">{importCommand}</code>
        <button
          type="button"
          className="theme-action-copy theme-action-copy-icon-only theme-action-copy-overlay"
          aria-label={getCopyButtonA11yLabel(copyLabel)}
          title={getCopyButtonA11yLabel(copyLabel)}
          data-state={getCopyButtonState(copyLabel)}
          onClick={() => {
            void copyImportCommand()
          }}
        >
          <CopyIcon />
        </button>
      </div>
    </section>
  )
}
