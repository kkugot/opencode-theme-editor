import { useRef } from 'react'

type DownloadMenuProps = {
  themeSlug: string
  onDownloadDark: () => void
  onDownloadLight: () => void
  onDownloadCombined: () => void
}

export function DownloadMenu({
  themeSlug,
  onDownloadDark,
  onDownloadLight,
  onDownloadCombined,
}: DownloadMenuProps) {
  const menuRef = useRef<HTMLDetailsElement>(null)

  function handleDownload(download: () => void) {
    download()

    if (menuRef.current) {
      menuRef.current.open = false
    }
  }

  return (
    <details className="download-menu" ref={menuRef}>
      <summary className="download-menu-trigger">
        Export
        <span className="download-menu-caret" aria-hidden="true">
          ▾
        </span>
      </summary>

      <div className="download-menu-list" role="menu" aria-label="Theme export format">
        <button
          type="button"
          className="download-menu-item"
          onClick={() => handleDownload(onDownloadDark)}
        >
          <span className="download-menu-item-label">Dark</span>
          <span className="download-menu-item-file">{`${themeSlug}.dark.json`}</span>
        </button>

        <button
          type="button"
          className="download-menu-item"
          onClick={() => handleDownload(onDownloadLight)}
        >
          <span className="download-menu-item-label">Light</span>
          <span className="download-menu-item-file">{`${themeSlug}.light.json`}</span>
        </button>

        <button
          type="button"
          className="download-menu-item"
          onClick={() => handleDownload(onDownloadCombined)}
        >
          <span className="download-menu-item-label">Bundle</span>
          <span className="download-menu-item-file">{`${themeSlug}.json`}</span>
        </button>
      </div>
    </details>
  )
}
