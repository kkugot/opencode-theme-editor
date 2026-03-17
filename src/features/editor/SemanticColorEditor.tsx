import type { SemanticGroupName } from '../../domain/theme/model'

const semanticSections: Array<{
  title: string
  groups: SemanticGroupName[]
}> = [
  {
    title: 'Foundation',
    groups: ['canvas', 'panel', 'text', 'muted', 'accent'],
  },
  {
    title: 'Signals',
    groups: ['success', 'warning', 'danger'],
  },
]

type SemanticColorEditorProps = {
  semanticGroups: Record<SemanticGroupName, string>
  onChange: (group: SemanticGroupName, value: string) => void
}

export function SemanticColorEditor({ semanticGroups, onChange }: SemanticColorEditorProps) {
  return (
    <section className="semantic-editor panel-card">
      <div className="editor-groups">
        {semanticSections.map((section) => (
          <section key={section.title} className="editor-group">
            <div className="editor-group-header">
              <p className="editor-group-label">{section.title}</p>
            </div>

            <div className="color-grid">
              {section.groups.map((group) => {
                const colorInputId = `semantic-color-${group}`

                return (
                  <div key={group} className="color-field color-row color-row-compact">
                    <label className="color-swatch" aria-label={`${group} color swatch`}>
                      <span className="color-swatch-surface" style={{ background: semanticGroups[group] }} />
                      <input
                        id={colorInputId}
                        type="color"
                        value={semanticGroups[group]}
                        onChange={(event) => onChange(group, event.target.value)}
                        aria-label={`${group} color`}
                      />
                    </label>

                    <div className="color-row-copy">
                      <label className="color-row-label" htmlFor={colorInputId}>
                        {group}
                      </label>
                    </div>

                    <input
                      type="text"
                      className="color-value"
                      value={semanticGroups[group]}
                      onChange={(event) => onChange(group, event.target.value)}
                      aria-label={`${group} value`}
                    />
                  </div>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </section>
  )
}
