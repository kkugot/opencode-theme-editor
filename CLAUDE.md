# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

This repository is currently in a planning stage. There is no application source tree or package/tooling configuration yet; the main project context lives under `.planning/`.

Key planning files:
- `.planning/PROJECT.md` — product scope, constraints, and active requirements
- `.planning/research/ARCHITECTURE.md` — recommended architecture and build order
- `.planning/research/FEATURES.md` — MVP and feature prioritization
- `.planning/research/PITFALLS.md` — implementation risks to avoid
- `.planning/research/OPENCODE_UI_AND_THEMES.md` — upstream OpenCode TUI/theme findings and real theme format notes

## Development commands

The app now uses Vite + React + TypeScript.

- Install dependencies: `npm install`
- Run the dev server: `npm run dev`
- Build production assets: `npm run build`
- Lint: `npm run lint`

There is no test setup yet.

## Product architecture

The planned product is a local-first browser app for creating OpenCode themes with a visual workflow and high-fidelity preview.

The intended architecture is a static SPA with a strict one-way pipeline:
1. user edits canonical theme draft state
2. derivation logic resolves semantic groups into concrete theme tokens
3. validation computes soft guidance such as contrast warnings
4. preview-model mapping adapts resolved tokens to OpenCode-like UI surfaces
5. export serializes separate dark and light JSON theme files

Future code should preserve this separation: preview is a consumer of state, not the source of truth.

### Core layers

- `domain/`: framework-agnostic theme model, derivation rules, validation, and OpenCode export mapping
- `state/`: central client store, selectors, hydration, autosave orchestration
- `features/editor/`: semantic-first editing and later advanced token overrides
- `features/preview/`: OpenCode-like preview surfaces and states
- `persistence/`: browser storage boundaries for drafts and preferences
- `features/export/`: dark/light file export flow

If the eventual implementation differs, keep the same architectural intent: domain logic should remain independent from UI components.

## Critical modeling decisions

These decisions are central to the project and should not be casually changed:

- Treat the app as a deterministic token editor, not a freeform design canvas.
- Keep one canonical draft document; derive resolved tokens instead of storing multiple editable resolved forms.
- Model dark and light as related but separate mode documents. Generate a sibling mode initially, then allow independent overrides.
- Export separate dark and light JSON files. Combined dark/light artifacts are explicitly out of scope.
- Use browser-only persistence; local-first and static hosting are core constraints.
- Prefer IndexedDB for draft storage and reserve `localStorage` for small UI preferences.

## Preview and export boundaries

Preview fidelity is a product requirement, not polish. Future implementations should keep a single token pipeline from editor state to both preview and export.

Avoid these failure modes:
- separate preview and export mapping tables
- ad hoc colors inside preview components
- storing fully resolved tokens as primary editable state
- coupling editor shell theme with the draft’s current theme mode

The preview should cover more than the main output area. Planning documents expect coverage for surfaces like sidebar, prompt/input, assistant output, code blocks, diffs, warnings/errors, tool/status lines, menus, modals, and interaction states.

## Persistence expectations

Drafts should survive refreshes locally and eventually support:
- autosave of the current draft
- named drafts in browser storage
- versioned persisted documents with migrations

Do not default to storing full draft management in `localStorage`; planning explicitly calls that out as a pitfall.

## Workflow priorities

The intended build order from planning is:
1. theme domain model and export contract
2. derivation engine
3. central state store and selectors
4. basic preview renderer
5. semantic editor UI
6. advanced token layer
7. draft persistence
8. expanded preview surfaces
9. export and validation hardening
10. optional iframe/worker performance isolation

When making implementation choices, prefer work that preserves this dependency order.

## Important UX principles from planning

- semantic-first editing comes before raw token editing
- contrast checks are guidance, not hard blocking
- system/editor shell theme must stay separate from the theme being edited
- users should be able to trust that previewed output matches exported output

## Existing project conventions

The project currently uses GSD planning artifacts in `.planning/`. Before making major implementation decisions, read the planning docs first rather than inferring architecture from scratch.
