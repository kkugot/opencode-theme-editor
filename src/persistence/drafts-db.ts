import type { ThemeDraft } from '../domain/theme/model'

const DATABASE_NAME = 'opencode-theme-editor'
const DATABASE_VERSION = 1
const STORE_NAME = 'drafts'
const CURRENT_DRAFT_KEY = 'current-draft'

export type PersistedThemeDraft = {
  version: 1
  savedAt: string
  draft: ThemeDraft
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION)

    request.onupgradeneeded = () => {
      const database = request.result

      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME)
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'))
  })
}

export async function loadCurrentDraft() {
  const database = await openDatabase()

  return new Promise<PersistedThemeDraft | null>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.get(CURRENT_DRAFT_KEY)

    request.onsuccess = () => {
      const value = request.result
      resolve(value && typeof value === 'object' ? (value as PersistedThemeDraft) : null)
    }

    request.onerror = () => reject(request.error ?? new Error('Failed to load draft'))
    transaction.oncomplete = () => database.close()
  })
}

export async function saveCurrentDraft(draft: ThemeDraft) {
  const database = await openDatabase()

  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)

    store.put(
      {
        version: 1,
        savedAt: new Date().toISOString(),
        draft,
      } satisfies PersistedThemeDraft,
      CURRENT_DRAFT_KEY,
    )

    transaction.oncomplete = () => {
      database.close()
      resolve()
    }

    transaction.onerror = () => reject(transaction.error ?? new Error('Failed to save draft'))
  })
}
