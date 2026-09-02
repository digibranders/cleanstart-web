# SaaS Verified Pipeline — Late Route Removal Design

## Purpose

Prepare the “Move Beyond Shift Left” diagram for a new concept by removing the complete upper late-review pipeline. The existing verified-components pipeline remains the sole route and is not redesigned in this step.

## Approved Composition

- Remove the upper Code, Build, Test, Deploy, and closed Security Review route.
- Remove its neutral rail, coral return curve, pulse, stage nodes, and all associated mobile equivalents.
- Retain the lower Verified Components → Code → Build → Test → Deploy → Security Review pipeline unchanged.
- Retain the open scanner, approved release exit, faded technical grid, panel chrome, motion, and reduced-motion behaviour used by the verified route.
- Collapse the desktop control surface to the remaining route so deletion does not leave an empty upper region.
- Expose only the verified-first sequence to assistive technology.

This is an intentional intermediate state. The future left-side integration concept is out of scope until the user supplies it.

## Component Scope

- `SaasVerifiedCore.tsx`: delete late-route desktop/mobile render helpers and closed-scanner branches.
- `SaasVerifiedCore.module.css`: delete late-route styles and animations; reduce the desktop surface height without changing verified-route geometry.
- `SaasShiftLeft.tsx`: remove the obsolete accessible late-review sequence.
- `SaasShiftLeft.test.tsx`: assert that no late-review route or closed scanner is rendered at either breakpoint while the verified route remains complete.

No shared styles, typography tokens, other sections, navigation, assets, dependencies, or CMS code change.

## Acceptance Criteria

- No upper pipeline is rendered on desktop or mobile.
- No late-review return path or closed scanner remains in markup or styles.
- The verified pipeline preserves its source, four ordered stages, distinct icons, open scanner, and approved release exit.
- The desktop panel no longer reserves the removed route’s vertical space.
- The diagram remains responsive, accessible, reduced-motion safe, and production-build clean.
