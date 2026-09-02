# SaaS Verified Pipeline — 3D Process Deck Design

## Purpose

Replace the diagram’s outlined-card appearance with a professional three-dimensional process instrument while preserving its existing meaning and stage order.

## Approved Direction

The diagram becomes a machined process deck rather than a row of containers. `Verified Components` enters as a luminous source cartridge. Code, Build, Test, and Deploy sit on raised dark modules with bevelled top planes, recessed undersides, and directional shadows. A continuous cyan-to-mint trust rail passes through illuminated circular ports and exits through a solid Security Review arch.

Depth is communicated through material shading, occlusion, top-edge specular light, bottom faces, and soft offset shadows. Visible perimeter strokes are removed from the outer surface, route deck, source cartridge, stage modules, icon ports, and release badge.

## Composition

- Preserve the existing Verified Components → Code → Build → Test → Deploy → Security Review sequence.
- Preserve the distinct stage icons, animated trust pulse, scanner sweep, approved release state, and reduced-motion fallback.
- Remove the desktop measurement corners and inner route outline.
- Render the outer desktop surface as one deep base with a shadowed lower face, not a bordered panel.
- Render the verified route as a raised deck with a softly lit top plane and recessed lower face.
- Render source and stage modules without chamfer outlines; each uses an opaque face, a visible dark underside, and a narrow specular highlight.
- Rebuild the scanner as a solid U-shaped arch using filled geometry rather than three border strokes.
- Apply the same material language to the vertical mobile composition without introducing horizontal overflow.

## Visual Language

- Materials: graphite-blue anodised surfaces with subtle cyan reflections.
- Depth: offset soft shadows and inset shading; no hard block shadows or glass-card effects.
- Source: slightly brighter and wider than process modules, with a mint verification lens.
- Stage modules: same family and elevation, with modest variation from the moving signal rather than separate colours.
- Icon ports: recessed circular lenses with opaque centres that mask the rail.
- Scanner: solid green structural arch with a dark scanning aperture.
- Background grid: retained only as a faint measurement texture on the engineered base, fading at the perimeter.

## Component Scope

- `SaasVerifiedCore.tsx`: remove obsolete decorative surface chrome markup and add no new runtime behaviour.
- `SaasVerifiedCore.module.css`: replace container outlines with the 3D material and depth system for desktop and mobile.
- `SaasShiftLeft.test.tsx`: lock the borderless-container and 3D-layer contracts while preserving existing content, sequencing, accessibility, and motion assertions.

No assets, dependencies, shared styles, typography tokens, marketing copy, navigation, other sections, or CMS code change.

## Acceptance Criteria

- The source and four process stages do not read as outlined cards.
- The outer panel and route deck do not use visible perimeter borders or nested outline frames.
- Each source/stage module has a top face, a recessed lower face, and an offset soft shadow.
- The scanner reads as a solid dimensional gate rather than a bordered box.
- The trust rail remains clearly visible between modules and hidden behind each icon port and scanner body.
- Desktop and mobile retain readable labels, stage order, no overflow, and complete reduced-motion states.
- The result feels like one coherent 3D security instrument, not a generic flowchart.
