import type { ContrastWarning } from '../../domain/validation/analyzeContrast'

type ContrastGuidanceProps = {
  warnings: ContrastWarning[]
  onFix: (warning: ContrastWarning) => void
}

function buildSuggestion(warning: ContrastWarning) {
  const delta = Math.max(0, warning.target - warning.ratio).toFixed(2)
  return `Increase contrast by about ${delta} for ${warning.label.toLowerCase()}.`
}

export function ContrastGuidance({ warnings, onFix }: ContrastGuidanceProps) {
  const issues = warnings.filter((warning) => warning.severity !== 'good')

  return (
    <section className="contrast-guidance contrast-guidance-compact">
      <div className="contrast-copy contrast-copy-plain section-copy">
        <div>
          <h2>
            <span className="contrast-warning-sign" aria-hidden="true">
              ⚠
            </span>{' '}
            Contrast ({issues.length})
          </h2>
        </div>
      </div>

      <div className="contrast-list contrast-list-compact">
        {issues.map((warning) => (
          <div key={warning.id} className="contrast-item contrast-item-icon">
            <span className="contrast-warning-sign" aria-hidden="true">
              ⚠
            </span>
            <span className="contrast-item-label">{warning.label}</span>
            <div className="contrast-actions contrast-actions-compact">
              <button
                type="button"
                className="contrast-fix-button"
                title={buildSuggestion(warning)}
                onClick={() => onFix(warning)}
              >
                FIX
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
