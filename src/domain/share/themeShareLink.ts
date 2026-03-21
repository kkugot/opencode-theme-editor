export type SharedThemeLink = {
  themeSlug: string
  encodedPayload: string
}

function normalizeThemeSlug(themeSlug: string) {
  return themeSlug.trim()
}

export function buildThemeShareSearch({ themeSlug, encodedPayload }: SharedThemeLink) {
  const params = new URLSearchParams()
  const normalizedThemeSlug = normalizeThemeSlug(themeSlug)

  params.set(normalizedThemeSlug, encodedPayload)

  return `?${params.toString()}`
}

export function buildThemeShareUrl({ themeSlug, encodedPayload }: SharedThemeLink) {
  const url = new URL(window.location.href)

  url.search = buildThemeShareSearch({ themeSlug, encodedPayload })
  url.hash = ''

  return url.toString()
}

export function buildSharedDraftId({ themeSlug, encodedPayload }: SharedThemeLink) {
  return `shared:${normalizeThemeSlug(themeSlug)}:${encodedPayload.trim()}`
}

function parseThemeShareSearch(search: string) {
  const normalizedSearch = search.startsWith('?') ? search.slice(1) : search

  if (!normalizedSearch) {
    return null
  }

  const params = new URLSearchParams(normalizedSearch)
  const firstEntry = params.entries().next().value as [string, string] | undefined

  if (!firstEntry) {
    return null
  }

  const [themeSlug, encodedPayload] = firstEntry

  if (!themeSlug.trim() || !encodedPayload.trim()) {
    return null
  }

  return {
    themeSlug: themeSlug.trim(),
    encodedPayload: encodedPayload.trim(),
  }
}

export function parseThemeShareLocation(location: { search: string; hash: string }) {
  const sharedFromSearch = parseThemeShareSearch(location.search)

  if (sharedFromSearch) {
    return sharedFromSearch
  }

  const normalizedHash = location.hash.startsWith('#') ? location.hash.slice(1) : location.hash

  if (!normalizedHash) {
    return null
  }

  const legacyParams = new URLSearchParams(normalizedHash)
  const themeSlug = legacyParams.get('n')?.trim()
  const encodedPayload = legacyParams.get('t')?.trim()

  if (!themeSlug || !encodedPayload) {
    return null
  }

  return {
    themeSlug,
    encodedPayload,
  }
}
