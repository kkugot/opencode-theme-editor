import { useEffect, useMemo, useState } from 'react'
import type { OpenCodeCombinedThemeFile } from '../../domain/opencode/exportTheme'
import { buildThemeShareUrl } from '../../domain/share/themeShareLink'
import { encodeThemeInstallPayload, supportsThemeInstallCodec } from '../../domain/share/themeInstallCodec'

type ThemeActionMenuProps = {
  themeSlug: string
  themeFile: OpenCodeCombinedThemeFile
  onDownloadDark: () => void
  onDownloadLight: () => void
  onDownloadCombined: () => void
}

function buildInstallScriptUrl() {
  return new URL(`${import.meta.env.BASE_URL}install.sh`, window.location.origin).toString()
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

function getCopyButtonA11yLabel(label: string, subject: string) {
  if (label === 'Copied') {
    return `${subject} copied`
  }

  if (label === 'Unavailable') {
    return 'Copy unavailable'
  }

  return `Copy ${subject}`
}

export function ThemeActionMenu({
  themeSlug,
  themeFile,
  onDownloadDark,
  onDownloadLight,
  onDownloadCombined,
}: ThemeActionMenuProps) {
  const [encodedPayload, setEncodedPayload] = useState('')
  const [copyInstallLabel, setCopyInstallLabel] = useState('Copy')
  const [copyShareLabel, setCopyShareLabel] = useState('Copy')
  const [statusMessage, setStatusMessage] = useState('Preparing install command and share link...')
  const isSupported = supportsThemeInstallCodec()

  useEffect(() => {
    let cancelled = false

    if (!isSupported) {
      setEncodedPayload('')
      setStatusMessage('Quick install and share links need a browser with CompressionStream support.')
      return () => {
        cancelled = true
      }
    }

    setStatusMessage('Preparing install command and share link...')
    setCopyInstallLabel('Copy')
    setCopyShareLabel('Copy')

    void encodeThemeInstallPayload(themeFile)
      .then((nextEncodedPayload) => {
        if (cancelled) {
          return
        }

        setEncodedPayload(nextEncodedPayload)
        setStatusMessage('Copy a link that reopens this exact theme in the editor.')
      })
      .catch(() => {
        if (cancelled) {
          return
        }

        setEncodedPayload('')
        setStatusMessage('Could not prepare the install command or share link yet.')
      })

    return () => {
      cancelled = true
    }
  }, [isSupported, themeFile])

  const installCommand = useMemo(() => {
    if (!encodedPayload) {
      return ''
    }

    return `curl -fsSL ${buildInstallScriptUrl()} | bash -s -- ${themeSlug} ${encodedPayload}`
  }, [encodedPayload, themeSlug])

  const shareUrl = useMemo(() => {
    if (!encodedPayload) {
      return ''
    }

    return buildThemeShareUrl({
      themeSlug,
      encodedPayload,
    })
  }, [encodedPayload, themeSlug])

  const installCopyA11yLabel = getCopyButtonA11yLabel(copyInstallLabel, 'install command')
  const shareCopyA11yLabel = getCopyButtonA11yLabel(copyShareLabel, 'share link')

  async function copyInstallCommand() {
    if (!installCommand) {
      return
    }

    try {
      await navigator.clipboard.writeText(installCommand)
      setCopyInstallLabel('Copied')

      window.setTimeout(() => {
        setCopyInstallLabel('Copy')
      }, 1600)
    } catch {
      setCopyInstallLabel('Unavailable')
    }
  }

  async function copyThemeLink() {
    if (!shareUrl) {
      return
    }

    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopyShareLabel('Copied')

      window.setTimeout(() => {
        setCopyShareLabel('Copy')
      }, 1600)
    } catch {
      setCopyShareLabel('Unavailable')
    }
  }

  return (
    <section className="theme-action-menu-panel panel-card" aria-label="Save and use actions">
      <div className="theme-action-groups editor-groups">
        <section className="theme-action-group editor-group">
          <div className="editor-group-header editor-group-header-copy">
            <div className="editor-group-copy">
              <p className="editor-group-label">Install in OpenCode</p>
              <p className="editor-group-caption">Paste one command into OpenCode, then restart once to make this theme active.</p>
            </div>
          </div>

          <ol className="theme-action-step-list">
            <li>
              In OpenCode, type <code className="theme-action-inline-code">!</code> to open a shell command
            </li>
            <li>Paste the command below and press Enter</li>
            <li>Restart OpenCode once to load the theme</li>
          </ol>

          <div className="theme-action-code-shell theme-action-code-shell-command">
            <code className="theme-action-code theme-action-code-command">{installCommand || statusMessage}</code>
            <button
              type="button"
              className="theme-action-copy theme-action-copy-icon-only theme-action-copy-overlay"
              disabled={!installCommand}
              aria-label={installCopyA11yLabel}
              title={installCopyA11yLabel}
              data-state={getCopyButtonState(copyInstallLabel)}
              onClick={() => {
                void copyInstallCommand()
              }}
            >
              <CopyIcon />
            </button>
          </div>
        </section>

        <section className="theme-action-group editor-group">
          <div className="editor-group-header editor-group-header-copy">
            <div className="editor-group-copy">
              <p className="editor-group-label">Download files</p>
              <p className="editor-group-caption">Save the full bundle or export separate dark and light JSON files.</p>
            </div>
          </div>

          <div className="theme-action-download-list theme-action-download-list-minimal">
            <button
              type="button"
              className="theme-action-download-item theme-action-download-item-minimal is-default"
              onClick={onDownloadCombined}
            >
              <span className="theme-action-download-label">Bundle</span>
              <span className="theme-action-download-file" title={`${themeSlug}.json`}>
                {`${themeSlug}.json`}
              </span>
            </button>

            <button
              type="button"
              className="theme-action-download-item theme-action-download-item-minimal"
              onClick={onDownloadDark}
            >
              <span className="theme-action-download-label">Dark</span>
              <span className="theme-action-download-file" title={`${themeSlug}.dark.json`}>
                {`${themeSlug}.dark.json`}
              </span>
            </button>

            <button
              type="button"
              className="theme-action-download-item theme-action-download-item-minimal"
              onClick={onDownloadLight}
            >
              <span className="theme-action-download-label">Light</span>
              <span className="theme-action-download-file" title={`${themeSlug}.light.json`}>
                {`${themeSlug}.light.json`}
              </span>
            </button>
          </div>
        </section>

        <section className="theme-action-group editor-group">
          <div className="editor-group-header editor-group-header-copy">
            <div className="editor-group-copy">
              <p className="editor-group-label">Share editable link</p>
              <p className="editor-group-caption">Copy a link that reopens this exact theme in the editor.</p>
            </div>
          </div>

          <div className="theme-action-share-shell">
            <input
              type="text"
              className="theme-action-share-input"
              value={shareUrl || statusMessage}
              aria-label="Theme share link"
              readOnly
              spellCheck={false}
              title={shareUrl || statusMessage}
              onFocus={(event) => {
                event.currentTarget.select()
              }}
            />

            <button
              type="button"
              className="theme-action-copy theme-action-copy-icon-only"
              disabled={!shareUrl}
              aria-label={shareCopyA11yLabel}
              title={shareCopyA11yLabel}
              data-state={getCopyButtonState(copyShareLabel)}
              onClick={() => {
                void copyThemeLink()
              }}
            >
              <CopyIcon />
            </button>
          </div>
        </section>
      </div>
    </section>
  )
}
