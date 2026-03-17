# Pitfalls Research

**Domain:** Browser-based local-first OpenCode theme editor
**Researched:** 2026-03-16
**Confidence:** MEDIUM

## Critical Pitfalls

### Pitfall 1: Preview drift from actual OpenCode rendering

**What goes wrong:**
The editor preview looks convincing but does not match how exported tokens appear in OpenCode. Users approve a theme in the browser, then discover different contrast, emphasis, surfaces, or state styling in the real product. This destroys trust in the editor quickly.

**Why it happens:**
Teams build a "theme demo" instead of an OpenCode-shaped rendering model. They approximate token usage, omit edge states, simplify component structure, or manually duplicate mappings between semantic groups, advanced tokens, preview surfaces, and export JSON.

**How to avoid:**
- Define one canonical token pipeline: semantic groups -> derived element tokens -> preview bindings -> export JSON.
- Treat preview fidelity as a product requirement, not polish. Build the preview from OpenCode-inspired structures and state inventory early.
- Maintain a coverage matrix for all preview surfaces: sidebar, prompt, output, code blocks, diffs, warnings/errors, tool/status lines, menus, modals, active/hover/selected states.
- Add snapshot fixtures for representative themes in both dark and light modes so mapping regressions are visible.
- If OpenCode token semantics are still uncertain, explicitly mark low-confidence mappings and keep them isolated behind a translation layer.

**Warning signs:**
- Preview colors are assigned ad hoc in components instead of coming from one token source.
- Export logic and preview logic each have their own mapping tables.
- Edge states are "to do later."
- A theme looks good in the editor only after manual CSS tweaks not reflected in export.
- New preview surfaces require guessing which token to use each time.

**Phase to address:**
Phase 1: token model and preview foundation. This must be solved before feature expansion.

---

### Pitfall 2: Weak or unstable semantic-to-advanced token derivation

**What goes wrong:**
The semantic layer feels fast initially, but generated advanced tokens are incoherent. Small palette edits create large visual swings, dark/light siblings diverge unpredictably, and user overrides are overwritten or become impossible to reason about.

**Why it happens:**
The product tries to hide complexity with simplistic derivation rules. Semantic groups are underspecified, dependency relationships are implicit, and there is no clear distinction between generated values and user-owned overrides.

**How to avoid:**
- Design an explicit derivation graph: which semantic groups generate which advanced tokens, in what order, with what fallback rules.
- Separate token provenance in state: generated, inherited-from-sibling, or manually overridden.
- Store override metadata, not just final color values.
- Make regeneration selective: changing one semantic group should only recompute dependent untouched tokens.
- Provide "reset to generated" per token and per section.
- Test derivation with multiple preset families, not only one happy-path theme.

**Warning signs:**
- Users cannot tell why a token changed.
- Editing a base color unexpectedly resets unrelated advanced customizations.
- Dark/light sibling generation works only for a narrow preset set.
- State only stores final flat token values with no origin information.

**Phase to address:**
Phase 1: editing model and data model. Phase 2 can expose advanced controls only after provenance is solid.

---

### Pitfall 3: Browser persistence built on fragile localStorage assumptions

**What goes wrong:**
Drafts disappear, fail to save, exceed storage limits, or break between versions. Users think the app is local-first, but browser storage behavior makes their work unreliable.

**Why it happens:**
Teams treat browser persistence as trivial and use localStorage as the whole persistence design. They ignore origin scoping, private browsing clearing, blocked persistence, string-only storage, schema versioning, and recovery paths.

**How to avoid:**
- Use IndexedDB for draft persistence; reserve localStorage only for tiny boot settings like UI theme preference.
- Version persisted documents and write migration functions from day one.
- Wrap persistence behind a repository layer that can surface save failures and recovery states.
- Add autosave status, last-saved timestamp, and save error messaging.
- Support export/import of drafts as a manual backup path.
- Test storage behavior under private browsing, blocked storage, quota pressure, and origin changes between localhost/dev/prod.

**Warning signs:**
- Drafts are serialized as one giant JSON blob in localStorage.
- There is no schema version on saved documents.
- Save failures are swallowed silently.
- The team assumes static hosting means storage behavior is uniform.
- QA only tests one browser profile with persistent storage enabled.

**Phase to address:**
Phase 1: persistence architecture. Do not postpone migrations and failure handling until after MVP.

---

### Pitfall 4: Export files are syntactically valid but semantically incompatible with OpenCode

**What goes wrong:**
The app exports JSON that looks correct yet fails in OpenCode, ignores certain fields, or produces surprising results because token names, shape, or mode handling do not align with the real consumer.

**Why it happens:**
Export is treated as a thin final step rather than a contract. Teams build the editor first, then bolt on whatever JSON shape seems plausible. They also keep preview token names too close to UI concepts rather than export concepts.

**How to avoid:**
- Define the export contract early and make internal token naming intentionally translatable rather than identical by accident.
- Create fixture-based export validation against known-good OpenCode theme examples as soon as reference material is available.
- Keep dark and light export pipelines separate, since combined artifacts are explicitly out of scope and considered unreliable.
- Add round-trip tests: preset -> edit -> export -> validate expected structure.
- Surface unsupported or unknown fields explicitly instead of silently dropping them.

**Warning signs:**
- Export logic appears only near release.
- There is no machine-readable validation step for produced JSON.
- Preview tokens are being renamed repeatedly to fit export late in development.
- Dark and light handling is coupled into one artifact despite project constraints.

**Phase to address:**
Phase 1: export contract research and schema boundary. Phase 3: final export hardening and compatibility verification.

---

### Pitfall 5: Contrast guidance becomes false confidence

**What goes wrong:**
The editor shows simple pass/fail contrast badges that imply accessibility is solved, while real readability remains poor in terminals, thin fonts, status colors, diffs, hover states, and low-emphasis text. Users ship themes that technically pass some checks but feel unusable.

**Why it happens:**
Contrast is reduced to a single ratio on a small subset of foreground/background pairs. Teams ignore missing-background cases, anti-aliasing effects, text size/weight differences, and the fact that contrast ratios do not fully predict readability.

**How to avoid:**
- Treat contrast as guidance, not certification.
- Evaluate a defined set of critical pairs per mode: primary text, muted text, code, prompt, warnings/errors, diffs, selection, focus, sidebar, menus, modals.
- Show actual ratio values and relevant thresholds; do not round borderline failures up.
- Warn when a pair is under-defined, for example text color specified without a stable background.
- Add visual checks for low-emphasis surfaces and tiny text, not just primary body text.
- Provide suggestions and warnings without blocking export, consistent with project scope.

**Warning signs:**
- Only one or two contrast pairs are checked.
- A green "accessible" badge appears without context.
- Low-emphasis text in preview is visibly hard to read even when the tool says pass.
- The system ignores hover, selected, diff, and alert states.

**Phase to address:**
Phase 2: accessibility guidance system, after core preview/token mapping exists but before release hardening.

---

### Pitfall 6: Light and dark sibling themes share too much state

**What goes wrong:**
Generating a sibling mode is fast at first, but later edits leak across modes. Users lose intentional divergence, cannot understand inheritance, or accidentally corrupt one mode while tuning the other.

**Why it happens:**
The implementation stores one blended theme object with mode flags instead of modeling two related but distinct documents. Sibling generation and ongoing synchronization get conflated.

**How to avoid:**
- Model dark and light as separate theme documents linked by shared provenance, not as one mutable merged blob.
- Generate the sibling once from a clear derivation routine, then track independent overrides per mode.
- Make inheritance explicit in the UI: synced/generated versus mode-specific override.
- Provide one-way regeneration tools instead of hidden continuous coupling.
- Test mode switching heavily to ensure edits in one mode do not rewrite the other unexpectedly.

**Warning signs:**
- Changing a dark token silently changes light mode too.
- The team cannot explain which fields are shared versus copied.
- Mode switching causes flicker, resets, or surprise recomputation.
- State structure relies on many conditional branches by mode.

**Phase to address:**
Phase 1: state model for multi-mode themes. This is foundational.

---

### Pitfall 7: System theme adaptation fights the user and causes flicker

**What goes wrong:**
The application follows system color scheme on load, but the editor shell flashes the wrong theme, stored user preference is applied late, or OS theme changes unexpectedly alter the working session and confuse users.

**Why it happens:**
Teams mix app-shell theming, preview theming, and edited theme mode into one concept. They rely on late hydration or asynchronous initialization instead of setting the shell theme deterministically at startup.

**How to avoid:**
- Keep three concepts separate: editor shell theme, current preview mode, and exported theme content.
- Apply shell theme immediately on load using a minimal synchronous boot path; user preference should override system preference.
- Listen for system preference changes only when the user has not explicitly pinned the shell theme.
- Never let shell theme changes mutate theme draft data.
- Test initial paint on static hosting where hydration timing can reveal flash-of-wrong-theme issues.

**Warning signs:**
- The UI flashes light before switching dark, or vice versa.
- Toggling preview mode also changes editor chrome unexpectedly.
- Theme preference is only applied after app initialization completes.
- Users confuse shell appearance with the actual theme being edited.

**Phase to address:**
Phase 1: app shell initialization and theming boundaries.

---

### Pitfall 8: Presets are generic palette starters instead of OpenCode-relevant baselines

**What goes wrong:**
Users start from pretty palettes that do not map well to terminal-like UI, assistant output, diffs, status lines, and low-emphasis surfaces. They spend too much time repairing structural issues, reducing the product's speed advantage.

**Why it happens:**
Teams source presets from generic design palettes or broad token kits rather than from OpenCode-inspired examples and realistic UI states.

**How to avoid:**
- Build presets from OpenCode-inspired or adjacent real theme patterns, not arbitrary color collections.
- Evaluate presets against the full preview matrix, especially muted text, alerts, and diffs.
- Curate a small set of strong starting points rather than a large shallow library.
- Store preset metadata about intended mood, contrast profile, and known tradeoffs.

**Warning signs:**
- Presets look good in a swatch grid but weak in the real preview.
- Users must immediately fix many advanced tokens after selecting a preset.
- Preset selection emphasizes quantity over confidence.

**Phase to address:**
Phase 2: preset system, after preview fidelity is good enough to judge them honestly.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Store drafts as one JSON blob in localStorage | Very fast MVP persistence | Fragile saves, no migrations, poor recovery, quota pain | Only for throwaway prototypes, not roadmap MVP |
| Let preview components pick colors directly from semantic groups | Faster first demo | Preview/export drift and inconsistent token coverage | Never acceptable |
| Recompute all advanced tokens on every edit | Easy implementation | Override loss, unpredictable UX, performance churn | Only in a short-lived derivation spike |
| Use one shared object for both dark and light modes | Less state code initially | Cross-mode corruption and confusing inheritance | Never acceptable |
| Add export mapping late | Keeps early demo focused on UI | Contract mismatch and expensive renames | Never acceptable |

## Integration Gotchas

Common mistakes when connecting to external services or external contracts.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| OpenCode theme format | Assuming JSON shape from preview model | Research and codify an explicit export contract with fixtures and validation |
| Browser storage | Assuming localStorage is durable and always available | Use IndexedDB for drafts, handle blocked storage/errors, version documents |
| System color scheme | Letting prefers-color-scheme drive all theme state | Limit it to editor shell defaults; keep draft mode state separate |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Full preview rerender on every color tweak | Slider/input lag, visible repaint churn | Token memoization, selective recomputation, lightweight preview sections | Breaks even at single-user scale on lower-end laptops |
| Recomputing every derived token for every edit | Janky editing and override bugs | Dependency-based derivation graph and dirty-node recompute | Breaks once preview/state complexity grows beyond a few dozen tokens |
| Saving whole draft on every keystroke with no throttling | Input lag and frequent storage writes | Debounced autosave plus explicit save state | Breaks early, especially in Safari/private contexts |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Rendering user-editable theme values into styles without sanitizing the allowed shape | CSS injection-like layout breakage or malformed preview state | Treat theme values as validated data, constrain fields to known tokens and color formats |
| Importing draft/theme JSON without validation | Corrupt local state, crashes, unusable drafts | Validate imported schema and isolate failed imports with recovery messaging |
| Assuming browser-only means no privacy concerns | Sensitive theme drafts or metadata may be exposed on shared machines | Make local-only behavior explicit and offer export/delete controls |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Mixing semantic editing and advanced token editing in one flat list | Users cannot form a mental model of cause and effect | Use a layered workflow: semantic first, advanced second |
| Showing contrast warnings without saying where they matter | Users ignore warnings or overcorrect | Tie warnings to specific preview surfaces and affected tokens |
| Hiding generated-versus-overridden status | Users fear touching controls because edits feel irreversible | Make token provenance explicit and add reset-to-generated actions |
| Treating shell UI theme as the same as edited theme mode | Users get confused about what is being changed | Separate shell appearance controls from theme content controls |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Preview:** Covers not only main output but also sidebar, menus, modals, diffs, alerts, status lines, and selected/hover/focus states.
- [ ] **Autosave:** Shows save status, handles failures, and survives refresh with versioned drafts.
- [ ] **Dark/Light workflow:** Supports sibling generation plus independent overrides without cross-mode leakage.
- [ ] **Contrast guidance:** Checks more than primary text/background and explains limitations.
- [ ] **Export:** Produces separate dark and light files and validates expected structure.

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Preview/export drift | HIGH | Freeze new UI work, create token mapping inventory, unify preview and export through one translation layer, rebuild fixtures |
| Broken persistence schema | HIGH | Introduce document versioning, add migration pipeline, create backup export, write one-time repair/import tool for affected drafts |
| Cross-mode state corruption | HIGH | Split mode documents, migrate shared blob into separate dark/light objects, preserve manual overrides where provenance can be inferred |
| Over-aggressive derivation overwriting user edits | MEDIUM | Add override metadata, stop global regeneration, provide reset-to-generated and repair affected presets |
| Misleading contrast guidance | MEDIUM | Expand critical pair checks, downgrade language from pass/fail certification to guidance, retest presets |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Preview drift from actual OpenCode rendering | Phase 1 | Preview/export mapping comes from one source of truth and covers all major surfaces |
| Weak semantic-to-advanced derivation | Phase 1 | Token provenance is stored and selective regeneration preserves overrides |
| Fragile browser persistence | Phase 1 | IndexedDB-backed drafts survive refresh, versioned migrations run, save failures are visible |
| Export incompatibility with OpenCode | Phase 1 research, Phase 3 hardening | Export fixtures validate expected JSON shape for dark and light separately |
| Contrast guidance false confidence | Phase 2 | Critical surface matrix is checked and warnings are contextual rather than absolute |
| Dark/light cross-mode leakage | Phase 1 | Editing one mode does not mutate the other except through explicit regeneration actions |
| System theme flicker/confusion | Phase 1 | Shell theme initializes before paint and remains independent from draft mode state |
| Generic weak presets | Phase 2 | Presets are vetted against the full preview matrix and require minimal immediate repair |

## Sources

- MDN Web Docs: localStorage caveats and browser behavior — https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
- MDN Web Docs: IndexedDB API, transactions, and versioned upgrades — https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
- W3C WAI WCAG 2.2 Understanding SC 1.4.3 Contrast (Minimum) — https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- MDN Web Docs: prefers-color-scheme behavior and runtime changes — https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme
- Project context in /Users/kostiantynkugot/.planning/PROJECT.md

---
*Pitfalls research for: Browser-based local-first OpenCode theme editor*
*Researched: 2026-03-16*