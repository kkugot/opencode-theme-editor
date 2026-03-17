# Architecture Research

**Domain:** Browser-based local-first theme editor with live preview
**Researched:** 2026-03-16
**Confidence:** MEDIUM

## Standard Architecture

### System Overview

A browser-based local-first theme editor is typically structured as a single static web app with five clear layers:
1. editor UI components for semantic and advanced token editing,
2. a central theme state engine that derives preview-ready tokens,
3. a preview surface that renders a sandboxed app-like mock of the target product,
4. persistence/export services for drafts and JSON output,
5. lightweight background utilities for expensive derivation or analysis.

For this project, the right architecture is not a generic design-tool canvas architecture. It should be a form-driven token editor around a deterministic theme model. The preview should be downstream from state, never the source of truth. That keeps the app explainable, exportable, and trustworthy.

```
┌──────────────────────────────────────────────────────────────────────┐
│                           Presentation Layer                        │
├──────────────────────────────────────────────────────────────────────┤
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────────────┐ │
│  │ Preset Picker  │  │ Theme Controls │  │ Draft/Export Controls  │ │
│  └───────┬────────┘  └───────┬────────┘  └───────────┬────────────┘ │
│          │                   │                        │              │
│  ┌───────▼───────────────────▼────────────────────────▼────────────┐ │
│  │                    Editor Shell / App Layout                    │ │
│  └───────────────────────────────┬─────────────────────────────────┘ │
├──────────────────────────────────┴───────────────────────────────────┤
│                         Application Layer                            │
├──────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ Theme State Store                                              │  │
│  │ - semantic groups                                              │  │
│  │ - advanced token overrides                                     │  │
│  │ - dark/light sibling themes                                    │  │
│  │ - selected surface/state                                       │  │
│  └───────────────┬──────────────────────┬──────────────────────────┘  │
│                  │                      │                             │
│      ┌───────────▼───────────┐  ┌──────▼────────────────┐            │
│      │ Theme Derivation      │  │ Validation/Guidance   │            │
│      │ Engine                │  │ Engine                │            │
│      └───────────┬───────────┘  └──────┬────────────────┘            │
│                  │                      │                             │
│      ┌───────────▼──────────────────────▼───────────┐                │
│      │ Preview View Model Builder                    │                │
│      └───────────┬──────────────────────────────────┘                │
├──────────────────┴───────────────────────────────────────────────────┤
│                           Preview Layer                              │
├──────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ Sandboxed Preview Surface                                      │  │
│  │ - shell chrome                                                 │  │
│  │ - sidebar/output/terminal states                               │  │
│  │ - menus/modals/alternate surfaces                              │  │
│  └────────────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────────────┤
│                    Persistence and Utility Layer                     │
├──────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────────┐ │
│  │ Draft Store  │  │ Exporter     │  │ Worker Utilities           │ │
│  │ IndexedDB    │  │ JSON mapper  │  │ contrast/derivation opt.   │ │
│  └──────────────┘  └──────────────┘  └────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Editor Shell | Owns top-level layout, pane sizing, mode switching, selected draft, selected preview tab/state | SPA shell with routed or tabbed layout |
| Preset Picker | Applies built-in presets or generated starting palettes into canonical state | Form UI backed by store actions |
| Theme Controls | Edits semantic groups first, then advanced token overrides for each mode | Controlled forms grouped by semantic section and advanced token section |
| Theme State Store | Single source of truth for draft, modes, overrides, preview settings, dirty state | Client store with selectors and pure mutations |
| Theme Derivation Engine | Converts semantic groups into derived token values and sibling mode defaults | Pure functions, deterministic mapping layer |
| Validation/Guidance Engine | Produces soft contrast warnings and quality hints without blocking edits | Pure analysis functions, optionally worker-backed |
| Preview View Model Builder | Maps canonical theme state into preview component props/styles/tokens | Adapter layer between theme model and preview UI |
| Preview Surface | Renders OpenCode-like screens from preview model; never owns business state | Sandboxed iframe or isolated preview subtree |
| Draft Store | Saves autosave snapshot and named drafts locally | IndexedDB preferred; localStorage only for tiny preferences |
| Exporter | Produces separate dark and light OpenCode-compatible JSON files | Pure serializer + download trigger |
| Worker Utilities | Offloads expensive color calculations or validation if UI becomes sluggish | Dedicated Web Worker using postMessage |

## Recommended Project Structure

```
src/
├── app/                     # App shell, routes, providers, top-level layout
│   ├── App.tsx              # Root composition
│   ├── providers/           # Store/provider wiring
│   └── layout/              # Split pane, tabs, shell UI
├── features/
│   ├── presets/             # Built-in theme presets and preset UI
│   ├── editor/              # Semantic and advanced editing panels
│   ├── preview/             # Preview screens, states, tabs, mock OpenCode surfaces
│   ├── drafts/              # Autosave, named drafts, recovery UI
│   └── export/              # Export actions and status
├── domain/
│   ├── theme/               # Core theme schema, defaults, token definitions
│   ├── derivation/          # Semantic-to-token derivation rules
│   ├── validation/          # Contrast checks and guidance rules
│   └── opencode/            # OpenCode-specific JSON mapping/output model
├── state/
│   ├── theme-store.ts       # Central store and actions
│   ├── selectors.ts         # Memoized state selectors
│   └── persistence.ts       # Hydration/autosave coordination
├── persistence/
│   ├── drafts-db.ts         # IndexedDB wrapper and schema
│   └── preferences.ts       # Small UI prefs in localStorage
├── workers/
│   └── analysis.worker.ts   # Optional background analysis/derivation
├── shared/
│   ├── ui/                  # Reusable controls not tied to theme domain
│   ├── utils/               # Generic utilities
│   └── types/               # Cross-cutting types
└── styles/                  # App-level styling and design tokens
```

### Structure Rationale

- **features/** keeps user-facing workflows isolated: presets, editing, preview, drafts, export.
- **domain/** holds the business logic that must stay framework-agnostic and testable. This is the most important separation in this product.
- **state/** centralizes orchestration, but should not absorb derivation logic itself.
- **persistence/** isolates browser storage details so future sync or import/export changes do not leak across the app.
- **workers/** stays optional and small; do not start with worker-heavy architecture unless profiling shows it is needed.

## Architectural Patterns

### Pattern 1: Canonical Theme Document + Derived View State

**What:** Keep one canonical theme document containing presets, semantic groups, explicit advanced overrides, and per-mode settings. Everything else, especially preview tokens, is derived from it.
**When to use:** Always. This is the core pattern for local-first theme editors.
**Trade-offs:** Extremely testable and export-friendly, but requires discipline to avoid storing duplicate derived values everywhere.

**Example:**
```typescript
interface ThemeDraft {
  id: string
  name: string
  activeMode: 'dark' | 'light'
  modes: {
    dark: ThemeModeDraft
    light: ThemeModeDraft
  }
}

interface ThemeModeDraft {
  semanticGroups: Record<string, string>
  tokenOverrides: Partial<Record<string, string>>
}

function buildResolvedMode(mode: ThemeModeDraft) {
  const derived = deriveTokensFromSemanticGroups(mode.semanticGroups)
  return { ...derived, ...mode.tokenOverrides }
}
```

### Pattern 2: One-Way Preview Pipeline

**What:** Flow data one direction: editor input -> canonical store -> derivation/validation -> preview model -> preview renderer.
**When to use:** For any live preview where trust matters more than ad hoc manipulation.
**Trade-offs:** Less flashy than direct-on-canvas editing, but much easier to reason about and keeps export behavior aligned with preview behavior.

**Example:**
```typescript
const draft = useThemeDraft()
const resolvedDark = useMemo(() => resolveMode(draft.modes.dark), [draft.modes.dark])
const warnings = useMemo(() => analyzeContrast(resolvedDark), [resolvedDark])
const previewModel = useMemo(() => buildPreviewModel(resolvedDark), [resolvedDark])
```

### Pattern 3: Sandboxed Preview Boundary

**What:** Treat the preview as an isolated renderer, ideally in a sandboxed iframe if script/style isolation becomes important.
**When to use:** Use immediately if the preview has heavy styling independence or executes preview-side scripts. A simple isolated subtree is acceptable early if preview complexity is still low.
**Trade-offs:** iframe isolation prevents style bleed and increases trust, but adds message passing and some debugging friction.

**Example:**
```typescript
previewFrame.contentWindow?.postMessage(
  { type: 'preview:update', payload: previewModel },
  window.location.origin,
)
```

Use strict origin checks and avoid broad `"*"` messaging. If using iframe sandboxing, keep permissions minimal and communicate through `postMessage`.

## Data Flow

### Request Flow

The typical flow for this class of app is deterministic and local:

```
[User edits color control]
    ↓
[Editor Control]
    ↓ dispatch
[Theme Store Action]
    ↓
[Canonical Theme Draft Updated]
    ↓
[Derivation Engine resolves semantic groups → element tokens]
    ↓
[Validation Engine computes warnings]
    ↓
[Preview Model Builder maps tokens to OpenCode-like surfaces]
    ↓
[Preview Renderer updates visible UI]
    ↓
[Autosave Scheduler writes snapshot to IndexedDB]
```

### State Management

```
[Theme State Store]
    ↓ select canonical draft
[Selectors]
    ↓
[Derived Resolved Theme + Warnings + Preview Model]
    ↓
[Editor Panels]   [Preview Surface]   [Export Actions]   [Draft Manager]
        ↑                ↑                    ↑                ↑
        └──────────── actions / events ───────┴────────────────┘
```

### Key Data Flows

1. **Preset application flow:** Preset Picker -> store action -> canonical semantic groups and defaults -> sibling dark/light mode generation -> derived tokens -> preview refresh.
2. **Semantic editing flow:** Semantic control change -> update mode semantic group -> recompute derived tokens -> preserve explicit advanced overrides -> rerender preview.
3. **Advanced override flow:** Token override change -> write explicit token override only -> merge over derived token set -> rerender preview.
4. **Mode coordination flow:** Base mode initialization -> sibling mode generator creates coordinated starting theme -> later edits branch independently per mode except when user intentionally syncs/regenerates.
5. **Draft persistence flow:** Store dirty flag -> debounced autosave -> IndexedDB snapshot write -> draft list metadata update -> recovery on reload.
6. **Export flow:** Selected draft mode -> resolve final tokens -> map to OpenCode JSON schema -> download dark.json or light.json.
7. **Preview tab/state flow:** UI selects sidebar/output/modal/menu surface -> only preview state changes, not theme document -> preview rebinds same tokens across alternate surfaces.

## Suggested Build Order

This project should be built inside-out, not screen-first.

1. **Theme domain model and JSON contract**
   - Define canonical draft shape, mode model, semantic groups, advanced token keys, and export schema.
   - Without this, the editor and preview will drift.

2. **Derivation engine**
   - Implement semantic-to-token rules and dark/light sibling generation.
   - This is the dependency for meaningful preview and export.

3. **Central state store + selectors**
   - Wire canonical state, mutations, memoized resolved modes, dirty state, active draft, preview tab.
   - All UI depends on this contract.

4. **Basic preview renderer**
   - Build a small but representative preview showing the most trusted surfaces first: shell, sidebar, prompt/input, output, code block, warning/error.
   - Verify that state and derivation produce believable visual output before building broad editing UI.

5. **Semantic editor UI**
   - Add the fast path users will use most.
   - This validates that the derivation model is ergonomic.

6. **Advanced token layer**
   - Add per-token override controls only after semantic editing works.
   - Otherwise the team may accidentally design around raw tokens instead of the intended two-layer model.

7. **Draft persistence**
   - Add autosave, hydration, named drafts, and recovery using IndexedDB.
   - Persistence is critical, but should follow once the draft schema is stable enough.

8. **Full preview surface expansion**
   - Add menus, modals, alternate tabs, more states, diffs, tool/status lines.
   - These are important for trust, but not required before the core theme loop works.

9. **Export and validation guidance**
   - Add finalized JSON export and contrast guidance once resolved tokens are stable.
   - These are downstream consumers of the same core model.

10. **Optional isolation/performance hardening**
   - Move preview into sandboxed iframe if not done earlier.
   - Add worker-backed analysis if derivation/validation impacts responsiveness.

### Build Order Dependencies

```
Theme schema
  → Derivation engine
    → State store/selectors
      → Basic preview
        → Semantic editor
          → Advanced editor
            → Draft persistence
            → Export
            → Validation guidance
              → Preview expansion
                → Isolation/performance hardening
```

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k users | Single static SPA, in-memory store, IndexedDB drafts, preview in main thread is fine |
| 1k-100k users | Still static-hosted; focus on bundle size, hydration speed, IndexedDB migration safety, and preview render efficiency |
| 100k+ users | Add better telemetry and compatibility testing; only consider splitting preview runtime or workerizing analysis if real profiling shows UI lag |

### Scaling Priorities

1. **First bottleneck:** preview rerender cost from over-broad state subscriptions. Fix with memoized selectors and narrow preview props.
2. **Second bottleneck:** persistence/schema churn. Fix with explicit draft versioning and migration functions for IndexedDB records.

## Anti-Patterns

### Anti-Pattern 1: Preview as the Source of Truth

**What people do:** Let preview components own token state and export from whatever the preview currently rendered.
**Why it's wrong:** Preview fidelity and export fidelity diverge quickly, especially with dark/light coordination and advanced overrides.
**Do this instead:** Keep a canonical theme document in the store and make preview a pure consumer.

### Anti-Pattern 2: Storing Fully Resolved Tokens Everywhere

**What people do:** Persist semantic groups, generated tokens, preview tokens, and export payloads all as editable state.
**Why it's wrong:** This creates multiple conflicting representations and makes regeneration impossible to reason about.
**Do this instead:** Persist semantic input plus explicit overrides; derive resolved tokens on demand.

### Anti-Pattern 3: Using localStorage for Full Draft Management

**What people do:** Save large draft payloads and draft lists entirely in localStorage because it is easy.
**Why it's wrong:** localStorage is string-only, synchronous, and brittle for larger structured draft workflows.
**Do this instead:** Use IndexedDB for draft documents; reserve localStorage for tiny UI preferences such as panel state or theme preference.

### Anti-Pattern 4: Unsandboxed or Over-Privileged Preview iframe

**What people do:** Grant broad iframe permissions or use loose `postMessage` targets for convenience.
**Why it's wrong:** It weakens isolation and makes future preview scripting harder to secure.
**Do this instead:** Start with minimal sandbox permissions and exact origin checks for preview communication.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Browser IndexedDB | Local draft repository via wrapper module | Best fit for structured local-first persistence in a static app |
| Browser localStorage | Tiny preference storage only | Good for active theme preference, selected panel, dismissed hints |
| Browser matchMedia / prefers-color-scheme | Read system theme and react to changes | Useful for editor chrome only, not as the theme-document source |
| Browser Worker API | Optional off-main-thread analysis | Add only when profiling justifies it |
| Browser iframe/postMessage | Preview isolation boundary | Requires exact targetOrigin and origin validation |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Editor UI ↔ Theme Store | Actions/selectors | UI should never compute business derivations inline |
| Theme Store ↔ Derivation Engine | Pure function calls | Keep deterministic and unit-testable |
| Theme Store ↔ Persistence | Repository API | Debounced autosave and explicit hydrate/restore flow |
| Preview Model Builder ↔ Preview Surface | Typed props or message payload | Preview should consume a stable view model, not raw entire app state |
| Exporter ↔ OpenCode Mapper | Pure function call | Export should reuse resolved tokens, not recompute separately with different rules |

## Recommendation

For OpenCode Theme Editor, the best architecture is a static SPA with a strict domain core:
- canonical theme draft in a central client store,
- pure derivation and validation services,
- a downstream preview model builder,
- a mostly isolated preview renderer,
- IndexedDB-backed drafts,
- export as a pure serialization step.

The crucial architectural decision is to model this as a token-editing system with deterministic preview, not as a freeform visual design tool. That choice directly supports local-first behavior, export reliability, and roadmap clarity.

## Sources

- Project context: `/Users/kostiantynkugot/.planning/PROJECT.md`
- MDN Web Docs, IndexedDB API: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
- MDN Web Docs, Window.localStorage: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
- MDN Web Docs, Web Workers API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API
- MDN Web Docs, Window.postMessage: https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage
- MDN Web Docs, `<iframe>` element reference: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe
- MDN Web Docs, `prefers-color-scheme`: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme

---
*Architecture research for: Browser-based local-first theme editor with live preview*
*Researched: 2026-03-16*
