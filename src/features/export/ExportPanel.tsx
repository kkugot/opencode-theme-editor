type ExportPanelProps = {
  themeName: string
  themeSlug: string
  onThemeNameChange: (value: string) => void
  onExportDark: () => void
  onExportLight: () => void
}

export function ExportPanel({
  themeName,
  themeSlug,
  onThemeNameChange,
  onExportDark,
  onExportLight,
}: ExportPanelProps) {
  return (
    <section className="export-panel panel-card">
      <div className="export-copy section-copy">
        <div>
          <h2>Export</h2>
        </div>
      </div>

      <label className="export-name-field" htmlFor="export-theme-name">
        <span className="export-name-label">Theme name</span>
        <input
          id="export-theme-name"
          type="text"
          className="export-name-input"
          value={themeName}
          onChange={(event) => {
            onThemeNameChange(event.target.value)
          }}
          placeholder="theme-name"
          spellCheck={false}
        />
      </label>

      <div className="export-actions export-actions-compact">
        <button
          type="button"
          className="export-button"
          onClick={onExportDark}
        >
          <div className="export-button-copy">
            <strong className="export-button-title">Dark</strong>
            <small className="export-button-file">{`${themeSlug}.dark.json`}</small>
          </div>
          <div className="export-button-meta">
            <span>Export</span>
            <span>JSON</span>
          </div>
        </button>

        <button
          type="button"
          className="export-button"
          onClick={onExportLight}
        >
          <div className="export-button-copy">
            <strong className="export-button-title">Light</strong>
            <small className="export-button-file">{`${themeSlug}.light.json`}</small>
          </div>
          <div className="export-button-meta">
            <span>Export</span>
            <span>JSON</span>
          </div>
        </button>
      </div>
    </section>
  )
}
