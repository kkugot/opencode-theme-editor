# OpenCode UI and Theme Findings

## Sources reviewed

- Official docs: `https://opencode.ai/docs/themes/`
- Upstream schema: `/Users/kostiantynkugot/opencode-upstream/packages/console/app/public/theme.json`
- Built-in examples:
  - `/Users/kostiantynkugot/opencode-upstream/packages/opencode/src/cli/cmd/tui/context/theme/opencode.json`
  - `/Users/kostiantynkugot/opencode-upstream/packages/opencode/src/cli/cmd/tui/context/theme/github.json`
- TUI-related paths:
  - `/Users/kostiantynkugot/opencode-upstream/packages/opencode/src/cli/cmd/tui/routes/session/index.tsx`
  - `/Users/kostiantynkugot/opencode-upstream/packages/opencode/src/cli/cmd/tui/routes/session/sidebar.tsx`
  - `/Users/kostiantynkugot/opencode-upstream/packages/opencode/src/cli/cmd/tui/routes/session/header.tsx`
  - `/Users/kostiantynkugot/opencode-upstream/packages/opencode/src/cli/cmd/tui/ui/dialog.tsx`
  - `/Users/kostiantynkugot/opencode-upstream/packages/opencode/src/cli/cmd/tui/ui/dialog-select.tsx`
  - `/Users/kostiantynkugot/opencode-upstream/packages/opencode/src/cli/cmd/tui/ui/toast.tsx`

## Key product implications

The project should not use a generic app-preview metaphor. OpenCode is terminal/TUI-first, and the editor preview should center on a console-style workspace with:

- session/sidebar rail
- session header/top bar
- conversation/message stream
- prompt/composer area
- tool/status line
- diff rendering
- dialog/menu/modal-like overlays later

The preview should feel like an OpenCode terminal client, not a card dashboard.

## Official theme file format

Top-level structure:

```json
{
  "$schema": "https://opencode.ai/theme.json",
  "defs": {},
  "theme": {}
}
```

Notes:

- `$schema` should be `https://opencode.ai/theme.json`
- `defs` is optional and supports reusable named color values
- `theme` holds the actual theme fields

Supported color value forms:

- hex color: `"#ffffff"`
- ANSI color index: `3`
- terminal default passthrough: `"none"`
- `defs` reference: `"nord8"`
- mode-aware object:

```json
{ "dark": "#000000", "light": "#ffffff" }
```

## Confirmed theme fields

Required by schema:

- `primary`
- `secondary`
- `accent`
- `text`
- `textMuted`
- `background`

Documented/available fields:

- `primary`
- `secondary`
- `accent`
- `error`
- `warning`
- `success`
- `info`
- `text`
- `textMuted`
- `background`
- `backgroundPanel`
- `backgroundElement`
- `border`
- `borderActive`
- `borderSubtle`
- `diffAdded`
- `diffRemoved`
- `diffContext`
- `diffHunkHeader`
- `diffHighlightAdded`
- `diffHighlightRemoved`
- `diffAddedBg`
- `diffRemovedBg`
- `diffContextBg`
- `diffLineNumber`
- `diffAddedLineNumberBg`
- `diffRemovedLineNumberBg`
- `markdownText`
- `markdownHeading`
- `markdownLink`
- `markdownLinkText`
- `markdownCode`
- `markdownBlockQuote`
- `markdownEmph`
- `markdownStrong`
- `markdownHorizontalRule`
- `markdownListItem`
- `markdownListEnumeration`
- `markdownImage`
- `markdownImageText`
- `markdownCodeBlock`
- `syntaxComment`
- `syntaxKeyword`
- `syntaxFunction`
- `syntaxVariable`
- `syntaxString`
- `syntaxNumber`
- `syntaxType`
- `syntaxOperator`
- `syntaxPunctuation`

## Important implementation guidance

- Export should match the real OpenCode shape: `{ "$schema": "https://opencode.ai/theme.json", "theme": { ... } }`
- Internal token naming should stay aligned with official field names where practical
- The preview should consume the same resolved token set used for export
- `defs` support is part of the real format, but can remain a later enhancement if internal editing stays hex-first initially
- Dark/light values can be represented in one file in the official format, but this project still intentionally exports separate dark and light files unless product direction changes

## Example theme style patterns from built-ins

Observed in built-in themes:

- reusable palettes declared in `defs`
- `theme` entries often point to `defs` names instead of repeating hex values
- dark/light pairs are commonly provided per field
- diff, markdown, and syntax colors are first-class parts of the theme contract, not optional polish

## What this means for this project

Near-term implementation should prioritize:

1. OpenCode-like TUI preview fidelity
2. official field-name alignment in domain/export code
3. diff/markdown/syntax preview coverage
4. later: `defs` authoring support and richer preview overlays
