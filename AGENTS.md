# AGENTS.md

## Purpose
- Guidance for coding agents working in `opencode-theme-editor`.
- Read this file first.
- Treat this repo as an implemented Vite + React + TypeScript SPA (not planning-only).
- Planning artifacts were removed for release cleanup; use `README.md` and the source tree as the canonical project context.

## Rule Files Inventory
- `CLAUDE.md` guidance is merged into this file.
- No Cursor rules found in `.cursor/rules/`.
- No `.cursorrules` file found.
- No Copilot rules file found at `.github/copilot-instructions.md`.
- If any of these appear later, merge their rules into this file.

## Read First For Non-Trivial Changes
- `README.md`
- Relevant files in `src/domain/`, `src/state/`, `src/features/`, and `src/persistence/`

## Project Snapshot
- App type: static, local-first SPA with browser-only persistence.
- Stack: React 19, TypeScript strict mode, Vite 7, ESLint 9.
- Product goal: OpenCode theme editing with high-fidelity preview and JSON export.

## Core Architecture Rules
- Preserve one-way flow: draft state -> derive tokens -> validate -> preview model -> export.
- Keep `src/domain/` framework-agnostic; avoid UI logic in domain functions.
- Keep one canonical draft model; do not make preview state source-of-truth.
- Dark and light are sibling documents with independent overrides.
- Support bundle export alongside separate dark and light JSON files.
- Preview and export must consume the same resolved token pipeline.
- Use IndexedDB for draft persistence, not `localStorage`.
- Treat the product as a deterministic token editor, not a freeform design canvas.
- Keep the app shell/system theme separate from the draft theme being edited.

## Preview Fidelity Boundaries
- Do not split preview and export token mapping into separate logic paths.
- Do not hardcode ad hoc preview colors that bypass resolved token output.
- Keep preview as a consumer of resolved model state, not a source-of-truth.
- Maintain broad OpenCode surface coverage (terminal body, sidebar, prompt/composer, tool output, diffs, code blocks, warnings/errors, status/meta surfaces).

## Implementation Order Priorities
- Prefer this dependency order for large work:
  1. domain model and export contract
  2. derivation engine
  3. central state and selectors
  4. preview renderer and model mapping
  5. semantic editor UX
  6. advanced token editing
  7. draft persistence and migration boundaries
  8. preview coverage expansion and export hardening

## Source Tree Map
- `src/domain/`: theme model, derivation, validation, export mapping.
- `src/state/`: store, hooks, selectors, hydration, autosave orchestration.
- `src/features/editor/`: semantic editing and advanced token overrides.
- `src/features/preview/`: OpenCode-like preview surfaces.
- `src/features/export/`: export UI and download helpers.
- `src/persistence/`: IndexedDB access and persisted draft schema.
- `src/styles/index.css`: global shell and preview styling.

## Build, Lint, and Test Commands
- Install dependencies: `npm install`
- Start dev server: `npm run dev`
- Run full lint: `npm run lint`
- Build production bundle: `npm run build`
- Preview production build locally: `npm run preview`
- Targeted lint (single file): `npx eslint src/path/to/file.tsx`
- Targeted type check: `npx tsc -b`
- Test suite command: `npm run test`
- Single test command: `npx vitest run src/path/to/file.test.ts`

## CI, Deployment, and Release
- CI: `.github/workflows/ci.yml` runs lint + test + build on PRs and pushes to `main`.
- Pages deploy: `.github/workflows/deploy-pages.yml` publishes `dist/` on `main` and manual runs.
- Release: `.github/workflows/release.yml` runs on `v*` tags and creates GitHub Releases.
- Pages base path is auto-resolved (`/` for `<owner>.github.io`, `/<repo>/` otherwise).
- Optional override via repository variable `PAGES_BASE_PATH`.

## Versioning
- Source-of-truth version is `package.json`.
- Use semver bump scripts:
  - `npm run version:patch`
  - `npm run version:minor`
  - `npm run version:major`
- These create local `v*` tags; push commit + tags to trigger release workflow.
- Always bump `package.json` version before creating a new release tag or release PR.

## Agent Workflow Expectations
- Read relevant code before changing conventions.
- Prefer small, local changes that preserve architecture boundaries.
- Do not reimplement token mapping logic separately for preview-only behavior.
- Avoid touching unrelated files in the same change.
- Never replace IndexedDB persistence with `localStorage` for draft data.
- Keep semantic-first editing ahead of raw token editing.

## Import Conventions
- Use ES modules only.
- Keep external imports before internal imports.
- Group local imports by proximity and feature/domain boundaries.
- Use `import type` for type-only imports from local modules.
- If importing values and types from one module, inline type specifiers when clearer.
- Prefer named exports; default exports are generally avoided in `src/`.

## Formatting Conventions
- Use 2-space indentation.
- Use single quotes.
- Omit semicolons.
- Keep trailing commas in multiline objects, arrays, params, and JSX props.
- Prefer readable multiline expressions over dense one-liners.
- Keep functions/components focused and close to the data they derive.
- Match surrounding style; do not reformat unrelated code.

## TypeScript Conventions
- Follow strict compiler settings in `tsconfig.app.json`.
- Remove unused locals/params (`noUnusedLocals`, `noUnusedParameters` are enabled).
- Avoid `any`; use unions, records, discriminated unions, and helper narrowing.
- Prefer `type` aliases over `interface` unless extension is clearly beneficial.
- Keep shared domain types in model/domain files.
- Use string literal unions for finite states and modes.
- Prefer pure helper functions for deterministic derivation logic.
- Use `satisfies` for structured literals that must match known shapes.

## Naming Conventions
- Components: PascalCase filenames and exports.
- Hooks: `use*` prefix.
- Utilities/selectors/functions: camelCase.
- Type aliases: PascalCase.
- App-level constants: UPPER_SNAKE_CASE.
- String discriminants/actions: descriptive kebab-case literals.

## React and State Patterns
- Use function components and named exports.
- Keep state updates immutable.
- Use selectors/store actions instead of duplicating derived state.
- Use `useMemo` for expensive/repeated derivations when appropriate.
- In async effects, use `void promise` and handle success/failure paths.
- Throw explicit errors for missing providers and impossible states.
- Keep preview components as model consumers, not derivation owners.

## Error Handling and Logging
- Fail fast on programmer errors and invariant violations.
- Convert user-facing async failures into explicit UI state when possible.
- Use clear, actionable error messages.
- Guard parsing/validation boundaries with safe fallbacks.
- Avoid silent failure unless graceful degradation is intentional.
- Do not commit noisy debug logs.

## CSS and UI Conventions
- Keep shell styling centralized in `src/styles/index.css`.
- Reuse CSS variables for palette, spacing, radius, and elevation.
- Keep editor shell quieter than preview surfaces.
- Avoid generic dashboard aesthetics; preserve the product's theme-studio feel.
- Prefer spacing/elevation/tonal contrast over heavy borders.
- Use inline style only when values come directly from resolved theme tokens.
- Preserve desktop and mobile responsiveness.

## Persistence Conventions
- Draft persistence lives in `src/persistence/drafts-db.ts`.
- Persisted documents must be versioned and migration-ready.
- Close IndexedDB connections when transactions complete.
- Keep persistence boundaries separate from domain business logic.

## Before Finishing Any Change
- Run `npm run lint`.
- Run `npm run build`.
- If architecture-sensitive logic changed, verify preview/export still share one pipeline.
- Update this file when workflow, tooling, or conventions change.

## Known Gaps
- No dedicated browser E2E test coverage yet.
- No dedicated formatter is configured; preserve existing style manually.
