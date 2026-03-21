import { useEffect, useMemo, useState } from 'react'
import type { OpenCodeCombinedThemeFile } from '../../domain/opencode/exportTheme'
import { encodeThemeInstallPayload, supportsThemeInstallCodec } from '../../domain/share/themeInstallCodec'
import { buildThemeShareUrl } from '../../domain/share/themeShareLink'

type InstallThemeCommandProps = {
  themeSlug: string
  themeFile: OpenCodeCombinedThemeFile
}

function buildInstallScriptUrl() {
  return new URL(`${import.meta.env.BASE_URL}install.sh`, window.location.origin).toString()
}

export function InstallThemeCommand({ themeSlug, themeFile }: InstallThemeCommandProps) {
  const [encodedPayload, setEncodedPayload] = useState('')
  const [copyLabel, setCopyLabel] = useState('Copy command')
  const [copyShareLabel, setCopyShareLabel] = useState('Copy link')
  const [statusMessage, setStatusMessage] = useState('Preparing shareable install command...')
  const isSupported = supportsThemeInstallCodec()

  useEffect(() => {
    let cancelled = false

    if (!isSupported) {
      setEncodedPayload('')
      setStatusMessage('Install command needs a browser with CompressionStream support.')
      return () => {
        cancelled = true
      }
    }

    setStatusMessage('Preparing shareable install command...')
    setCopyLabel('Copy command')
    setCopyShareLabel('Copy link')

    void encodeThemeInstallPayload(themeFile)
      .then((nextEncodedPayload) => {
        if (cancelled) {
          return
        }

        setEncodedPayload(nextEncodedPayload)
        setStatusMessage('Copy the link to share both modes, or paste the installer into OpenCode from your project root.')
      })
      .catch(() => {
        if (cancelled) {
          return
        }

        setEncodedPayload('')
        setStatusMessage('Could not generate the install command for this theme yet.')
      })

    return () => {
      cancelled = true
    }
  }, [isSupported, themeFile, themeSlug])

  const command = useMemo(() => {
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

  async function handleCopy() {
    if (!command) {
      return
    }

    try {
      await navigator.clipboard.writeText(command)
      setCopyLabel('Copied')

      window.setTimeout(() => {
        setCopyLabel('Copy command')
      }, 1600)
    } catch {
      setCopyLabel('Unavailable')
    }
  }

  async function handleCopyShareUrl() {
    if (!shareUrl) {
      return
    }

    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopyShareLabel('Copied')

      window.setTimeout(() => {
        setCopyShareLabel('Copy link')
      }, 1600)
    } catch {
      setCopyShareLabel('Unavailable')
    }
  }

  return (
    <div className="install-command-card">
      <div className="install-command-header">
        <div>
          <p className="install-command-label">Install in OpenCode</p>
          <p className="install-command-caption">{statusMessage}</p>
        </div>

        <div className="install-command-actions">
          <button
            type="button"
            className="install-command-copy"
            disabled={!shareUrl}
            onClick={() => {
              void handleCopyShareUrl()
            }}
          >
            {copyShareLabel}
          </button>

          <button
            type="button"
            className="install-command-copy"
            disabled={!command}
            onClick={() => {
              void handleCopy()
            }}
          >
            {copyLabel}
          </button>
        </div>
      </div>

      <div className="install-command-shell">
        <code className="install-command-code">{command || 'Preparing installer...'}</code>
      </div>
    </div>
  )
}
