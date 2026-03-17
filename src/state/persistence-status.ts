import { createContext, useContext } from 'react'

export type DraftPersistenceStatus = 'idle' | 'saving' | 'saved' | 'error'

type DraftPersistenceStatusContextValue = {
  status: DraftPersistenceStatus
  savedAt: string | null
}

export const DraftPersistenceStatusContext = createContext<DraftPersistenceStatusContextValue | null>(null)

export function useDraftPersistenceStatus() {
  const context = useContext(DraftPersistenceStatusContext)

  if (!context) {
    throw new Error('useDraftPersistenceStatus must be used within DraftPersistenceBoundary')
  }

  return context
}
