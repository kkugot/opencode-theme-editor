import { buildGeneratedPaletteThemeName } from './paletteNames'

export type PaletteLibraryProviderId = 'coolors' | 'colorhunt' | 'adobe-color'

export type PaletteLibraryEntry = {
  id: string
  name?: string
  likesLabel?: string
  palette: string[]
  href?: string
  tags?: string[]
  metaLabel?: string
}

export type PaletteLibraryProvider = {
  id: PaletteLibraryProviderId
  label: string
  kind: 'seed-palette'
  entries: PaletteLibraryEntry[]
}

export function buildPaletteLibraryEntryName(entry: PaletteLibraryEntry) {
  if (entry.name?.trim()) {
    return entry.name.trim()
  }

  return buildGeneratedPaletteThemeName({
    palette: entry.palette,
    tags: entry.tags,
    metaLabel: entry.metaLabel,
    fallbackId: entry.id,
  })
}
