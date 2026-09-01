# SaaS “Move Beyond Shift Left” — Verified Core Design

## Purpose

Replace the current cleanroom-reactor illustration with a more immediate visual explanation of the supplied statement: security begins in the software components developers use and remains embedded throughout delivery, while security introduced only after deployment creates rejection and rework.

The section retains the supplied content exactly:

- Heading: `Move Beyond Shift Left`
- Supporting paragraph: `Modern applications require security to be built into the software components developers use, not added after applications are created.`
- Late-review sequence: `Code → Build → Test → Deploy → Security Review`
- Verified-first sequence: `Verified Components → Code → Build → Test → Deploy → Security Review`

No new marketing claims, comparison headings, or explanatory captions are added.

## Approved Direction: The Verified Core

The visual becomes one asymmetric delivery surface containing a dominant verified-first route and a smaller late-review reference route.

The verified-first route begins with an oversized `Verified Components` source capsule on the far left. A continuous cyan-to-mint provenance ribbon emerges from the capsule and travels through transparent Code, Build, Test, and Deploy stage housings. The same luminous core remains visible inside every housing, making built-in security a material property of the pipeline rather than a separate checkpoint.

At the right edge, `Security Review` becomes a scanning arch instead of another process card. The verified core passes through the arch and resolves into an open release arrow with a check mark.

The late-review route sits above the primary route at reduced visual weight. It begins directly at Code, progresses through Build, Test, and Deploy on a neutral rail, and meets a closed coral `Security Review` scanner. A permanent return curve folds back to Code. The blocked scanner and return geometry communicate late discovery and rework without additional text.

## Composition and Hierarchy

- Preserve the centered section heading and supporting paragraph above the visual.
- Place both routes inside one wide obsidian control surface with a restrained border, inner highlight, and subtle technical grid.
- Give the verified-first route approximately 70 percent of the visual emphasis through scale, contrast, and vertical space.
- Keep the late-review route compact and subdued so it provides context without competing with the recommended path.
- Align Code, Build, Test, Deploy, and Security Review across both routes wherever the geometry permits.
- Remove the reactor chamber, stacked floors, enclosing review perimeter, floating `Unverified Components` object, and intake/rejection hexagon comparison.
- Use no external imagery. The diagram is built from semantic HTML, CSS, and decorative SVG geometry.

## Visual Language

- Background: near-black navy with a controlled cobalt lift behind the primary route. Purple remains atmospheric and does not dominate the diagram.
- Verified state: cyan-to-mint provenance ribbon, illuminated source capsule, embedded stage cores, open scanner, and release check.
- Late-review state: cool slate rail and stage housings, with coral reserved for the closed scanner and return signal.
- Stage housings: transparent chamfered shells that reveal the route passing through their centers. They must not read as generic rounded cards.
- Stage iconography: each primary delivery stage uses a distinct monoline symbol inside its core window—code brackets for Code, an isometric package for Build, a check-in-ring for Test, and an upward release arrow for Deploy. The symbols share one cyan line treatment so they improve recognition without fragmenting the continuous verified route.
- Stage layering: the continuous provenance rail passes behind each circular icon plate. An opaque inner plate masks the rail within the circle, while the icon remains on the foreground layer; the rail stays visible only on either side of the plate.
- Scanner: two vertical posts with a scanning aperture. The verified state is open; the late-review state is visibly closed.
- Texture: fine grid, coordinate ticks, and restrained bloom provide depth without obscuring labels or flow.
- Typography: all visible text uses the canonical `--fs-*`, `--font-display`, and `--font-sans` role tokens.

## Motion

Meaning must be complete in the settled frame. Motion only reinforces direction:

1. A single restrained pulse travels from Verified Components through Code, Build, Test, and Deploy.
2. The open Security Review scanner sweeps once as the pulse passes and the release check brightens.
3. A short coral pulse travels backward along the late-review return curve.

Animations share one slow CSS timeline and avoid continuous high-frequency movement. Under `prefers-reduced-motion: reduce`, all translation and scanning stop while the embedded core, open release, closed scanner, and return curve remain fully visible.

## Responsive Behaviour

### Desktop and tablet

- Render one shared comparison surface without horizontal scrolling.
- Preserve the primary left-to-right route and the smaller late-review route above it.
- Keep visible labels as HTML when SVG scaling would reduce them below the typography system’s readable floor.
- Preserve SVG geometry with `preserveAspectRatio="xMidYMid meet"`.

### Mobile

- Replace the desktop composition with a dedicated vertical chain-of-trust layout.
- Show the late-review route first as a compact subdued process strip ending in a closed scanner and short return curve.
- Show the verified-first route as the dominant vertical composition: source capsule, four stacked stage housings with one continuous core, then an open Security Review scanner and release check.
- Use canonical typography tokens and introduce no horizontal scrolling.

## Accessibility

- Keep visual SVG geometry and animation `aria-hidden`.
- Expose the two exact source sequences once through visually hidden ordered content.
- Do not rely on color alone: the late path is blocked and looped; the verified path is continuous and exits through an open scanner.
- Ensure visible labels meet contrast requirements against their settled backgrounds.

## Component Architecture

- `SaasShiftLeft.tsx`: section shell, exact supplied copy, accessible descriptions, and the diagram entry point.
- `SaasVerifiedCore.tsx`: desktop and mobile diagram structure plus focused presentational helpers.
- `SaasVerifiedCore.module.css`: stage surface, responsive layout, illumination, scanner, pulse, return, and reduced-motion styles.
- `SaasShiftLeft.test.tsx`: exact-copy, sequence, geometry-contract, responsive, accessibility, and reduced-motion assertions.
- Remove the superseded `SaasCleanroomReactor.tsx` and `SaasCleanroomReactor.module.css` after the replacement passes its tests.

No shared tokens, global CSS, navigation, other pages, CMS code, dependencies, or configuration change.

## Testing and Verification

Automated tests must prove:

- The heading and supporting paragraph remain exact.
- Both source-document sequences are exposed exactly once to assistive technology.
- The old cleanroom-reactor geometry no longer renders.
- Verified Components is the source of one continuous core through Code, Build, Test, and Deploy.
- The verified Security Review scanner is open and followed by an explicit release exit.
- The late-review scanner is closed and connected to a return path toward Code.
- Desktop and mobile visuals are decorative and structurally distinct.
- Reduced-motion styles preserve a complete static diagram.
- No SVG uses `preserveAspectRatio="none"`.

Verification requires the focused SaaS test, the web package test suite, lint, typecheck, production build, and visual inspection at 1440 × 900. A representative mobile viewport is also checked because its composition is structurally different.

## Acceptance Criteria

- A viewer can extract the contrast in a static frame without reading new explanatory copy.
- Verified Components is the unmistakable leftmost source of the primary route.
- The same verified core is visibly embedded inside every delivery stage.
- Code, Build, Test, and Deploy are distinguishable by both label and unique stage icon.
- The horizontal provenance rail never cuts through a stage glyph or its circular plate.
- The late-review route terminates in a closed scanner and visibly returns toward Code.
- The verified route passes through an open scanner and exits as a successful release.
- The design feels like a distinctive chain-of-trust instrument rather than a generic flowchart or metaphorical reactor.
- The section remains responsive, accessible, reduced-motion safe, and production-build clean.
