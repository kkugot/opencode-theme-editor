# Editorial Minimal Art Direction

## Direction

This redesign should follow **Option 1 — Editorial Minimal**.

The goal is to transform the current interface from a competent developer tool into a **premium, restrained, purpose-built studio** for OpenCode theme design. The product should feel less like a dashboard and more like a **high-end color grading instrument for terminal themes**.

This direction must stay aligned with project requirements:
- preview remains the hero and must feel close to real OpenCode structure
- editor controls remain flatter and quieter than the preview
- preview and export must continue to communicate trust through a shared token pipeline
- the interface should feel purpose-built for OpenCode rather than generic design tooling

## Core Creative Thesis

The visual language should be:
- editorial
- restrained
- confident
- dark and tactile
- highly legible
- premium without decorative excess

This is **quiet luxury**, not flashy futurism.

The experience should feel:
- precise instead of busy
- cinematic instead of boxy
- calm instead of noisy
- intentional instead of uniformly styled

## Design Keywords

Use these words to guide decisions:
- ink
- graphite
- porcelain
- editorial
- satin
- quiet luxury
- precision tooling
- cinematic spacing
- restrained contrast
- studio instrument

Avoid these qualities:
- generic SaaS UI
- bright neon accents
- overuse of borders
- loud gradients
- glossy futuristic gimmicks
- visual clutter
- equal emphasis on every panel

## Product Feel

The app should feel like:
- a **theme studio**
- a **live preview gallery**
- a **professional design instrument**

It should not feel like:
- an admin panel
- a form-heavy dashboard
- a generic settings app
- a default component library demo

## Strategic Visual Shift

The current layout has good structure, but too many elements share the same border language, spacing rhythm, and visual weight.

The redesign should introduce a much clearer hierarchy:

1. **Preview stage** is the hero
2. **Editor rail** is quieter and more recessed
3. **Export/status** is supportive and low-noise

That single hierarchy decision should drive every styling choice.

---

# Art Direction Principles

## 1. Strong Hero Surface

The preview must become the visual focal point of the product.

It should feel:
- larger
- more elevated
- more luminous than the editor rail
- closer to a live artifact than a boxed card

The preview should not look like a screenshot dropped into a dashboard. It should feel like the product’s central stage.

## 2. Fewer Borders, More Tonal Separation

The current interface relies too heavily on visible outlines.

The redesign should replace many of those with:
- tonal surface contrast
- subtle elevation
- inner highlights
- hairline separators only where necessary

Visible strokes should be used sparingly and intentionally.

## 3. Editorial Typography

Typography should carry much more of the premium feel.

Use:
- very small uppercase metadata labels with generous tracking
- large confident titles
- muted supporting copy with calm spacing
- fewer bold weights overall

The interface should feel composed, not loud.

## 4. Cinematic Spacing

Whitespace should do more work.

Increase:
- separation between major sections
- breathing room around titles
- padding inside panels
- vertical rhythm between list groups

A premium product often feels expensive because it is not trying to fill every inch.

## 5. Restrained Accent Usage

Accent color should be rare and valuable.

Neutrals should carry the product. Accent should be reserved for:
- active mode
- focused interaction states
- selective guidance cues
- very small emphasis moments

Color should feel expensive because it is controlled.

---

# Layout Direction

## Recommended Composition

Use a **studio layout** built around a dominant preview stage.

### Layout zones

- **Left rail**: identity, mode switching, editing controls
- **Center/main stage**: live OpenCode preview
- **Lower utility zone**: export and subtle status actions

### Composition goals

- preview occupies the emotional center of the product
- editor rail reads as a quiet control strip
- export reads as a finishing tray, not another card competing for attention

## Relative Emphasis

### Left rail
Should feel:
- recessed
- controlled
- matte
- secondary

### Preview stage
Should feel:
- lifted
- showcased
- visually calm
- primary

### Export zone
Should feel:
- precise
- elegant
- present but unobtrusive

## Width Strategy

If implemented responsively, prioritize:
- narrower left control rail than today
- larger preview area than today
- stronger preview dominance on desktop

The app should visually communicate that users are shaping a live artifact, not merely filling settings.

---

# Surface System

Limit the design to a disciplined four-level surface system.

## Surface 1 — Canvas
Application background.

Characteristics:
- nearly black
- slightly cool or slightly warm, but not flat neutral black
- visually deep and quiet

Suggested tone:
- `#07090d`
- or `#0a0c10`

## Surface 2 — Recessed Panel
Used for the editor rail and quieter utility containers.

Characteristics:
- low-contrast against canvas
- matte
- understated
- not obviously outlined

Suggested appearance:
- `#0e1117`
- or translucent dark with very soft separation

## Surface 3 — Elevated Hero Surface
Used for the preview shell and key showcase containers.

Characteristics:
- slightly lighter than recessed panel
- satin rather than glossy
- subtle shadowing
- top-edge highlight or inner light for refinement

Suggested tone:
- `#131722`

## Surface 4 — Porcelain Active Surface
Used for selected chips, mode toggle active segment, and selected export file card.

Characteristics:
- soft light material
- almost white but not bright white
- should feel tactile and premium

Suggested tone:
- `#f2f3f7`

This surface should be used sparingly so it remains special.

---

# Color Direction

## Shell Palette

The app shell should rely mostly on refined neutrals.

### Suggested foundation
- background: `#07090d`
- recessed panel: `#0e1117`
- elevated panel: `#131722`
- hairline: `rgba(255,255,255,0.08)`
- primary text: `#f3f5f7`
- secondary text: `#a7afbf`
- tertiary text: `#6f7786`

## Accent Recommendation

Choose a single restrained shell accent.

Recommended first option for Editorial Minimal:
- **icy blue**: `#8fb4ff`

Alternative accents if needed later:
- silver lavender: `#b2a7ff`
- mineral teal: `#7dd6c4`

The accent should not dominate the shell. It should appear in minimal, intentional moments.

## Functional Colors

Success, warning, and danger remain necessary for the OpenCode-like preview and semantic tokens, but they should remain function-led.

They should not leak into the shell UI unnecessarily.

---

# Typography Direction

## Tone

Typography should do much more of the visual branding work.

It should feel:
- deliberate
- calm
- confident
- slightly editorial
- highly readable

## Hierarchy

### Metadata / eyebrow labels
Use for:
- section labels
- minor status labels
- system descriptors

Style:
- 11–12px
- uppercase
- increased tracking
- low contrast

### Section headings
Use for:
- group labels
- editor sections
- utility areas

Style:
- 13–14px
- medium weight
- understated

### Hero page title
Use for:
- current theme name

Style:
- 48–64px depending on layout
- strong but not over-bold
- tight tracking
- large visual pause around it

### Key mode/selection text
Use for:
- selected mode labels
- prominent export labels

Style:
- 24–30px equivalent visual presence if needed
- strong but restrained

## Typographic Rules

- avoid bolding too many things
- do not let supporting text compete with headings
- use spacing to create emphasis, not only weight
- keep mono text for token values and filenames only where helpful

---

# Shape Language

## Corner System

Adopt a disciplined radius system.

Suggested radii:
- app shell / major outer containers: `30–32px`
- major panels: `24px`
- controls and segmented tracks: `18–20px`
- pills: `999px`

The key is consistency. Premium UIs often feel expensive because their geometry is controlled.

## Object Feel

Everything should feel either:
- recessed
- floating
- or porcelain-active

Avoid shapes that feel like generic component-library defaults.

---

# Spacing System

Increase whitespace significantly compared to the current mock.

## Suggested rhythm

- major section gaps: `32–48px`
- panel padding: `24–32px`
- row heights for semantic token items: `64–72px`
- title block bottom spacing: `28–36px`
- small control gaps: `8–12px`
- related content gaps: `16–20px`

## Spacing Principles

- let the title breathe
- let the preview breathe
- compress utility metadata before compressing hero surfaces
- avoid stacking many equally spaced containers in a way that reads mechanical

---

# Section-by-Section Redesign Spec

## 1. Identity and Intro Block

### Current issue
The top-left cluster feels horizontally crowded and too uniform in weight.

### Redesign goal
Create a more editorial intro stack that establishes confidence and product identity immediately.

### Recommended structure
- small app label
- short descriptor line
- large theme title
- compact metadata beneath

### Example content hierarchy
- `OPENCODE THEME EDITOR`
- `Local-first visual theme studio`
- `Starter Theme`
- `Nocturne / Paper`
- `50 tokens`

### Styling notes
- avoid squeezing metadata on one line unless it truly improves clarity
- prefer vertical rhythm over dense horizontal packing
- the title should be the left rail’s primary focus

---

## 2. Mode Switcher

### Current issue
The current mode segmented control is functional but ordinary.

### Redesign goal
Make mode selection feel tactile and premium, like choosing materials.

### Direction
Use a larger, softer segmented container with:
- inset track
- low-contrast base
- porcelain active segment
- title and subtitle inside each mode option

### Desired feel
Dark and Light should feel like selecting distinct atmospheres, not just toggling tabs.

### Styling notes
- inactive segment should remain elegant and readable
- active segment should feel lifted but soft
- do not over-outline the track

---

## 3. Basic / Advanced Control

### Current issue
This switch currently competes too much with primary controls.

### Redesign goal
Demote it visually.

### Direction
Make it:
- smaller
- flatter
- quieter
- more clearly secondary

### Recommendation
Treat it more like a lightweight text segmented control than a large pill toggle.

It should sit near the relevant section heading rather than demanding major attention.

---

## 4. Semantic Group Section

### Current issue
The token list becomes repetitive and visually dense.

### Redesign goal
Make editing rows feel refined, calm, and premium.

### Structure
Each row should contain:
- token name on the left
- refined color swatch in the center or right-center
- token value in subdued mono on the right

### Row behavior
- clear hover state
- soft reveal of edit affordances
- nearly invisible separators
- strong alignment discipline

### Swatch styling
Swatches should not look like generic colored squares.

They should feel like premium material samples:
- rounded tile or capsule
- subtle border highlight
- slight inset or soft depth
- careful sizing and spacing

### Section behavior
- stronger grouping of semantic sections
- sticky section label if scrolling
- larger gaps between groups
- avoid flat endless rows

---

## 5. Preview Header

### Current issue
The preview title area is acceptable, but still reads as standard product UI.

### Redesign goal
Make the preview area feel like a hero stage.

### Direction
Use:
- small eyebrow label such as `LIVE PREVIEW`
- larger confident title such as `Dark mode`
- restrained note aligned opposite if needed

### Tone
Less explanation, more confidence.

The preview should prove fidelity visually instead of depending on explanatory copy.

---

## 6. Preview Frame

### Current issue
The preview feels like a screenshot inside a bordered card.

### Redesign goal
Make it feel like a floating, integrated OpenCode artifact.

### Direction
- reduce visible cardness
- give the preview shell more air around it
- soften the outer frame
- use subtle elevation and top-edge light
- keep browser/window chrome very restrained

### Important product alignment
The preview must still read as an OpenCode-like terminal/TUI workspace, not a generic web app card.

The preview should emphasize:
- terminal-like shell structure
- sidebar rail
- conversation area
- diff rendering
- prompt/composer area
- status/footer lines

### Styling notes
- the stage around the preview should be darker and quieter than the preview shell itself
- preview internals should feel deliberately composed, not screenshot-like

---

## 7. Export Zone

### Current issue
The export area reads like ordinary segmented controls.

### Redesign goal
Turn export into a calm, premium finishing tray.

### Direction
Use two elegant export cards instead of simple toggles.

Each card can show:
- mode name
- filename suffix
- lightweight readiness/status metadata

### Selected state
The selected export card should use the porcelain active surface.

### Behavior
The export interaction should feel like selecting a final artifact, not flipping a setting.

### Tone
Quietly important, but never louder than the preview.

---

## 8. Draft Saved Status

### Current issue
The current toast is promising, but still a little too badge-like.

### Redesign goal
Make save feedback feel calm and precise.

### Direction
- slimmer floating pill
- less saturated green presence
- optional icon or small timestamp
- cleaner alignment to screen edge/grid

### Tone
It should feel like trustworthy system reassurance, not a noisy notification.

---

# Motion Direction

Motion should be minimal and refined.

## Principles
- short duration
- soft easing
- no playful bounce
- no exaggerated scaling
- motion should support material change and hierarchy only

## Appropriate motion moments
- segmented control active shift
- hover elevation on export cards
- subtle preview stage transitions
- status pill appearance/disappearance
- row affordance reveal

## Avoid
- large springy motion
- glowing animated gradients
- attention-seeking transitions

---

# Interaction Tone

Interactions should feel:
- precise
- controlled
- tactile
- calm

## Hover states
Should be subtle:
- gentle tonal lift
- faint border reveal if necessary
- not dramatic color shifts

## Focus states
Must remain accessible, but should still fit the restrained visual system.

Recommended approach:
- soft accent ring or glow with low spread
- no harsh browser-default feeling if custom styles are applied accessibly

## Active states
Should feel materially different, not merely darker/lighter by a random percentage.

---

# Content Tone

Microcopy should match the visual restraint.

## Recommended tone
- short
- confident
- minimal
- descriptive without overexplaining

## Preferred style
Good:
- `Live preview`
- `Draft saved locally`
- `Dark mode`
- `Export`

Less ideal:
- long explanatory utility text competing with hero areas
- overly chatty status labels
- marketing copy in core controls

---

# Accessibility Within This Direction

Editorial minimal does not mean low usability.

Requirements:
- all shell text must maintain strong readability on dark surfaces
- reduced contrast should only apply to tertiary/supporting metadata
- active and focus states must remain clear
- semantic token rows must remain easy to scan
- preview fidelity remains more important than decorative shell styling

The product should feel luxurious because it is clear and controlled, not because it is difficult to read.

---

# Summary of Required Changes

## Global changes
- reduce border dependence
- increase tonal hierarchy
- elevate preview as hero surface
- quiet the editor rail
- increase whitespace and scale contrast
- make typography more editorial
- use one restrained shell accent
- make active surfaces feel porcelain-like and tactile

## Section changes
- redesign top-left title area as editorial intro block
- redesign mode switcher as premium material selector
- demote basic/advanced switch
- refine semantic token rows and grouping
- turn preview into floating stage artifact
- redesign export as finishing tray with file cards
- refine saved-status pill into calmer system feedback

## Overall intended outcome
The final UI should feel like a **premium OpenCode theme studio** with:
- confidence
- visual calm
- strong hierarchy
- trustworthy preview emphasis
- modern 2026 restraint

It should feel purpose-built, luxurious, and mature.
