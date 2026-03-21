# OpenCode Theme Editor

<p align="center"><strong>Design a theme that actually feels like OpenCode before you export it.</strong></p>

<p align="center">
  OpenCode Theme Editor is a local-first theme studio for crafting dark and light OpenCode themes with live preview, curated presets, raw JSON control, shareable links, and one-command install.
</p>

<p align="center">
  <a href="https://kkugot.github.io/opencode-theme-editor/"><strong>Launch the app</strong></a>
  ·
  <a href="https://github.com/kkugot/opencode-theme-editor">GitHub</a>
  ·
  <a href="https://opencode.ai/docs/themes/#custom-themes">OpenCode theme docs</a>
</p>

## Why people use it

- See changes in an OpenCode-like preview while you edit, instead of guessing from JSON alone.
- Tune dark and light modes as a matched pair, then export a single bundle or separate mode files.
- Start fast with built-in OpenCode themes, curated palette presets, and remix controls.
- Move from semantic editing to token-level control to raw JSON without leaving the same workflow.
- Keep drafts in your browser with IndexedDB autosave; no account or backend required.
- Share an editable link or copy a ready-to-run install command for OpenCode.

## What you can do

| Stage | Best for |
| --- | --- |
| Presets | Start from OpenCode built-ins, curated palettes, or remixed color directions |
| Basic | Adjust semantic groups like canvas, text, accent, success, warning, and danger |
| Full | Fine-tune individual OpenCode tokens |
| JSON | Edit the exported theme shape directly with validation and live preview |
| Save | Download files, copy the install command, or share an editable link |

## Quick start

1. Open the app and name your theme.
2. Pick a preset or randomize a palette.
3. Refine colors in `Basic`, `Full`, or `JSON`.
4. Flip between dark and light to tune both modes.
5. Open `Save` to download files, copy a share link, or generate the OpenCode install command.

## Install in OpenCode

From the `Save` tab, copy the generated command and run it from your project root.

```bash
curl -fsSL https://kkugot.github.io/opencode-theme-editor/install.sh | bash -s -- <theme-name> <encoded-theme>
```

The installer:

- writes `.opencode/themes/<theme-name>.json`
- updates `.opencode/tui.json` to activate the theme for that project

You can also type `!` inside OpenCode, paste the generated command, and restart OpenCode once.

## Manual export

If you prefer file-based setup:

1. Download the bundle file or the separate dark and light JSON exports.
2. Save the bundle as `<theme-name>.json` in one of these locations:
   - `~/.config/opencode/themes/`
   - `<project-root>/.opencode/themes/`
3. In OpenCode, run `/theme` and choose `<theme-name>`.

Optional project default in `.opencode/tui.json`:

```json
{
  "$schema": "https://opencode.ai/tui.json",
  "theme": "<theme-name>"
}
```

## Share with a link

- The share link reopens the exact theme in the editor, including both dark and light modes.
- Shared URLs hydrate the editor before local draft restore, so collaborators land on the intended version immediately.

## Local development

```bash
npm install
npm run dev
```

Useful commands:

- `npm run test`
- `npm run lint`
- `npm run build`
- `npm run preview`

## Notes

- Drafts are stored locally in your browser via IndexedDB.
- Share-link and install-command generation require a browser with `CompressionStream` support.
