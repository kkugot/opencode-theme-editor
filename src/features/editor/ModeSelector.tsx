import type { ThemeMode } from '../../domain/theme/model'

type ModeSelectorProps = {
  activeMode: ThemeMode
  onChange: (mode: ThemeMode) => void
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21 12.8A9 9 0 1 1 11.2 3 7.2 7.2 0 0 0 21 12.8Z" />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="3.6" />
      <path d="M12 2.8v2.3M12 18.9v2.3M21.2 12h-2.3M5.1 12H2.8M18.5 5.5l-1.6 1.6M7.1 16.9l-1.6 1.6M18.5 18.5l-1.6-1.6M7.1 7.1 5.5 5.5" />
    </svg>
  )
}

export function ModeSelector({ activeMode, onChange }: ModeSelectorProps) {
  const isLightMode = activeMode === 'light'

  return (
    <button
      type="button"
      className="mode-selector"
      role="switch"
      aria-checked={isLightMode}
      aria-label={isLightMode ? 'Switch to dark mode' : 'Switch to light mode'}
      onClick={() => onChange(isLightMode ? 'dark' : 'light')}
    >
      <span className="mode-selector-orbit" aria-hidden="true">
        <span className="mode-selector-glyph mode-selector-glyph-moon">
          <MoonIcon />
        </span>
        <span className="mode-selector-glyph mode-selector-glyph-sun">
          <SunIcon />
        </span>
      </span>
    </button>
  )
}
