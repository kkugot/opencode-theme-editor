import { useEffect, useRef } from 'react'
import type { CSSProperties, RefObject } from 'react'
import type { PreviewModel } from '../../domain/preview/buildPreviewModel'
import type { ThemeMode } from '../../domain/theme/model'

type PreviewSurfaceProps = {
  model: PreviewModel
  onModeChange: (mode: ThemeMode) => void
}

type ToolState = 'pending' | 'running' | 'completed' | 'error'
type ToolTone = 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error' | 'info'

const inlineToolExamples: Array<{
  tool: string
  icon: string
  message: string
  state: ToolState
  tone: ToolTone
}> = [
  {
    tool: 'glob',
    icon: '✱',
    message: 'Glob "src/features/**/*.tsx" (18 matches)',
    state: 'completed',
    tone: 'accent',
  },
  {
    tool: 'grep',
    icon: '✱',
    message: 'Grep "tool\\.state\\.status" (7 matches)',
    state: 'completed',
    tone: 'secondary',
  },
  {
    tool: 'list',
    icon: '→',
    message: 'List src/features/preview',
    state: 'completed',
    tone: 'info',
  },
  {
    tool: 'webfetch',
    icon: '%',
    message: 'WebFetch https://opencode.ai/docs/themes',
    state: 'running',
    tone: 'info',
  },
  {
    tool: 'codesearch',
    icon: '◇',
    message: 'Exa Code Search "PART_MAPPING" (12 results)',
    state: 'completed',
    tone: 'primary',
  },
  {
    tool: 'websearch',
    icon: '◈',
    message: 'Exa Web Search "opencode tool output"',
    state: 'pending',
    tone: 'warning',
  },
  {
    tool: 'task',
    icon: '│',
    message: 'Task explore output surface parity',
    state: 'running',
    tone: 'primary',
  },
  {
    tool: 'skill',
    icon: '→',
    message: 'Skill "opencode-theme-authoring"',
    state: 'completed',
    tone: 'success',
  },
  {
    tool: 'generic',
    icon: '⚙',
    message: 'Generic tool fallback (unknown_tool)',
    state: 'error',
    tone: 'error',
  },
]

const structuredPartTypes = [
  'text',
  'reasoning',
  'tool',
  'file',
  'compaction',
  'agent',
  'subtask',
  'retry',
  'step-start',
  'step-finish',
  'snapshot',
  'patch',
]

const todoItems = [
  { status: 'done', content: 'Map PART_MAPPING and ToolPart switch cases' },
  { status: 'done', content: 'Add inline and block tool output renderers to preview' },
  { status: 'active', content: 'Document output taxonomy for future source updates' },
]

const questionAnswers = [
  {
    question: 'Should the preview include every tool renderer?',
    answer: 'Yes, include inline and block outputs',
  },
  {
    question: 'How should schema-only parts be represented?',
    answer: 'Show them in a structured part inventory section',
  },
]

const sidebarMcpItems = ['aleph', 'apple-mail', 'basic-memory', 'browser-control', 'figma', 'mcp-atlassian', 'omnifocus', 'webstorm']

const sidebarLspItems = ['typescript', 'eslint', 'typescript ../opencode-upstream', 'eslint ../opencode-upstream']

const sidebarTodoItems: Array<{
  status: 'done' | 'active' | 'pending'
  content: string
}> = [
  {
    status: 'done',
    content: 'Review current app shell layout and style structure',
  },
  {
    status: 'active',
    content: 'Implement right-side sidebar with context and operational sections',
  },
  {
    status: 'pending',
    content: 'Adjust terminal pane spacing and verify responsive collapse behavior',
  },
  {
    status: 'pending',
    content: 'Run lint and build to validate UI changes',
  },
]

function useCustomScrollbar(
  viewportRef: RefObject<HTMLDivElement | null>,
  thumbRef: RefObject<HTMLSpanElement | null>,
) {
  useEffect(() => {
    const viewport = viewportRef.current
    const thumb = thumbRef.current

    if (!viewport || !thumb) {
      return
    }

    const MIN_THUMB_HEIGHT = 16
    let animationFrame = 0

    const updateThumb = () => {
      const { scrollTop, scrollHeight, clientHeight } = viewport

      if (clientHeight <= 0) {
        thumb.style.height = `${MIN_THUMB_HEIGHT}px`
        thumb.style.transform = 'translateY(0px)'

        return
      }

      const maxScrollTop = Math.max(scrollHeight - clientHeight, 0)
      const proportionalHeight = scrollHeight > 0 ? (clientHeight / scrollHeight) * clientHeight : clientHeight
      const nextThumbHeight = Math.max(Math.floor(proportionalHeight), MIN_THUMB_HEIGHT)
      const maxThumbOffset = Math.max(clientHeight - nextThumbHeight, 0)
      const nextThumbOffset = maxScrollTop > 0 ? (scrollTop / maxScrollTop) * maxThumbOffset : 0

      thumb.style.height = `${nextThumbHeight}px`
      thumb.style.transform = `translateY(${Math.floor(nextThumbOffset)}px)`
    }

    const scheduleUpdate = () => {
      if (animationFrame !== 0) {
        return
      }

      animationFrame = window.requestAnimationFrame(() => {
        animationFrame = 0
        updateThumb()
      })
    }

    scheduleUpdate()

    viewport.addEventListener('scroll', scheduleUpdate, { passive: true })
    window.addEventListener('resize', scheduleUpdate)

    const resizeObserver = new ResizeObserver(scheduleUpdate)
    resizeObserver.observe(viewport)

    return () => {
      viewport.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('resize', scheduleUpdate)
      resizeObserver.disconnect()

      if (animationFrame !== 0) {
        window.cancelAnimationFrame(animationFrame)
      }
    }
  }, [viewportRef, thumbRef])
}

export function PreviewSurface({ model, onModeChange }: PreviewSurfaceProps) {
  const { tokens } = model
  const transcriptViewportRef = useRef<HTMLDivElement>(null)
  const transcriptThumbRef = useRef<HTMLSpanElement>(null)
  const sidebarViewportRef = useRef<HTMLDivElement>(null)
  const sidebarThumbRef = useRef<HTMLSpanElement>(null)

  useCustomScrollbar(transcriptViewportRef, transcriptThumbRef)
  useCustomScrollbar(sidebarViewportRef, sidebarThumbRef)

  const toneColor: Record<ToolTone, string> = {
    primary: tokens.primary,
    secondary: tokens.secondary,
    accent: tokens.accent,
    success: tokens.success,
    warning: tokens.warning,
    error: tokens.error,
    info: tokens.info,
  }

  const stateColor: Record<ToolState, string> = {
    pending: tokens.warning,
    running: tokens.info,
    completed: tokens.success,
    error: tokens.error,
  }

  const stateLabel: Record<ToolState, string> = {
    pending: 'pending',
    running: 'running',
    completed: 'done',
    error: 'error',
  }

  const composerHighlight = tokens.primary

  const surfaceStyle = {
    background: tokens.background,
    color: tokens.text,
    ['--console-background' as string]: tokens.background,
    ['--console-panel' as string]: tokens.backgroundPanel,
    ['--console-element' as string]: tokens.backgroundElement,
    ['--console-border' as string]: tokens.border,
    ['--console-border-subtle' as string]: tokens.borderSubtle,
    ['--terminal-scrollbar-thumb' as string]: tokens.backgroundPanel,
    ['--terminal-scrollbar-track' as string]: tokens.background,
    ['--console-thinking-accent' as string]: tokens.accent,
  } as CSSProperties

  return (
    <div className="preview-surface console-preview" style={surfaceStyle} data-mode={model.mode}>
      <div className="console-macos-header">
        <div className="console-macos-dots" aria-hidden="true">
          <span className="console-macos-dot-close" />
          <span className="console-macos-dot-minimize" />
          <span className="console-macos-dot-zoom" />
        </div>
        <div className="console-macos-titlewrap">
          <div className="console-macos-title">Opencode Theme Editor • Preview • Scroll to see more</div>
        </div>
        <div className="console-macos-mode-toggle" role="tablist" aria-label="Theme mode">
          {(['dark', 'light'] as const).map((mode) => {
            const isActive = model.mode === mode

            return (
              <button
                key={mode}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={isActive ? 'console-macos-mode-button active' : 'console-macos-mode-button'}
                onClick={() => onModeChange(mode)}
              >
                {mode.toUpperCase()}
              </button>
            )
          })}
        </div>
      </div>

      <div className="console-workspace">
        <section className="console-body">
          <header
            className="console-command-bar"
            style={{
              background: tokens.backgroundPanel,
              borderLeftColor: tokens.primary,
              color: tokens.text,
            }}
          >
            <span className="console-command-text"># Output type coverage from opencode source</span>
            <span className="console-command-stats" style={{ color: tokens.textMuted }}>
              32.1k 22% ($0.11)
            </span>
          </header>

          <div
            className="console-user-intent"
            style={{
              background: tokens.backgroundElement,
              borderLeftColor: tokens.secondary,
              color: tokens.text,
              justifyContent: 'space-between',
            }}
          >
            <span>Include every OpenCode message/tool output type in this TUI preview</span>
            <span className="console-file-badges">
              <span className="console-file-badge" style={{ background: tokens.secondary, color: tokens.background }}>
                tsx
              </span>
              <span className="console-file-badge-name" style={{ color: tokens.textMuted }}>
                PreviewSurface.tsx
              </span>
            </span>
          </div>

          <div className="console-transcript">
            <div ref={transcriptViewportRef} className="console-transcript-viewport">
          <p className="console-line" style={{ color: tokens.markdownText }}>
            The preview now mirrors upstream OpenCode output renderers.
          </p>
          <p className="console-line" style={{ color: tokens.textMuted }}>
            <span style={{ color: tokens.secondary }}>assistant/reasoning:</span> Thinking through PART_MAPPING and
            ToolPart switch cases before patching.
          </p>
          <p className="console-line" style={{ color: tokens.text }}>
            <span style={{ color: tokens.warning }}>user/file:</span> architecture.md, screenshot.png, trace.har
          </p>
          <p className="console-line" style={{ color: tokens.info }}>
            <span style={{ color: tokens.info }}>agent:</span> @research and @build references are preserved in
            prompt parts.
          </p>
          <p className="console-line" style={{ color: tokens.textMuted }}>
            <span style={{ color: tokens.accent }}>compaction:</span> ---- Compaction boundary inserted ----
          </p>
          <p className="console-line" style={{ color: tokens.textMuted }}>
            <span style={{ color: tokens.secondary }}>▣</span> Build · claude-sonnet-4-20250514 · 8s
          </p>

          <div className="console-stream-separator" style={{ borderColor: tokens.borderSubtle }} />

          <p className="console-line" style={{ color: tokens.markdownHeading }}>
            ## Output taxonomy notes
          </p>
          <p className="console-line" style={{ color: tokens.markdownText }}>
            Review <span style={{ color: tokens.markdownLinkText }}>[session/index.tsx]</span>{' '}
            <span style={{ color: tokens.markdownLink }}>(renderer switch)</span> and keep
            <span style={{ color: tokens.markdownCode }}> PART_MAPPING </span>
            parity.
          </p>
          <p className="console-line" style={{ color: tokens.markdownBlockQuote }}>
            &gt; Preview and export should stay downstream from the same token pipeline.
          </p>
          <p className="console-line" style={{ color: tokens.markdownText }}>
            <span style={{ color: tokens.markdownEmph }}>*thinking*</span> +{' '}
            <span style={{ color: tokens.markdownStrong }}>**execution**</span> +{' '}
            <span style={{ color: tokens.markdownCode }}>`tool.state.status`</span>
          </p>
          <div className="console-rule" style={{ borderColor: tokens.markdownHorizontalRule }} />
          <p className="console-line" style={{ color: tokens.markdownText }}>
            <span style={{ color: tokens.markdownListEnumeration }}>1.</span> catalog tool renderers{' '}
            <span style={{ color: tokens.markdownListItem }}>•</span> add missing output states
          </p>
          <p className="console-line" style={{ color: tokens.markdownText }}>
            <span style={{ color: tokens.markdownImage }}>![matrix]</span>{' '}
            <span style={{ color: tokens.markdownImageText }}>Output type preview matrix</span>
          </p>

          <div className="console-code-block" style={{ background: tokens.backgroundElement, borderColor: tokens.borderSubtle }}>
            <p className="console-code-line" style={{ color: tokens.markdownCodeBlock }}>
              // syntax token coverage
            </p>
            <p className="console-code-line">
              <span style={{ color: tokens.syntaxKeyword }}>const</span>
              <span style={{ color: tokens.syntaxFunction }}> renderTool</span>
              <span style={{ color: tokens.syntaxOperator }}> = </span>
              <span style={{ color: tokens.syntaxPunctuation }}>(</span>
              <span style={{ color: tokens.syntaxVariable }}>part</span>
              <span style={{ color: tokens.syntaxPunctuation }}>: </span>
              <span style={{ color: tokens.syntaxType }}>Part</span>
              <span style={{ color: tokens.syntaxPunctuation }}>) =&gt; </span>
              <span style={{ color: tokens.syntaxString }}>'tool:'</span>
              <span style={{ color: tokens.syntaxOperator }}> + </span>
              <span style={{ color: tokens.syntaxVariable }}>part</span>
              <span style={{ color: tokens.syntaxPunctuation }}>.</span>
              <span style={{ color: tokens.syntaxFunction }}>tool</span>
              <span style={{ color: tokens.syntaxOperator }}> ?? </span>
              <span style={{ color: tokens.syntaxNumber }}>0</span>
            </p>
            <p className="console-code-line" style={{ color: tokens.syntaxComment }}>
              // punctuation and operators should stay legible in dense diffs
            </p>
          </div>

          <div className="console-stream-separator" style={{ borderColor: tokens.borderSubtle }} />

          {inlineToolExamples.map((item) => (
            <div key={item.tool} className="console-tool-inline">
              <div className="console-tool-inline-main" style={{ color: tokens.text }}>
                <span className="console-tool-icon" style={{ color: toneColor[item.tone] }}>
                  {item.icon}
                </span>
                <span>{item.message}</span>
              </div>
              <span className="console-tool-state" style={{ color: stateColor[item.state] }}>
                {stateLabel[item.state]}
              </span>
            </div>
          ))}

          <div className="console-stream-separator" style={{ borderColor: tokens.borderSubtle }} />

          <article className="console-tool-card" style={{ borderColor: tokens.borderSubtle, background: tokens.backgroundPanel }}>
            <div className="console-tool-card-title" style={{ color: tokens.textMuted }}>
              # Bash · completed output
            </div>
            <p className="console-line" style={{ color: tokens.text }}>
              $ npm run lint && npm run build
            </p>
            <p className="console-line" style={{ color: tokens.success }}>
              ✓ lint passed
            </p>
            <p className="console-line" style={{ color: tokens.info }}>
              ✓ build ready in 1.8s
            </p>
          </article>

          <article className="console-tool-card" style={{ borderColor: tokens.borderSubtle, background: tokens.backgroundPanel }}>
            <div className="console-tool-card-title" style={{ color: tokens.textMuted }}>
              # Read · with loaded paths
            </div>
            <p className="console-line" style={{ color: tokens.text }}>
              Read src/cli/cmd/tui/routes/session/index.tsx [offset=1580]
            </p>
            <div className="console-read-list">
              <div style={{ color: tokens.textMuted }}>↳ Loaded routes/session/index.tsx</div>
              <div style={{ color: tokens.textMuted }}>↳ Loaded session/message-v2.ts</div>
            </div>
          </article>

          <article className="console-tool-card" style={{ borderColor: tokens.borderSubtle, background: tokens.backgroundPanel }}>
            <div className="console-tool-card-title" style={{ color: tokens.textMuted }}>
              # Edit / ApplyPatch · diff renderers
            </div>
            <div className="console-diff-block" style={{ borderColor: tokens.borderSubtle }}>
              <div className="console-diff-row" style={{ color: tokens.diffHunkHeader }}>
                <span className="console-diff-num" style={{ color: tokens.diffLineNumber }}>
                  @@
                </span>
                <span className="console-diff-content">PreviewSurface.tsx</span>
              </div>
              <div className="console-diff-row" style={{ color: tokens.diffContext, background: tokens.diffContextBg }}>
                <span className="console-diff-num" style={{ color: tokens.diffLineNumber }}>
                  108
                </span>
                <span className="console-diff-content"> const PART_MAPPING = {'{'} ... {'}'}</span>
              </div>
              <div className="console-diff-row" style={{ color: tokens.diffRemoved, background: tokens.diffRemovedBg }}>
                <span className="console-diff-num" style={{ color: tokens.diffLineNumber, background: tokens.diffRemovedLineNumberBg }}>
                  129
                </span>
                <span className="console-diff-content">- tool: GenericTool</span>
              </div>
              <div className="console-diff-row" style={{ color: tokens.diffAdded, background: tokens.diffAddedBg }}>
                <span className="console-diff-num" style={{ color: tokens.diffLineNumber, background: tokens.diffAddedLineNumberBg }}>
                  129
                </span>
                <span className="console-diff-content">+ tool: FullOutputMatrixTool</span>
              </div>
              <div className="console-diff-inline" style={{ background: tokens.diffHighlightAdded, color: tokens.background }}>
                + include all output types
              </div>
              <div className="console-diff-inline" style={{ background: tokens.diffHighlightRemoved, color: tokens.background }}>
                - omit structured parts
              </div>
            </div>
          </article>

          <article className="console-tool-card" style={{ borderColor: tokens.borderSubtle, background: tokens.backgroundPanel }}>
            <div className="console-tool-card-title" style={{ color: tokens.textMuted }}>
              # Write · TodoWrite · Question
            </div>
            <div className="console-code-block" style={{ background: tokens.backgroundElement, borderColor: tokens.borderSubtle }}>
              <p className="console-code-line" style={{ color: tokens.syntaxKeyword }}>
                export function PreviewSurfaceMatrix() {'{'}
              </p>
              <p className="console-code-line" style={{ color: tokens.syntaxComment }}>
                // generated from source-traced output taxonomy
              </p>
              <p className="console-code-line" style={{ color: tokens.syntaxKeyword }}>
                {'}'}
              </p>
            </div>
            <div className="console-todo-list">
              {todoItems.map((item) => (
                <div key={item.content} className="console-todo-row">
                  <span
                    style={{
                      color: item.status === 'done' ? tokens.success : item.status === 'active' ? tokens.primary : tokens.textMuted,
                    }}
                  >
                    {item.status === 'done' ? '●' : item.status === 'active' ? '◐' : '○'}
                  </span>
                  <span style={{ color: item.status === 'pending' ? tokens.textMuted : tokens.text }}>{item.content}</span>
                </div>
              ))}
            </div>
            <div className="console-question-list">
              {questionAnswers.map((item) => (
                <div key={item.question} className="console-question-row">
                  <span style={{ color: tokens.textMuted }}>{item.question}</span>
                  <span style={{ color: tokens.text }}>{item.answer}</span>
                </div>
              ))}
            </div>
            <p className="console-line" style={{ color: tokens.error }}>
              Error [44:17] Unknown className in legacy preview markup
            </p>
          </article>

          <div className="console-stream-separator" style={{ borderColor: tokens.borderSubtle }} />

          <p className="console-line" style={{ color: tokens.textMuted }}>
            Schema part inventory (includes not-yet-mapped render parts):
          </p>
          <div className="console-part-grid">
            {structuredPartTypes.map((partType) => (
              <span key={partType} className="console-part-chip" style={{ borderColor: tokens.border, color: tokens.text }}>
                {partType}
              </span>
            ))}
          </div>
          <p className="console-line" style={{ color: tokens.warning }}>
            retry: APIError 429 rate_limited (attempt 2)
          </p>

          <div className="console-stream-separator" style={{ borderColor: tokens.borderSubtle }} />

          <article className="console-prompt-card" style={{ borderColor: tokens.warning, background: tokens.backgroundPanel }}>
            <div className="console-prompt-header" style={{ color: tokens.text }}>
              <span style={{ color: tokens.warning }}>△</span>
              <span>Permission required · Edit src/features/preview/PreviewSurface.tsx</span>
            </div>
            <div className="console-prompt-options">
              <span className="console-prompt-option" style={{ background: tokens.warning, color: tokens.background }}>
                Allow once
              </span>
              <span className="console-prompt-option" style={{ borderColor: tokens.border, color: tokens.textMuted }}>
                Allow always
              </span>
              <span className="console-prompt-option" style={{ borderColor: tokens.error, color: tokens.error }}>
                Reject
              </span>
            </div>
          </article>

          <article className="console-prompt-card" style={{ borderColor: tokens.accent, background: tokens.backgroundPanel }}>
            <div className="console-prompt-header" style={{ color: tokens.text }}>
              <span style={{ color: tokens.accent }}>?</span>
              <span>Question · output coverage confirmation</span>
            </div>
            <div className="console-question-option" style={{ background: tokens.accent, color: tokens.background }}>
              1. Include every renderer state (recommended)
            </div>
            <div className="console-question-option" style={{ color: tokens.textMuted }}>
              2. Only include text + diff
            </div>
            <div className="console-question-option" style={{ color: tokens.textMuted }}>
              3. Cancel
            </div>
          </article>

          <div className="console-message-error" style={{ borderColor: tokens.error, background: tokens.backgroundPanel }}>
            <span style={{ color: tokens.error }}>assistant error:</span>{' '}
            <span style={{ color: tokens.textMuted }}>ProviderAuthError · missing API key for selected model</span>
          </div>
            </div>
            <div className="console-transcript-scrollbar" aria-hidden="true">
              <span ref={transcriptThumbRef} className="console-transcript-scrollbar-thumb" />
            </div>
          </div>
        </section>

        <aside className="console-sidebar">
          <div ref={sidebarViewportRef} className="console-sidebar-viewport">
          <p className="console-sidebar-intro" style={{ color: tokens.text }}>
            3-column UI: Terminal full-height, right panel
          </p>

          <section className="console-sidebar-section">
            <div className="console-sidebar-heading" style={{ color: tokens.text }}>
              Context
            </div>
            <div className="console-sidebar-stat" style={{ color: tokens.textMuted }}>
              67,129 tokens
            </div>
            <div className="console-sidebar-stat" style={{ color: tokens.textMuted }}>
              25% used
            </div>
            <div className="console-sidebar-stat" style={{ color: tokens.textMuted }}>
              $0.00 spent
            </div>
          </section>

          <section className="console-sidebar-section">
            <div className="console-sidebar-heading" style={{ color: tokens.text }}>
              ▾ MCP
            </div>
            <div className="console-sidebar-list">
              {sidebarMcpItems.map((item) => (
                <div key={item} className="console-sidebar-list-row" style={{ color: tokens.textMuted }}>
                  <span className="console-sidebar-bullet" style={{ color: tokens.textMuted }}>
                    •
                  </span>
                  <span>{item}</span>
                  <span>Disabled</span>
                </div>
              ))}
            </div>
          </section>

          <section className="console-sidebar-section">
            <div className="console-sidebar-heading" style={{ color: tokens.text }}>
              ▾ LSP
            </div>
            <div className="console-sidebar-list">
              {sidebarLspItems.map((item) => (
                <div key={item} className="console-sidebar-list-row" style={{ color: tokens.textMuted }}>
                  <span className="console-sidebar-bullet" style={{ color: tokens.success }}>
                    •
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="console-sidebar-section">
            <div className="console-sidebar-heading" style={{ color: tokens.text }}>
              ▾ Todo
            </div>
            <div className="console-sidebar-todos">
              {sidebarTodoItems.map((item) => (
                <div key={item.content} className="console-sidebar-todo-row">
                  <span
                    className="console-sidebar-todo-state"
                    style={{
                      color: item.status === 'done' ? tokens.textMuted : item.status === 'active' ? tokens.warning : tokens.textMuted,
                    }}
                  >
                    {item.status === 'done' ? '[x]' : item.status === 'active' ? '[•]' : '[ ]'}
                  </span>
                  <span
                    className="console-sidebar-todo-copy"
                    style={{
                      color: item.status === 'active' ? tokens.warning : tokens.textMuted,
                    }}
                  >
                    {item.content}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <div className="console-sidebar-spacer" />

          <div className="console-sidebar-footer">
            <div className="console-sidebar-path" style={{ color: tokens.text }}>
              ~/opencode-theme-editor
            </div>
            <div className="console-sidebar-version" style={{ color: tokens.textMuted }}>
              <span style={{ color: tokens.success }}>•</span>
              <span style={{ color: tokens.text }}>OpenCode</span>
              <span>1.2.27</span>
            </div>
          </div>
          </div>
          <div className="console-sidebar-scrollbar" aria-hidden="true">
            <span ref={sidebarThumbRef} className="console-sidebar-scrollbar-thumb" />
          </div>
        </aside>

        <div
          className="console-composer"
          style={{
            background: tokens.backgroundElement,
            borderLeftColor: composerHighlight,
          }}
        >
          <div className="console-composer-line">
            <span className="console-composer-input-copy" style={{ color: tokens.text }}>
              User Prompt with
            </span>
            <span className="console-composer-attachment" style={{ background: tokens.warning, color: tokens.background }}>
              [Image 1]
            </span>
            <span className="console-composer-selected-fragment">
              <span className="console-composer-input-copy" style={{ color: tokens.text }}>
                selected
              </span>
              <span
                className="console-composer-selection-sample"
                style={{ background: tokens.text, color: tokens.backgroundElement }}
              >
                text
              </span>
              <span className="console-composer-input-copy" style={{ color: tokens.text }}>
                {' '}and curso
              </span>
              <span
                className="console-composer-selected-letter"
                style={{ background: tokens.text, color: tokens.backgroundElement }}
              >
                r
              </span>
            </span>
          </div>

          <div className="console-composer-meta-row">
            <span className="console-composer-build" style={{ color: composerHighlight }}>
              Build
            </span>
            <span className="console-composer-meta-item" style={{ color: tokens.text }}>
              GPT 5.4
            </span>
            <span className="console-composer-meta-item" style={{ color: tokens.textMuted }}>
              OpenAI
            </span>
            <span className="console-composer-divider" style={{ color: tokens.textMuted }}>
              ·
            </span>
            <span className="console-composer-variant" style={{ color: tokens.warning }}>
              xhigh
            </span>
          </div>
        </div>

        <div className="console-statusbar" style={{ color: tokens.textMuted }}>
          <div className="console-statusbar-left">
            <span className="console-thinking-indicator" aria-hidden="true">
              <span className="console-thinking-track">
                <span className="console-thinking-squares console-thinking-squares-ltr">
                  <span className="console-thinking-cell" />
                  <span className="console-thinking-cell" />
                  <span className="console-thinking-cell" />
                  <span className="console-thinking-cell" />
                  <span className="console-thinking-cell" />
                </span>
                <span className="console-thinking-squares console-thinking-squares-rtl">
                  <span className="console-thinking-cell" />
                  <span className="console-thinking-cell" />
                  <span className="console-thinking-cell" />
                  <span className="console-thinking-cell" />
                  <span className="console-thinking-cell" />
                </span>
              </span>
            </span>
            <span className="console-statusbar-label">
              <span style={{ color: tokens.text }}>esc</span>{' '}
              <span style={{ color: tokens.textMuted }}>interrupt</span>
            </span>
          </div>

          <div className="console-statusbar-right">
            <span>
              <span style={{ color: tokens.text }}>ctrl+t</span>{' '}
              <span style={{ color: tokens.textMuted }}>variants</span>
            </span>
            <span>
              <span style={{ color: tokens.text }}>tab</span>{' '}
              <span style={{ color: tokens.textMuted }}>agents</span>
            </span>
            <span>
              <span style={{ color: tokens.text }}>ctrl+p</span>{' '}
              <span style={{ color: tokens.textMuted }}>commands</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
