import type { CSSProperties } from 'react'
import type { OpenCodeCombinedThemeFile } from '../domain/opencode/exportTheme'
import { DownloadMenu } from '../features/export/DownloadMenu'
import { InstallThemeCommand } from '../features/export/InstallThemeCommand'

type ThemeEditorFooterProps = {
  themeSlug: string
  footerStyle: CSSProperties
  combinedThemeFile: OpenCodeCombinedThemeFile
  onDownloadDark: () => void
  onDownloadLight: () => void
  onDownloadCombined: () => void
}

export function ThemeEditorFooter({
  themeSlug,
  footerStyle,
  combinedThemeFile,
  onDownloadDark,
  onDownloadLight,
  onDownloadCombined,
}: ThemeEditorFooterProps) {
  return (
    <div className="editor-pane-footer" style={footerStyle}>
      <div className="editor-footer-actions">
        <div className="editor-download-bar">
          <div className="editor-export-file" aria-label="Export filename preview">
            <span className="editor-export-file-name">{`${themeSlug}.json`}</span>
          </div>

          <DownloadMenu
            themeSlug={themeSlug}
            onDownloadDark={onDownloadDark}
            onDownloadLight={onDownloadLight}
            onDownloadCombined={onDownloadCombined}
          />
        </div>

        <details className="editor-share-install">
          <summary className="editor-share-install-summary">
            <span className="editor-share-install-label">Share or install</span>

            <span className="editor-share-install-caret" aria-hidden="true">
              ▾
            </span>
          </summary>

          <InstallThemeCommand themeSlug={themeSlug} themeFile={combinedThemeFile} />
        </details>
      </div>
    </div>
  )
}
