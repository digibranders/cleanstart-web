# SaaS “Move Beyond Shift Left” — Release Gate Design

## Objective

Replace the current `SaasShiftLeft` diagram with a premium, immediately legible comparison between security applied after deployment and verified components introduced before development begins. Preserve every supplied word and stage label exactly.

## Source Content

The section must retain this content without additions or rewrites:

- Heading: “Move Beyond Shift Left”
- Supporting copy: “Modern applications require security to be built into the software components developers use, not added after applications are created.”
- Late-review path: “Code → Build → Test → Deploy → Security Review”
- Verified-first path: “Verified Components → Code → Build → Test → Deploy → Security Review”

The design must communicate the comparison visually. It must not add labels such as “traditional,” “better,” “failed,” “rework,” or “CleanStart path.”

## Chosen Direction: The Release Gate

The section becomes a dark, cinematic release-control surface rather than a decorative purple illustration. Two precisely aligned pipelines share the same stage geometry so their outcomes can be compared without reading an explanation.

The upper pipeline begins at Code. A restrained neutral artifact progresses through Build, Test, and Deploy while coral findings accumulate. At Security Review it meets a closed gate. A visible trajectory folds back toward Code, making late discovery and rework readable from shape alone.

The lower pipeline begins with a luminous Verified Components capsule. A cyan release signal activates Code, Build, Test, and Deploy, opens the Security Review gate, and exits the composition. The successful path is brighter, straighter, and visually continuous.

## Visual System

- Background: near-black navy with a subtle radial lift behind the release surface, replacing the current saturated purple field.
- Control surface: one large obsidian glass panel with a fine border, restrained inner highlight, and deep shadow. It should feel like precision infrastructure, not a floating generic card.
- Structure: faint coordinate grid, lane separators, and minimal instrument ticks provide technical texture without competing with content.
- Failure color: coral appears only in findings, the blocked gate, and the return trajectory.
- Success color: cyan-to-mint appears only in the verified source, active rail, open gate, and exit signal.
- Neutral stages: cool slate and ice-blue, with typography using the project’s canonical Manrope/Sora tokens.
- Decorative depth: CSS gradients, SVG strokes, and subtle bloom only. No external or generated assets are required.

## Composition

The heading and paragraph remain centered above the control surface using `--fs-h2` and `--fs-lead-sm`. The content width must preserve readable line lengths and the page’s existing vertical rhythm.

At desktop widths, the control surface contains both lanes in one SVG coordinate system. Stage centers align vertically across lanes. The upper return trajectory occupies the panel’s top band, giving the failure path a distinct loop silhouette. The lower path exits beyond the right edge, giving the verified path a distinct straight-line silhouette.

Stage labels remain HTML so they retain accessible, token-based type sizing. The visual SVG is decorative and hidden from assistive technology; an ordered screen-reader description exposes both exact stage sequences.

At widths below `lg`, each path becomes a compact vertical process card. The late-review card ends at a visibly blocked Security Review row with a return stroke. The verified card begins with an emphasized Verified Components row and ends at an open Security Review row with an exit stroke. No horizontal scrolling is allowed.

## Motion

One shared CSS animation timeline controls both paths:

1. The upper artifact advances through its four stages.
2. Findings appear at Build, Test, and Deploy.
3. The closed gate pulses once when the artifact arrives.
4. A coral signal travels backward along the return trajectory.
5. The lower verified signal activates its source and each downstream stage.
6. The open gate brightens and the signal exits the panel.

Motion must reinforce the static composition rather than carry essential meaning. Under `prefers-reduced-motion: reduce`, all animation stops on a settled frame showing accumulated findings, the closed upper gate, the illuminated verified path, the open lower gate, and the exit signal.

## Component Architecture

The implementation remains scoped to `apps/web/src/components/sections/saas/SaasShiftLeft.tsx` unless a focused co-located test is added.

- `SaasShiftLeft` owns the section shell, locked copy, background, and responsive switch.
- `ReleaseGatePanel` owns the shared desktop coordinate system and both lane groups.
- `StageNode`, `ReleaseArtifact`, `FindingMarker`, and `SecurityGate` are focused presentational SVG helpers.
- `StageLabels` owns token-based HTML labels aligned to SVG stage centers.
- `MobileReleasePaths` owns the non-animated stacked representation.
- Animation timing and stage geometry remain constants at module scope so every moving element reads from one clock.

There is no business data flow and no external I/O. Static readonly tuples define the two supplied stage sequences. No runtime error state is necessary because the component has no fallible boundary.

## Accessibility and Performance

- Preserve semantic `section`, `h2`, and paragraph structure.
- Keep all decorative SVG content `aria-hidden` and non-interactive.
- Add visually hidden ordered descriptions containing the exact two stage sequences.
- Maintain readable contrast for all stage labels and states.
- Do not depend on color alone: the upper path is looped and blocked; the lower path is straight and open.
- Use CSS/SVG only, avoiding image downloads, canvas work, and new client-side JavaScript.
- Keep the component server-renderable.

## Verification

- Confirm the supplied heading, paragraph, and stage labels are unchanged.
- Confirm the desktop section at 1440 × 900 has clear hierarchy, no clipping, aligned stages, and an obvious blocked-loop versus open-exit comparison.
- Confirm the section reflows without horizontal scrolling at narrow widths.
- Confirm reduced-motion produces a complete, comprehensible static state.
- Run `pnpm --filter @cleanstart/web lint`.
- Run `pnpm --filter @cleanstart/web typecheck`.
- Run `pnpm --filter @cleanstart/web build`.

## Scope Boundaries

Do not change other SaaS sections, global tokens, navigation, shared layout primitives, or the source document. Do not introduce new marketing claims, external assets, dependencies, or page-level behavior.
