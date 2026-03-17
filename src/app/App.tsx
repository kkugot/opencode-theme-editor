import { useEffect } from 'react'
import { getHydratedDraft } from '../state/hydrateDraft'
import { DraftPersistenceBoundary } from '../state/persistence'
import { ThemeStoreProvider } from '../state/theme-store'
import { useThemeStoreActions } from '../state/theme-store-hooks'
import { ThemeEditorPage } from './ThemeEditorPage'

function AppContent() {
  const { hydrateDraft } = useThemeStoreActions()

  useEffect(() => {
    void getHydratedDraft().then((draft) => {
      if (draft) {
        hydrateDraft(draft)
      }
    })
  }, [hydrateDraft])

  return (
    <DraftPersistenceBoundary>
      <ThemeEditorPage />
    </DraftPersistenceBoundary>
  )
}

export function App() {
  return (
    <ThemeStoreProvider>
      <AppContent />
    </ThemeStoreProvider>
  )
}
