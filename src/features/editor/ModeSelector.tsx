import type { ThemeMode } from '../../domain/theme/model'

type ModeSelectorProps = {
  activeMode: ThemeMode
  onChange: (mode: ThemeMode) => void
}

export function ModeSelector({ activeMode, onChange }: ModeSelectorProps) {
  return (
    <div className="mode-selector" role="tablist" aria-label="Theme mode">
      {(['dark', 'light'] as const).map((mode) => {
        const isActive = mode === activeMode
        const label = mode === 'dark' ? 'Dark' : 'Light'

        return (
          <button
            key={mode}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={isActive ? 'mode-chip active' : 'mode-chip'}
            onClick={() => onChange(mode)}
          >
            <span className="mode-chip-label">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
