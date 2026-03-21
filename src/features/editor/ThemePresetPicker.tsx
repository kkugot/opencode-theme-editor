import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { getPresetCategoryLabel, getPresetCategoryTokens } from '../../domain/presets/presetCategories'
import { type RemixStrength, type ThemePreset } from '../../domain/presets/themePresets'
import type { ThemeMode, ThemeTokens } from '../../domain/theme/model'

type ThemePresetPickerProps = {
  activeMode: ThemeMode
  presets: ThemePreset[]
  selectedPresetId?: string | null
  selectedPresetPreview?: ThemePreset | null
  canRemixSelectedPreset: boolean
  canUndoSelectedPreset: boolean
  onApplyPreset: (preset: ThemePreset) => void
  onRemixSelectedPreset: (strength: RemixStrength) => void
  onUndoSelectedPreset: () => void
}

type ThemePresetGroup = {
  id: string
  kind: 'builtin' | 'category'
  title: string
  presets: ThemePreset[]
}

type PresetStyleOption = {
  value: string
  label: string
}

const ALL_STYLE_FILTER = 'all-styles'
const BUILTIN_GROUP_ID = 'opencode'

const REMIX_ACTIONS: Array<{ strength: RemixStrength; label: string }> = [
  { strength: 'subtle', label: 'Soft' },
  { strength: 'balanced', label: 'Hard' },
  { strength: 'wild', label: 'Insane' },
]

type ThumbnailPixelRect = {
  className: string
  x: number
  y: number
  width: number
  height: number
}

const THUMBNAIL_PIXEL_RECTS: ThumbnailPixelRect[] = [
  { className: 'theme-preset-thumbnail-pixel-bg', x: 0, y: 0, width: 36, height: 19 },
  { className: 'theme-preset-thumbnail-pixel-header', x: 1, y: 1, width: 27, height: 3 },
  { className: 'theme-preset-thumbnail-pixel-header-accent', x: 1, y: 1, width: 1, height: 3 },
  { className: 'theme-preset-thumbnail-pixel-divider', x: 29, y: 0, width: 1, height: 19 },
  { className: 'theme-preset-thumbnail-pixel-sidebar', x: 30, y: 0, width: 6, height: 19 },
  { className: 'theme-preset-thumbnail-pixel-composer', x: 1, y: 15, width: 27, height: 3 },
  { className: 'theme-preset-thumbnail-pixel-composer-accent', x: 1, y: 15, width: 1, height: 3 },
  { className: 'theme-preset-thumbnail-pixel-title', x: 4, y: 2, width: 6, height: 1 },
  { className: 'theme-preset-thumbnail-pixel-body-line-text', x: 4, y: 6, width: 10, height: 1 },
  { className: 'theme-preset-thumbnail-pixel-body-line-muted', x: 4, y: 8, width: 10, height: 1 },
  { className: 'theme-preset-thumbnail-pixel-body-line-muted', x: 4, y: 10, width: 10, height: 1 },
  { className: 'theme-preset-thumbnail-pixel-body-line-function', x: 4, y: 12, width: 4, height: 1 },
  { className: 'theme-preset-thumbnail-pixel-body-chip-added', x: 16, y: 6, width: 2, height: 2 },
  { className: 'theme-preset-thumbnail-pixel-body-chip-primary', x: 19, y: 6, width: 2, height: 2 },
  { className: 'theme-preset-thumbnail-pixel-body-chip-success', x: 22, y: 6, width: 2, height: 2 },
  { className: 'theme-preset-thumbnail-pixel-body-chip-removed-small', x: 16, y: 10, width: 2, height: 2 },
  { className: 'theme-preset-thumbnail-pixel-body-chip-warning', x: 19, y: 10, width: 2, height: 2 },
  { className: 'theme-preset-thumbnail-pixel-body-chip-accent', x: 22, y: 10, width: 2, height: 2 },
  { className: 'theme-preset-thumbnail-pixel-composer-line', x: 4, y: 16, width: 10, height: 1 },
  { className: 'theme-preset-thumbnail-pixel-sidebar-line-top', x: 31, y: 2, width: 3, height: 1 },
  { className: 'theme-preset-thumbnail-pixel-sidebar-line-mid', x: 31, y: 4, width: 3, height: 1 },
  { className: 'theme-preset-thumbnail-pixel-sidebar-line-mid', x: 31, y: 6, width: 3, height: 1 },
  { className: 'theme-preset-thumbnail-pixel-sidebar-chip-primary', x: 31, y: 8, width: 3, height: 1 },
  { className: 'theme-preset-thumbnail-pixel-sidebar-chip-added', x: 31, y: 10, width: 3, height: 1 },
  { className: 'theme-preset-thumbnail-pixel-sidebar-chip-success', x: 31, y: 12, width: 3, height: 1 },
  { className: 'theme-preset-thumbnail-pixel-sidebar-chip-warning', x: 31, y: 14, width: 3, height: 1 },
  { className: 'theme-preset-thumbnail-pixel-sidebar-chip-accent', x: 31, y: 16, width: 3, height: 1 },
]

const PRESET_SCROLL_DURATION_MS = 180

function formatCountLabel(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`
}

function normalizePresetStyleValue(value: string) {
  return value.trim().toLowerCase()
}

function getPresetStyleLabel(preset: ThemePreset) {
  return getPresetCategoryLabel(preset.metaLabel, preset.tags)
}

function easeOutCubic(value: number) {
  return 1 - (1 - value) ** 3
}

function getPresetStyleTokens(preset: ThemePreset) {
  return getPresetCategoryTokens(preset.metaLabel, preset.tags).map(normalizePresetStyleValue)
}

function buildThumbnailStyle(tokens: ThemeTokens) {
  return {
    ['--thumb-bg' as string]: tokens.background,
    ['--thumb-panel' as string]: tokens.backgroundPanel,
    ['--thumb-element' as string]: tokens.backgroundElement,
    ['--thumb-menu' as string]: tokens.backgroundMenu,
    ['--thumb-frame' as string]: tokens.border,
    ['--thumb-border' as string]: tokens.borderSubtle,
    ['--thumb-text' as string]: tokens.text,
    ['--thumb-muted' as string]: tokens.textMuted,
    ['--thumb-accent' as string]: tokens.accent,
    ['--thumb-primary' as string]: tokens.primary,
    ['--thumb-success' as string]: tokens.success,
    ['--thumb-warning' as string]: tokens.warning,
    ['--thumb-danger' as string]: tokens.error,
    ['--thumb-added' as string]: tokens.diffAdded,
    ['--thumb-removed' as string]: tokens.diffRemoved,
    ['--thumb-todo' as string]: tokens.markdownListItem,
    ['--thumb-keyword' as string]: tokens.syntaxKeyword,
    ['--thumb-string' as string]: tokens.syntaxString,
    ['--thumb-function' as string]: tokens.syntaxFunction,
  } as CSSProperties
}

function ThemePresetThumbnail({ preset, activeMode }: { preset: ThemePreset; activeMode: ThemeMode }) {
  return (
    <div
      className="theme-preset-thumbnail"
      style={buildThumbnailStyle(preset.themes[activeMode])}
      aria-hidden="true"
    >
      <svg className="theme-preset-thumbnail-art" viewBox="0 0 36 19" shapeRendering="crispEdges">
        {THUMBNAIL_PIXEL_RECTS.map((rect) => (
          <rect
            key={`${rect.className}-${rect.x}-${rect.y}`}
            className={rect.className}
            x={rect.x}
            y={rect.y}
            width={rect.width}
            height={rect.height}
          />
        ))}
      </svg>
    </div>
  )
}

function DiceIcon({ pips }: { pips: 2 | 4 | 5 | 6 }) {
  const pipMap: Record<2 | 4 | 5 | 6, Array<[number, number]>> = {
    2: [
      [8.5, 8.5],
      [15.5, 15.5],
    ],
    4: [
      [8.5, 8.5],
      [15.5, 8.5],
      [8.5, 15.5],
      [15.5, 15.5],
    ],
    5: [
      [8.5, 8.5],
      [15.5, 8.5],
      [12, 12],
      [8.5, 15.5],
      [15.5, 15.5],
    ],
    6: [
      [8.5, 8],
      [15.5, 8],
      [8.5, 12],
      [15.5, 12],
      [8.5, 16],
      [15.5, 16],
    ],
  }

  return (
    <svg className="theme-preset-action-icon" viewBox="0 0 24 24" aria-hidden="true">
      <rect
        x="4.75"
        y="4.75"
        width="14.5"
        height="14.5"
        rx="3.25"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      {pipMap[pips].map(([cx, cy]) => (
        <circle key={`${pips}-${cx}-${cy}`} cx={cx} cy={cy} r="1.08" fill="currentColor" />
      ))}
    </svg>
  )
}

function UndoIcon() {
  return (
    <svg className="theme-preset-action-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M10 7.5 6 11.5l4 4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <path
        d="M6.5 11.5H14a4.5 4.5 0 1 1 0 9h-2.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  )
}

export function ThemePresetPicker(props: ThemePresetPickerProps) {
  const {
    activeMode,
    presets,
    selectedPresetId,
    selectedPresetPreview,
    canRemixSelectedPreset,
    canUndoSelectedPreset,
    onApplyPreset,
    onRemixSelectedPreset,
    onUndoSelectedPreset,
  } = props
  const [searchValue, setSearchValue] = useState('')
  const [styleFilter, setStyleFilter] = useState(ALL_STYLE_FILTER)
  const [collapsedGroupIds, setCollapsedGroupIds] = useState(() => new Set<string>([BUILTIN_GROUP_ID]))
  const toolbarRef = useRef<HTMLDivElement>(null)
  const scrollAnimationFrameRef = useRef<number | null>(null)
  const presetItemRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const normalizedSearchValue = searchValue.trim().toLowerCase()

  useEffect(() => {
    return () => {
      if (scrollAnimationFrameRef.current === null) {
        return
      }

      cancelAnimationFrame(scrollAnimationFrameRef.current)
    }
  }, [])
  const styleOptions = useMemo<PresetStyleOption[]>(() => {
    const optionMap = new Map<string, string>()

    for (const preset of presets) {
      if (preset.source === 'opencode' || preset.source === 'random') {
        continue
      }

      const label = getPresetStyleLabel(preset)

      if (!label) {
        continue
      }

      optionMap.set(normalizePresetStyleValue(label), label)
    }

    return [...optionMap.entries()]
      .sort((left, right) => left[1].localeCompare(right[1]))
      .map(([value, label]) => ({ value, label }))
  }, [presets])

  useEffect(() => {
    if (styleFilter === ALL_STYLE_FILTER) {
      return
    }

    if (!styleOptions.some((option) => option.value === styleFilter)) {
      setStyleFilter(ALL_STYLE_FILTER)
    }
  }, [styleFilter, styleOptions])

  const styleScopedPresets = useMemo(() => {
    const hasStyleFilter = styleFilter !== ALL_STYLE_FILTER

    return presets.filter((preset) => {
      if (preset.source === 'random') {
        return false
      }

      if (!hasStyleFilter) {
        return true
      }

      if (preset.source === 'opencode') {
        return false
      }

      return getPresetStyleTokens(preset).includes(styleFilter)
    })
  }, [presets, styleFilter])

  const searchablePresets = useMemo(() => {
    return styleScopedPresets.filter((preset) => {
      if (!normalizedSearchValue) {
        return true
      }

      const searchableText = [
        preset.name,
        preset.sourceLabel,
        preset.metaLabel,
        getPresetStyleLabel(preset),
        ...getPresetStyleTokens(preset),
        ...(preset.tags ?? []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return searchableText.includes(normalizedSearchValue)
    })
  }, [normalizedSearchValue, styleScopedPresets])

  const presetGroups = useMemo<ThemePresetGroup[]>(() => {
    const hasStyleFilter = styleFilter !== ALL_STYLE_FILTER
    const builtinPresets = searchablePresets.filter((preset) => preset.source === 'opencode')
    const categoryMap = new Map<string, ThemePresetGroup>()

    for (const preset of searchablePresets) {
      if (preset.source === 'opencode') {
        continue
      }

      const title = getPresetStyleLabel(preset) ?? 'Other'
      const id = `category:${normalizePresetStyleValue(title)}`
      const group = categoryMap.get(id)

      if (group) {
        group.presets.push(preset)
        continue
      }

      categoryMap.set(id, {
        id,
        kind: 'category',
        title,
        presets: [preset],
      })
    }

    const groups: ThemePresetGroup[] = []

    if (!hasStyleFilter && builtinPresets.length > 0) {
      groups.push({
        id: BUILTIN_GROUP_ID,
        kind: 'builtin',
        title: 'OpenCode built-ins',
        presets: builtinPresets,
      })
    }

    groups.push(
      ...[...categoryMap.values()].sort((left, right) => left.title.localeCompare(right.title)),
    )

    return groups
  }, [searchablePresets, styleFilter])
  const availablePresetCount = styleScopedPresets.length
  const visiblePresetCount = useMemo(
    () => presetGroups.reduce((count, group) => count + group.presets.length, 0),
    [presetGroups],
  )
  const searchPlaceholder = `Search ${formatCountLabel(availablePresetCount, 'preset')}`

  function isGroupExpanded(groupId: string) {
    return normalizedSearchValue.length > 0 || !collapsedGroupIds.has(groupId)
  }

  function toggleGroup(groupId: string) {
    setCollapsedGroupIds((current) => {
      const next = new Set(current)

      if (next.has(groupId)) {
        next.delete(groupId)
      } else {
        next.add(groupId)
      }

      return next
    })
  }

  function getGroupIdForPreset(preset: ThemePreset) {
    if (preset.source === 'opencode') {
      return BUILTIN_GROUP_ID
    }

    const title = getPresetStyleLabel(preset) ?? 'Other'

    return `category:${normalizePresetStyleValue(title)}`
  }

  function scrollPresetIntoView(presetId: string) {
    requestAnimationFrame(() => {
      const presetItem = presetItemRefs.current[presetId]
      const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false

      if (!presetItem) {
        return
      }

      const scrollContainer = presetItem.closest('.editor-stack')

      if (!(scrollContainer instanceof HTMLElement) || typeof scrollContainer.scrollTo !== 'function') {
        presetItem.scrollIntoView?.({
          block: 'start',
          behavior: prefersReducedMotion ? 'auto' : 'smooth',
        })
        return
      }

      if (scrollAnimationFrameRef.current !== null) {
        cancelAnimationFrame(scrollAnimationFrameRef.current)
        scrollAnimationFrameRef.current = null
      }

      const toolbarHeight = toolbarRef.current?.getBoundingClientRect().height ?? 0
      const containerRect = scrollContainer.getBoundingClientRect()
      const presetRect = presetItem.getBoundingClientRect()
      const topGap = 10
      const targetScrollTop = Math.max(
        0,
        scrollContainer.scrollTop + presetRect.top - containerRect.top - toolbarHeight - topGap,
      )

      if (prefersReducedMotion) {
        scrollContainer.scrollTop = targetScrollTop
        return
      }

      const startScrollTop = scrollContainer.scrollTop
      const distance = targetScrollTop - startScrollTop

      if (Math.abs(distance) < 1) {
        scrollContainer.scrollTop = targetScrollTop
        return
      }

      const startTime = performance.now()

      const step = (timestamp: number) => {
        const progress = Math.min((timestamp - startTime) / PRESET_SCROLL_DURATION_MS, 1)
        const easedProgress = easeOutCubic(progress)

        scrollContainer.scrollTop = startScrollTop + distance * easedProgress

        if (progress >= 1) {
          scrollAnimationFrameRef.current = null
          return
        }

        scrollAnimationFrameRef.current = requestAnimationFrame(step)
      }

      scrollAnimationFrameRef.current = requestAnimationFrame(step)
    })
  }

  function applyRandomVisiblePreset() {
    if (searchablePresets.length === 0) {
      return
    }

    const randomPreset = searchablePresets[Math.floor(Math.random() * searchablePresets.length)]

    if (!randomPreset) {
      return
    }

    const groupId = getGroupIdForPreset(randomPreset)

    setCollapsedGroupIds((current) => {
      if (!current.has(groupId)) {
        return current
      }

      const next = new Set(current)

      next.delete(groupId)

      return next
    })
    onApplyPreset(randomPreset)
    scrollPresetIntoView(randomPreset.id)
  }

  return (
    <section className="theme-preset-panel panel-card">
      <div ref={toolbarRef} className="theme-preset-toolbar">
        <div className="theme-preset-filter-combo">
          <input
            type="search"
            className="theme-preset-search-input"
            value={searchValue}
            placeholder={searchPlaceholder}
            spellCheck={false}
            aria-label="Search presets"
            onChange={(event) => {
              setSearchValue(event.target.value)
            }}
          />

          <label className="theme-preset-style-filter">
            <select
              className="theme-preset-style-select"
              value={styleFilter}
              aria-label="Filter community presets by style"
              onChange={(event) => {
                setStyleFilter(event.target.value)
              }}
            >
              <option value={ALL_STYLE_FILTER}>All styles</option>

              {styleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <button type="button" className="theme-random-button theme-random-button-inline" onClick={applyRandomVisiblePreset}>
            Random
          </button>
        </div>
      </div>

      <div className="theme-preset-list editor-groups">
        {visiblePresetCount === 0 ? (
          <p className="theme-preset-empty">No presets match this search yet.</p>
        ) : (
          presetGroups.map((group) => (
            <section key={group.id} className="theme-preset-group editor-group">
              <button
                type="button"
                className="theme-preset-group-toggle editor-group-header"
                aria-expanded={isGroupExpanded(group.id)}
                onClick={() => {
                  toggleGroup(group.id)
                }}
              >
                <span className="theme-preset-group-toggle-copy">
                  <span className="theme-preset-group-toggle-caret" aria-hidden="true">
                    ▸
                  </span>
                  <span className="editor-group-label">{group.title}</span>
                </span>

                <span className="theme-preset-group-count">({group.presets.length})</span>
              </button>

              {isGroupExpanded(group.id) ? (
                <div className="theme-preset-group-list">
                  {group.presets.map((preset) => {
                    const displayPreset = selectedPresetPreview?.id === preset.id ? selectedPresetPreview : preset
                    const presetStyleLabel = getPresetStyleLabel(displayPreset)
                    const isSelected = displayPreset.id === selectedPresetId

                    return (
                      <div
                        key={preset.id}
                        ref={(element) => {
                          presetItemRefs.current[preset.id] = element
                        }}
                        className={
                          isSelected
                            ? 'theme-preset-option active has-actions'
                            : 'theme-preset-option'
                        }
                        data-source={displayPreset.source}
                      >
                        <button
                          type="button"
                          className="theme-preset-option-main theme-preset-option-thumbnail"
                          onClick={() => {
                            onApplyPreset(displayPreset)
                          }}
                        >
                          <ThemePresetThumbnail preset={displayPreset} activeMode={activeMode} />

                          <span className="theme-preset-option-copy">
                            <span className="theme-preset-option-name">{displayPreset.name}</span>

                            {presetStyleLabel ? (
                              <span className="theme-preset-option-subtitle-row">
                                <span className="theme-preset-option-subtitle">{presetStyleLabel}</span>
                              </span>
                            ) : null}
                          </span>
                        </button>

                        {isSelected ? (
                          <div className="theme-preset-option-actions">
                            <div className="theme-preset-remix-group" role="group" aria-label="Preset remix strength">
                              {REMIX_ACTIONS.map((action) => (
                                <button
                                  key={action.strength}
                                  type="button"
                                  className="theme-preset-remix-die"
                                  aria-label={`${action.label} remix preset`}
                                  title={action.label}
                                  disabled={!canRemixSelectedPreset}
                                  onClick={() => {
                                    onRemixSelectedPreset(action.strength)
                                  }}
                                >
                                  <DiceIcon pips={action.strength === 'subtle' ? 2 : action.strength === 'balanced' ? 4 : 6} />
                                </button>
                              ))}
                            </div>

                            <button
                              type="button"
                              className="theme-preset-action-button"
                              aria-label="Undo preset remix"
                              disabled={!canUndoSelectedPreset}
                              onClick={() => {
                                onUndoSelectedPreset()
                              }}
                            >
                              <UndoIcon />
                            </button>
                          </div>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              ) : null}
            </section>
          ))
        )}
      </div>
    </section>
  )
}
