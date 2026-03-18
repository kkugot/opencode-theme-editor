# OpenCode Theme Editor

## [OPEN THE APP: https://kkugot.github.io/opencode-theme-editor/](https://kkugot.github.io/opencode-theme-editor/)

OpenCode Theme Editor is a local-first web app for creating, previewing, and exporting custom OpenCode themes.

## What this app does

- Lets you build OpenCode color themes visually and edit raw JSON when needed.
- Previews theme changes live in an OpenCode-style terminal surface.
- Exports ready-to-use theme files in OpenCode JSON format.

## What it supports

- **Dark and light mode editing** as sibling theme documents.
- **Basic editor** for semantic groups (canvas, panel, text, accent, success, warning, danger).
- **Full editor** for direct token-level overrides.
- **Advanced editor** for editing OpenCode theme JSON directly with live validation.
- **Autosave in browser IndexedDB** (drafts stay local to your browser).
- **Export options** for `dark`, `light`, and `combined` JSON files.

## How to use the app

1. Open the app and set your theme name.
2. Use **Basic**, **Full**, or **Advanced** tabs to adjust colors.
3. Switch between dark and light in the preview to tune both modes.
4. Use **Download** and export your theme (recommended: **Combined** file).

## Add a generated theme to OpenCode

1. Export your theme from this app.
2. Save the JSON file as `<theme-name>.json` in one of these locations:
   - User-wide: `~/.config/opencode/themes/`
   - Project-specific: `<project-root>/.opencode/themes/`
3. In OpenCode, select it with `/theme` and choose `<theme-name>`.
4. Optional: set it as default in `tui.json`:

```json
{
  "$schema": "https://opencode.ai/tui.json",
  "theme": "<theme-name>"
}
```

For full theme format and hierarchy details, see the official docs:

- https://opencode.ai/docs/themes/#custom-themes

## Project links

- App: https://kkugot.github.io/opencode-theme-editor/
- GitHub: https://github.com/kkugot/opencode-theme-editor

## Local development

```bash
npm install
npm run dev
```

Additional commands:

- `npm run lint`
- `npm run build`
- `npm run preview`
