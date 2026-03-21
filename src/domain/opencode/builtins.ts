import type { OpenCodeThemeJson } from './resolveTheme'

const builtinThemeModules = import.meta.glob<OpenCodeThemeJson>('./builtins/*.json', {
  eager: true,
  import: 'default',
})

const builtinThemeEntries = Object.entries(builtinThemeModules).map(([path, theme]) => {
  const fileName = path.split('/').at(-1) ?? path
  const name = fileName.replace(/\.json$/u, '')

  return [name, theme] as const
})

export const OPENCODE_BUILTIN_THEMES = Object.fromEntries(builtinThemeEntries) as Record<string, OpenCodeThemeJson>

export const OPENCODE_BUILTIN_THEME_NAMES = builtinThemeEntries
  .map(([name]) => name)
  .sort((left, right) => left.localeCompare(right, undefined, { sensitivity: 'base' }))
