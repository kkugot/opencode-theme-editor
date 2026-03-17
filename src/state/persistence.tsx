import { useEffect, useRef, useState, type PropsWithChildren } from 'react'
import { saveCurrentDraft } from '../persistence/drafts-db'
import { DraftPersistenceStatusContext, type DraftPersistenceStatus } from './persistence-status'
import { useThemeDraft } from './theme-store-hooks'

type DraftPersistenceBoundaryProps = PropsWithChildren

export function DraftPersistenceBoundary({ children }: DraftPersistenceBoundaryProps) {
  const draft = useThemeDraft()
  const [status, setStatus] = useState<DraftPersistenceStatus>('idle')
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const isFirstSave = useRef(true)

  useEffect(() => {
    if (isFirstSave.current) {
      isFirstSave.current = false
      return
    }

    setStatus('saving')

    const timeout = window.setTimeout(() => {
      void saveCurrentDraft(draft)
        .then(() => {
          setSavedAt(
            new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
          )
          setStatus('saved')
        })
        .catch(() => {
          setStatus('error')
        })
    }, 300)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [draft])

  return <DraftPersistenceStatusContext.Provider value={{ status, savedAt }}>{children}</DraftPersistenceStatusContext.Provider>
}
