import { loadCurrentDraft } from '../persistence/drafts-db'

export async function getHydratedDraft() {
  const persisted = await loadCurrentDraft()
  return persisted?.draft ?? null
}
