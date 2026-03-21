export function buildThemeSlug(name: string) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'untitled'
}

export function buildThemeNameFromSlug(themeSlug: string) {
  const normalized = themeSlug.trim().replace(/[-_]+/g, ' ').replace(/\s+/g, ' ')

  if (!normalized) {
    return 'Untitled'
  }

  return normalized
    .split(' ')
    .map((segment) => segment.slice(0, 1).toUpperCase() + segment.slice(1).toLowerCase())
    .join(' ')
}
