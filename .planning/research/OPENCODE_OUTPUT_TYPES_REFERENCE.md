# OpenCode Output Types Reference

## Purpose

Use this note as a quick memory aid when updating preview fidelity in this repo.
It records what the upstream OpenCode TUI currently renders, what exists in schema,
and what is mirrored in `src/features/preview/PreviewSurface.tsx`.

## Upstream Sources Reviewed

- `/Users/kostiantynkugot/opencode-upstream/packages/opencode/src/cli/cmd/tui/routes/session/index.tsx`
- `/Users/kostiantynkugot/opencode-upstream/packages/opencode/src/session/message-v2.ts`
- `/Users/kostiantynkugot/opencode-upstream/packages/opencode/src/cli/cmd/tui/routes/session/permission.tsx`
- `/Users/kostiantynkugot/opencode-upstream/packages/opencode/src/cli/cmd/tui/routes/session/question.tsx`
- `/Users/kostiantynkugot/opencode-upstream/packages/opencode/src/cli/cmd/tui/util/transcript.ts`

## Message Part Taxonomy (Schema)

From `MessageV2.Part` union in `message-v2.ts`, upstream part types are:

- `text`
- `reasoning`
- `tool`
- `file`
- `compaction`
- `agent`
- `subtask`
- `retry`
- `step-start`
- `step-finish`
- `snapshot`
- `patch`

## What Session TUI Explicitly Renders Today

From `routes/session/index.tsx`:

- User path:
  - `text` (user prompt text)
  - `file` (attachment chips)
  - `compaction` (separator marker)
- Assistant path:
  - `text` (markdown/code rendering)
  - `reasoning` (thinking block)
  - `tool` (tool-specific renderer switch)
- Assistant footer/meta:
  - agent marker, model id, duration, interruption state
- Assistant error block:
  - shown when message error is present and not aborted silently

`PART_MAPPING` in upstream session TUI currently maps only:

- `text`
- `tool`
- `reasoning`

Other schema part types are still important for compatibility and future display work,
so they are represented in this repo's preview matrix under "Structured Part Inventory".

## Tool Output Renderers in Upstream Session TUI

From the `ToolPart` switch in `routes/session/index.tsx`:

- `bash` (inline pending/running and block output)
- `glob` (inline)
- `read` (inline + loaded file metadata lines)
- `grep` (inline)
- `list` (inline)
- `webfetch` (inline)
- `codesearch` (inline)
- `websearch` (inline)
- `write` (block with code and diagnostics)
- `edit` (block diff view + diagnostics)
- `task` (inline delegated subagent status)
- `apply_patch` (block per file with diff/delete summary)
- `todowrite` (block todo list)
- `question` (block question and answer summary)
- `skill` (inline)
- fallback `GenericTool` (inline by default, optional block output)

Tool states that affect rendering:

- `pending`
- `running`
- `completed`
- `error`

## Prompt/Overlay Surfaces Upstream

Outside normal transcript rows, session experience also includes:

- Permission prompt surface (`permission.tsx`)
- Question prompt surface (`question.tsx`)
- Dialog/select style overlays (`ui/dialog-*`)

These are included in this repo preview as "Interactive Prompt Surfaces" so token
coverage includes warning/accent/error decision states.

## Coverage Implemented in This Repo

Updated preview matrix is in:

- `src/features/preview/PreviewSurface.tsx`

Supporting styles are in:

- `src/styles/index.css`

The matrix includes:

- Message part examples (user + assistant)
- Inline tool output examples
- Block tool output examples
- Markdown and syntax token samples
- Diff token samples (all diff-related fields)
- Structured part inventory
- Permission/question/error prompt surfaces

## Maintenance Checklist

When OpenCode updates:

1. Re-check `PART_MAPPING` in upstream `routes/session/index.tsx`.
2. Re-check the `ToolPart` switch for new/removed tool renderers.
3. Re-check `MessageV2.Part` union for schema changes.
4. Update this reference file first, then update preview examples.
5. Run `npm run lint` and `npm run build` in this repo.
