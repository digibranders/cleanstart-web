# SaaS Cleanroom Reactor Design

## Purpose

Replace the SaaS page's two-row release timeline with a fundamentally different visual metaphor that communicates the supplied statement: security is part of the software components and the application system, not a checkpoint added after creation.

The supplied wording remains unchanged:

- Heading: `Move Beyond Shift Left`
- Supporting paragraph: `Modern applications require security to be built into the software components developers use, not added after applications are created.`
- Process labels: `Verified Components`, `Code`, `Build`, `Test`, `Deploy`, and `Security Review`

No new marketing sentences, explanatory captions, badges, or comparison headings will be introduced.

## Approved Direction

The section becomes a single cinematic **Cleanroom Reactor** rather than a comparison of two horizontal pipelines.

The memorable visual is a transparent application chamber containing four illuminated internal layers: Code, Build, Test, and Deploy. A Verified Components energy capsule enters the chamber as its source material. Security Review is rendered as the scanning perimeter surrounding the entire chamber, making security visually inseparable from the application system.

Outside the perimeter, a coral late-security artifact impacts the completed chamber, fractures into quarantined shards, and is rejected. It never becomes a second timeline or a parallel set of process steps.

## Spatial Composition

### Section shell

- Keep the current dark SaaS atmosphere, but move from a flat technical grid to a cinematic industrial cleanroom.
- Use one large asymmetric control-stage composition with generous negative space around the reactor.
- Use layered navy-black gradients, restrained cyan illumination, fine technical marks, and a subtle grain/grid texture.
- The heading and supplied paragraph remain centered above the visual and use the canonical typography role tokens.

### Reactor assembly

- Place the reactor slightly right of center to create directional movement from the Verified Components input on the left.
- Construct the reactor as a transparent, chamfered three-dimensional chamber using SVG geometry and layered CSS glow.
- Stack Code, Build, Test, and Deploy as four physical plates inside the chamber rather than nodes on a line.
- Use connecting energy columns and subtle particulate flow to show that the same verified material moves through every layer.
- The chamber's perimeter carries the Security Review label and a scanning beam that traverses all layers.

### Verified Components source

- Render Verified Components as a distinct cyan energy capsule or crystalline cartridge on the left.
- Connect it to the chamber with a short intake conduit, not a full-width process rail.
- Its check mark and label remain visible in the settled state.

### Late-security rejection

- Place a coral application artifact outside the reactor perimeter near the upper-right edge.
- Animate a short impact against the scanning field, followed by a fracture into two or three controlled shards and a return/rejection movement.
- Use coral only for the rejected artifact and impact telemetry; it must not form another row, lane, or full process sequence.

## Motion Choreography

Use one orchestrated CSS animation cycle:

1. The Verified Components capsule powers the intake conduit.
2. Energy rises through Code, Build, Test, and Deploy, illuminating each internal plate.
3. The Security Review beam scans across the complete reactor and resolves to a stable cyan perimeter.
4. A coral late-security artifact approaches from outside, strikes the perimeter, fractures, and is rejected.
5. The reactor returns to its stable protected state before the cycle repeats.

Motion remains subtle and mechanical rather than playful. `prefers-reduced-motion: reduce` disables translation, scanning, fracture, and particle animations while preserving a complete static state: verified capsule active, all four plates illuminated, perimeter visible, and rejected artifact outside.

## Responsive Behaviour

### Desktop and tablet

- Use the full asymmetric reactor stage.
- Preserve the chamber's intrinsic ratio with `preserveAspectRatio="xMidYMid meet"`.
- Keep the Verified Components capsule left of the chamber and the rejected artifact outside the upper-right perimeter.

### Mobile

- Use a dedicated vertical cleanroom composition instead of shrinking the desktop SVG.
- Place Verified Components above a compact reactor intake.
- Stack Code, Build, Test, and Deploy vertically inside one enclosing Security Review frame.
- Keep the rejected coral artifact outside the frame so the core metaphor survives at narrow widths.
- Do not introduce horizontal overflow or text below 16px.

## Accessibility

- Treat the visual SVG and decorative telemetry as `aria-hidden`.
- Provide one screen-reader description of the embedded sequence: `Verified Components, Code, Build, Test, Deploy, Security Review`.
- Do not expose duplicate desktop and mobile labels to assistive technology.
- Never rely on cyan/coral alone: verified state uses a check mark and continuous enclosure; rejection uses fracture geometry and an outward arrow.

## Component Architecture

Split the current oversized implementation into focused, SaaS-scoped files:

- `SaasShiftLeft.tsx`: section wrapper, exact supplied copy, accessible description, and visual composition entry point.
- `SaasCleanroomReactor.tsx`: desktop and mobile reactor SVG/component geometry.
- `SaasCleanroomReactor.module.css`: atmosphere, glow, scan, energy, fracture, and reduced-motion states.
- `SaasShiftLeft.test.tsx`: exact-copy, semantic, geometry-contract, responsive, reduced-motion, and regression assertions.

No shared tokens, global CSS, other pages, CMS code, navigation, or configuration will change.

## Testing and Verification

Automated tests must prove:

- The heading and supporting paragraph match the supplied wording exactly.
- The old release-gate/two-lane control surface no longer renders.
- A single cleanroom reactor contains Code, Build, Test, and Deploy.
- Verified Components is the reactor source and Security Review is the enclosing perimeter.
- The late-security artifact is outside the perimeter and has rejection/fracture geometry.
- Desktop and mobile visuals are decorative while one accessible sequence is exposed.
- Reduced-motion rules produce a complete static composition.
- No SVG uses `preserveAspectRatio="none"`.

Verification requires the SaaS-scoped component tests, the complete web test suite, package lint, targeted ESLint, TypeScript typecheck, production build, and visual inspection at 1440×900. Mobile geometry is also checked at a representative narrow viewport because the mobile composition is structurally different.

## Acceptance Criteria

- The result cannot be mistaken for the previous two horizontal timelines.
- Security Review visually surrounds the application instead of appearing as a terminal gate.
- The visual reads as one premium engineered object, not a collection of cards.
- The supplied wording is unchanged and no replacement copy is added.
- The section is responsive, accessible, reduced-motion safe, and production-build clean.
