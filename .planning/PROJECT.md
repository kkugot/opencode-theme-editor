# OpenCode Theme Editor

## What This Is

A local-first browser application for designing OpenCode themes with a visual editing workflow and a close-to-real preview experience. It helps OpenCode users start from built-in theme-inspired palettes, tune semantic color groups, fine-tune individual OpenCode-style elements, and export separate dark and light JSON theme files.

## Core Value

Users can quickly create visually coherent, usable OpenCode dark and light themes and trust what they see in the editor preview will translate into exported theme files.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] User can start from built-in OpenCode-inspired theme presets and generated starting colors
- [ ] User can edit semantic color groups first, then refine pre-calculated element-level theme tokens in an advanced layer
- [ ] User can see a live, close-to-real OpenCode preview with sidebar, output, terminal states, and alternate UI surfaces like menus and modals
- [ ] User can create coordinated dark and light theme siblings from initial colors, then override each mode independently
- [ ] User can receive soft contrast guidance for dark and light themes without being blocked from continuing
- [ ] User can autosave the current draft and manage named drafts in browser storage
- [ ] User can export one dark JSON file and one light JSON file in OpenCode-compatible format

### Out of Scope

- Cloud sync or backend persistence — v1 is local-only
- Server-side collaboration or account features — unnecessary for a single-user browser editor
- Advanced raw JSON editing UI in the first release — can follow after the guided editor proves useful
- Combined dark/light export as a single unreliable OpenCode theme artifact — separate exports are preferred

## Context

The app should feel purpose-built for OpenCode theme creation rather than like a generic design tool. The interface should present a terminal-like preview area that resembles OpenCode, paired with flatter editing controls in a side panel. The browser should default to the system color scheme on load, and the editor UI should adapt with it.

The initial editing model should balance speed and control: semantic groups establish the baseline palette and derive shades/highlights, while a second layer exposes more specific OpenCode-like tokens prepopulated from those derived values so users can fine-tune details. The preview should cover the broader OpenCode experience, including sidebar/navigation, prompt/input, assistant output, code blocks, diffs, warnings/errors, tool/status lines, active states, and additional tabs for menus and modals.

Built-in presets should likely begin from existing or OpenCode-inspired themes rather than an arbitrary palette library. Export should produce separate dark and light files because OpenCode support for combined light/dark themes is not considered reliable enough for this workflow. Draft persistence should live in browser storage and store dark/light theme JSON data for the current draft and named drafts.

External research into the OpenCode theme skill reference, documentation, and source code is still needed, but the product scope should be defined first.

## Constraints

- **Platform**: Browser-based local app — should work without a backend
- **Persistence**: Browser storage only — drafts must survive refreshes locally
- **Compatibility**: Export separate dark and light OpenCode JSON themes — combined export is intentionally avoided
- **Preview fidelity**: Close to actual OpenCode structure — preview accuracy is central to trust
- **Accessibility**: Provide contrast guidance for both modes — warn rather than block
- **Deployment**: Should be publishable as a static site such as GitHub Pages — keep architecture static-friendly

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use semantic color groups plus a second advanced token layer | Fast initial shaping with room for precise tuning | — Pending |
| Generate a sibling theme for the opposite mode, then allow overrides | Users get both dark and light quickly without losing control | — Pending |
| Start with built-in OpenCode-inspired presets | Keeps v1 focused and grounded in real theme expectations | — Pending |
| Export separate dark and light JSON files | Combined light/dark OpenCode themes are not reliable enough | — Pending |
| Keep the app local-first with browser storage only | Simpler v1 and compatible with static hosting | — Pending |

---
*Last updated: 2026-03-16 after initialization*
