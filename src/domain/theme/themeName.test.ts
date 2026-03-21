import { describe, expect, it } from 'vitest'
import { buildThemeNameFromSlug, buildThemeSlug } from './themeName'

describe('themeName', () => {
  it('builds a slug from a theme name', () => {
    expect(buildThemeSlug('Rose Mist!!')).toBe('rose-mist')
  })

  it('builds a title-cased theme name from a slug', () => {
    expect(buildThemeNameFromSlug('rose-mist')).toBe('Rose Mist')
    expect(buildThemeNameFromSlug('catppuccin-frappe')).toBe('Catppuccin Frappe')
    expect(buildThemeNameFromSlug('cobalt2')).toBe('Cobalt2')
  })
})
