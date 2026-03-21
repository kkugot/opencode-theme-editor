const PRESET_CATEGORY_ALIASES: Record<string, string> = {
  christmas: 'holidays',
  halloween: 'holidays',
  holiday: 'holidays',
  holidays: 'holidays',
  wedding: 'holidays',
  skin: 'earth',
}

function normalizeCategoryToken(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/gu, '-')
}

export function getCanonicalPresetCategoryValue(value: string) {
  const normalized = normalizeCategoryToken(value)

  return PRESET_CATEGORY_ALIASES[normalized] ?? normalized
}

export function formatPresetCategoryLabel(value: string) {
  return getCanonicalPresetCategoryValue(value)
    .split('-')
    .filter(Boolean)
    .map((part: string) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(' ')
}

export function getPresetCategoryLabel(metaLabel?: string, tags?: string[]) {
  if (metaLabel?.trim()) {
    return formatPresetCategoryLabel(metaLabel)
  }

  const firstTag = tags?.find((tag) => tag.trim())

  return firstTag ? formatPresetCategoryLabel(firstTag) : null
}

export function getPresetCategoryTokens(metaLabel?: string, tags?: string[]) {
  return [...(metaLabel ? [metaLabel] : []), ...(tags ?? [])]
    .map(getCanonicalPresetCategoryValue)
    .filter(Boolean)
}
