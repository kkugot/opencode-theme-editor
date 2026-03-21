import type { EditorTab } from './themeEditorPageHelpers'
import { EDITOR_TAB_OPTIONS } from './themeEditorPageHelpers'

type ThemeEditorTabBarProps = {
  activeTab: EditorTab
  onTabChange: (tab: EditorTab) => void
}

export function ThemeEditorTabBar({ activeTab, onTabChange }: ThemeEditorTabBarProps) {
  return (
    <div className="editor-tabs" role="tablist" aria-label="Editor section">
      {EDITOR_TAB_OPTIONS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={activeTab === tab.id}
          className={activeTab === tab.id ? 'editor-tab active' : 'editor-tab'}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
