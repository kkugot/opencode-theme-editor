# Feature Research

**Domain:** Browser-based theme editor for OpenCode themes
**Researched:** 2026-03-16
**Confidence:** MEDIUM

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Live preview while editing | Theme editors are judged on immediate visual feedback; without preview the product feels like a JSON form, not an editor | MEDIUM | For OpenCode this must preview terminal/chat surfaces, not just a color swatch grid. High trust feature. |
| Presets / starter themes | Users rarely want to begin from a blank canvas; most theme tools offer a starting point | LOW | Best version is OpenCode-inspired presets, not a giant generic palette library. |
| Color editing controls | Core job-to-be-done is changing colors without hand-editing files | LOW | Needs basic color picker plus direct text/hex entry for precision. |
| Import and export of theme files | Users expect to take an existing theme in and get a usable theme out | MEDIUM | Import can be limited to OpenCode-compatible JSON in later v1.x if needed, but export is launch-critical. |
| Dark and light mode support | Modern theme tools are expected to support both modes, especially when target product supports multiple schemes | MEDIUM | OpenCode project context already calls for sibling dark/light generation and independent overrides. |
| Autosave and draft persistence | Browser-based creative tools are expected to survive refreshes and accidental navigation | LOW | Local storage/browser persistence is enough for v1 and aligned with project constraints. |
| Semantic grouping of colors | Users expect higher-level editing before token-by-token tuning; modern theme tools increasingly organize around roles/semantics | MEDIUM | This is especially important to avoid overwhelming users with raw token lists. |
| Basic validation and error prevention | Users expect exports to be structurally valid and warnings to be understandable | MEDIUM | At minimum: required token presence, valid color formats, export-safe schema checks. |
| Contrast guidance | Accessibility feedback is increasingly expected in professional theme tools, even if not hard-blocking | MEDIUM | Soft warnings fit the project brief better than strict blocking. |
| Reset/undo-friendly editing | Theme experimentation is iterative; users expect safe exploration | MEDIUM | Full history stack is optional, but at least per-section reset and preset reapply are table stakes for a pleasant workflow. |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Close-to-real OpenCode UI preview | Makes the product feel purpose-built and increases trust that exported themes will look right in actual OpenCode usage | HIGH | This is the clearest product differentiator versus generic code/terminal theme builders. |
| Semantic-first editing with advanced derived token layer | Gives beginners speed and experts control in one workflow | HIGH | Strong fit for project core value: coherent defaults first, precise tuning second. |
| Automatic dark/light sibling generation from seed colors | Reduces initial work dramatically and helps users ship both modes quickly | HIGH | Especially valuable because many theme tools treat dark/light as separate full-design exercises. |
| Surface-specific preview tabs for menus, modals, diffs, warnings, and tool states | Exposes edge cases most theme editors hide until after export | HIGH | Helps prevent “looks good in main view, broken elsewhere” failures. |
| Non-blocking contrast guidance mapped to OpenCode surfaces | Makes accessibility practical without turning the editor into a compliance gate | MEDIUM | More useful than generic WCAG math if warnings reference actual preview surfaces/tokens. |
| Built-in OpenCode-inspired presets instead of generic palettes | Reduces mismatch between editor output and real OpenCode expectations | MEDIUM | Better onboarding than broad theme galleries for this niche tool. |
| Coordinated override model for shared + mode-specific values | Lets users keep paired dark/light themes coherent while still diverging where needed | HIGH | Strong usability win over editing two totally separate themes. |
| Export confidence features | Schema-aware export, filename suggestions, and mode-separated output reduce user fear at the final step | LOW | Not flashy, but a strong trust differentiator in a niche utility. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Real-time multiplayer collaboration | Sounds modern and “Figma-like” | Requires backend, auth, conflict resolution, and presence UI; directly conflicts with local-first static-site scope | Keep v1 single-user local-only with export/share via files |
| Account system and cloud sync | Users may ask for cross-device drafts | Adds major infrastructure and privacy surface before core editing workflow is validated | Start with browser draft persistence; revisit only after usage proves the need |
| Raw JSON-first editor as primary workflow | Power users often ask for direct file editing | Turns the product into a thin text editor, weakens guided value proposition, and increases invalid-state handling | Offer guided semantic/token editor first; add optional raw JSON view later if demand exists |
| Huge marketplace/community theme gallery | Feels like a discovery feature and growth loop | Requires moderation, hosting, metadata/search, and distracts from core editor trust problem | Ship a curated built-in preset set grounded in OpenCode-inspired themes |
| One-click import from every external theme ecosystem | Seems convenient for onboarding | Cross-ecosystem mappings are lossy and create false expectations about fidelity | Support OpenCode-compatible import/export only, with clear scope boundaries |
| Single combined dark/light export artifact | Feels simpler for users | Project context already flags combined OpenCode theme artifacts as unreliable | Export two explicit files: dark JSON and light JSON |

## Feature Dependencies

```text
OpenCode-compatible theme model
    ├──requires──> Export of separate dark/light JSON files
    ├──requires──> Preview token mapping
    └──requires──> Validation and schema checks

Built-in presets
    └──enhances──> Fast onboarding
                          └──enables──> Semantic color editing
                                              └──enables──> Derived advanced token editing
                                                                  └──drives──> High-fidelity preview

Seed color / semantic editing
    └──enables──> Automatic dark/light sibling generation
                          └──enables──> Mode-specific overrides

Preview token mapping
    └──enables──> Contrast guidance by surface/state

Autosave + named drafts
    └──supports──> Iterative experimentation
                          └──benefits from──> Reset / undo-friendly editing

Raw JSON-first editing ──conflicts──> Guided semantic-first workflow
Cloud sync / collaboration ──conflicts──> Local-first static deployment
Combined dark/light export ──conflicts──> Reliable separate-mode export
```

### Dependency Notes

- **Preview depends on a defined OpenCode theme model:** without a stable token map from editor values to preview surfaces, the preview cannot be trusted.
- **Advanced token editing should follow semantic editing:** exposing low-level tokens before semantic groups makes onboarding worse and creates noisy, incoherent themes.
- **Automatic dark/light generation depends on semantic or seed-color inputs:** generating a sibling mode from arbitrary disconnected token edits is much less reliable.
- **Contrast guidance depends on preview surfaces and token mapping:** warnings are more actionable when tied to actual UI states rather than abstract color pairs.
- **Reliable export depends on schema validation:** invalid export breaks trust faster than almost any missing convenience feature.
- **Guided workflow conflicts with raw JSON-first UX:** both can coexist later, but the product should clearly prioritize guided editing in v1.

## MVP Definition

### Launch With (v1)

Minimum viable product — what is needed to validate the concept.

- [ ] Built-in OpenCode-inspired presets — fastest path to first useful result
- [ ] Semantic color group editing — core guided workflow and easiest way to shape themes coherently
- [ ] Live OpenCode-like preview across major surfaces — main trust mechanism for the product
- [ ] Automatic paired dark/light theme generation with independent overrides — central product promise
- [ ] Soft contrast guidance — helps users avoid unusable themes without blocking creativity
- [ ] Browser autosave plus named local drafts — necessary for a browser-based creative workflow
- [ ] Export separate dark and light OpenCode JSON files — essential completion step

### Add After Validation (v1.x)

Features to add once the core is working.

- [ ] Advanced token-level editing layer — add once semantic model and preview mapping are stable
- [ ] Import existing OpenCode theme JSON — valuable once export schema confidence is established
- [ ] Reset history / undo stack — add after core editing interactions are proven
- [ ] Additional preview tabs for rarer surfaces and states — expand based on user feedback about missing fidelity

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] Optional raw JSON editing view — only if power users repeatedly hit guided editor limits
- [ ] Shareable theme URLs or downloadable preview bundles — only if there is real demand for review workflows
- [ ] Cloud sync / accounts — only after local-first usage validates cross-device need
- [ ] Community preset gallery — only after there is enough adoption to justify curation and moderation

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Live OpenCode-like preview | HIGH | HIGH | P1 |
| Built-in presets | HIGH | LOW | P1 |
| Semantic color group editing | HIGH | MEDIUM | P1 |
| Separate dark/light export | HIGH | MEDIUM | P1 |
| Autosave + named drafts | HIGH | LOW | P1 |
| Soft contrast guidance | MEDIUM | MEDIUM | P1 |
| Automatic dark/light sibling generation | HIGH | HIGH | P1 |
| Advanced token editor | HIGH | HIGH | P2 |
| Import existing OpenCode themes | MEDIUM | MEDIUM | P2 |
| Undo/history stack | MEDIUM | MEDIUM | P2 |
| Raw JSON editing view | MEDIUM | MEDIUM | P3 |
| Cloud sync/accounts | LOW | HIGH | P3 |
| Community gallery | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | Generic browser theme builders | Adjacent design-token/theme tools | Our Approach |
|---------|-------------------------------|-----------------------------------|--------------|
| Live preview | Usually present, but often generic or partial | Usually component-centric preview | Make preview specifically mimic OpenCode surfaces and states |
| Presets | Common | Common | Use a smaller, curated OpenCode-inspired set |
| Token editing | Often flat color lists | Often semantic tokens plus component overrides | Use semantic-first editing with optional advanced token refinement |
| Accessibility help | Inconsistent; often absent or generic | More likely in mature design systems | Provide non-blocking guidance tied to actual OpenCode surfaces |
| Export | Usually present | Usually present | Export two reliable OpenCode-compatible files, one per mode |
| Multi-mode theming | Often handled as separate themes | Often handled through token systems | Generate sibling dark/light themes, then allow mode-specific divergence |

## Sources

- Project context: `/Users/kostiantynkugot/.planning/PROJECT.md`
- Template: `/Users/kostiantynkugot/.claude/get-shit-done/templates/research-project/FEATURES.md`
- [VS Code Themes](https://vscodethemes.com/) — used as a discovery/gallery reference; confirms gallery/discovery is distinct from editing
- [Theme Studio](https://themes.vscode.one/) — confirms browser-based VS Code theme creation exists, but publicly fetched page content exposed limited feature detail; LOW confidence for specifics
- [Theme creator](https://theme-creator.vercel.app/) — adjacent browser-based theme creator showing live preview plus export patterns in theming tools; MEDIUM confidence for analogy
- [terminal.sexy](https://terminal.sexy/) — relevant terminal theme editor reference, but fetched content exposed only title; LOW confidence

## Bottom-Line Recommendation

For an OpenCode theme editor, table stakes are not just “pick colors and export JSON.” Users will expect presets, live preview, reliable export, draft persistence, and enough structure to avoid token chaos. The real competitive edge is a trustworthy OpenCode-specific workflow: semantic-first editing, generated dark/light siblings, surface-complete preview coverage, and practical contrast guidance.

That means v1 should optimize for trust and speed, not breadth. Build the shortest path from preset to coherent dual-mode theme to reliable export, and deliberately avoid platform features that turn the app into a generic collaborative design tool.

---
*Feature research for: browser-based OpenCode theme editor*
*Researched: 2026-03-16*