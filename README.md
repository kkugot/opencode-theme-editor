# OpenCode Theme Studio

<p align="center"><strong>Design a theme that actually feels like OpenCode before you export it.</strong></p>

<p align="center">
  OpenCode Theme Studio is a local-first theme studio for crafting dark and light OpenCode themes with live preview, curated presets, raw JSON control, shareable links, and one-command install.
</p>

<p align="center">
  <a href="https://kkugot.github.io/opencode-theme-studio/"><strong>Launch the app</strong></a>
</p>

<p align="center">
    <a href="./public/opencode-theme-studio-480-4x.mp4">Watch the OpenCode Theme Studio demo video</a>
</p>

## Why people use it

- See changes in an OpenCode-like preview while you edit, instead of guessing from JSON alone.
- Tune dark and light modes as a matched pair, then export a single bundle or separate mode files.
- Start fast with built-in OpenCode themes, curated palette presets, and remix controls.
- Move from semantic editing to token-level control to raw JSON without leaving the same workflow.
- Keep drafts in your browser with IndexedDB autosave; no account or backend required.
- Share an editable link, import a local OpenCode theme, or copy a ready-to-run install command.

## What you can do

| Stage | Best for |
| --- | --- |
| Presets | Start from OpenCode built-ins, curated palettes, or remixed color directions |
| Mixer | Generate color palettes, adjust basic semantic groups like canvas, text, accent, success, warning, and danger |
| Tuner | Fine-tune individual OpenCode tokens, there are plenty of them |
| Export | Download files, copy the install command, or share an editable link |
| JSON {…} | Import yur opencode theme, Edit the generated theme json directly with validation and live preview |


## Quick start

1. Open the app and name your theme.
2. Pick a preset or randomize a palette.
3. Refine colors manually or with thre levels of color shuffle. they all follow contrast ratio rules
4. Flip between dark and light to tune both modes.
5. Open `Save` to download files, copy a share link, or generate the OpenCode install command.
6. Open `{...}` to import an existing local OpenCode theme or edit the full bundle JSON directly.

## Install in OpenCode

From the `Save` tab, copy the generated command and run it from your project root.

```bash
curl -fsSL https://kkugot.github.io/opencode-theme-studio/import-export.sh | bash -s -- install <theme-name> <encoded-theme>
```

The installer:

- writes `.opencode/themes/<theme-name>.json`
- updates `.opencode/tui.json` to activate the theme for that project

You can also type `!` inside OpenCode, paste the generated command, and restart OpenCode once.

## Import from OpenCode

From the `{...}` tab, copy the import command and run it inside OpenCode.

```bash
curl -fsSL https://kkugot.github.io/opencode-theme-studio/import-export.sh | bash -s -- import <theme-studio-url>
```

The import flow:

- reads your current local OpenCode theme from `.opencode/themes/` or `~/.config/opencode/themes/`
- converts it into a Theme Studio share URL
- opens the browser with that theme already loaded in the editor

This is useful when you want to:

- build a matching light or dark companion for an existing theme
- refine a local custom theme without manually copying JSON
- share your local theme setup with someone else through a browser link

If you do not want to run the import-export script, you can also paste your current theme JSON directly into the `{...}` tab. Theme Studio accepts the full dark/light bundle there and keeps the JSON updated as you edit.

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
- Install and share commands use a compressed payload that contains the full dark + light theme bundle, not just the current mode.

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
- Share-link, install-command, and import/export payload generation use compressed theme data and require a browser with `CompressionStream` support.
