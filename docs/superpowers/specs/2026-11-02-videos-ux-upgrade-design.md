# /videos UX upgrade

Scope approved 2026-11-02. Web only: no CMS or schema change, the page stays dark (`VIDEOS_PAGE_PUBLIC = false`).

## Goals

1. Cards that say what a video is at a glance.
2. Playing a video must not move the grid.
3. Phones get their first screen back from the stacked controls.

## Changes

### 1. Cards and Quick starts

- Category tag per card: explainer is a violet tint, product demo a green tint, unfiled stays neutral.
- Up to two topic chips under the title. A chip filters the page to that topic.
- Length badge on the poster, bottom right, 13px.
- "Quick starts" row above the grid: explainers under two minutes, newest first, at most four, hidden when fewer than two qualify or when any filter is active. Derived from existing data (`quickStarts` in `lib/videos-utils.ts`).

### 2. Theatre player with Up next

- Clicking a card (or a Quick start) opens a wide player band above the grid and starts the video. The grid does not change.
- Up next sits beside the player from `lg` and below it on smaller screens: up to five videos, same topic first, then same format, then newest (`upNext`).
- Choosing an Up next item swaps the video in place. A Close button ends the session. Starting the hero player stops the theatre (shared play event), and the other way round.
- The card of the playing video shows "Now playing".

### 3. Phone filter sheet

- Below `md` the toolbar is search plus one Filter button with a badge counting active format, topic and sort choices.
- The sheet is a native `<dialog>` (focus trap, Escape and backdrop for free) holding category, topic and sort. Filters apply live; the footer button reads "Show N videos" and closes it.
- `md` and up keep today's toolbar.

## Constraints

- Light theme, repo tokens (`--fs-*`, container, section). Reduced motion respected: no smooth scroll, no slide.
- No em or en dashes in copy (`verify:copy`).
- Playback analytics and watched tracking stay inside `VideoPlayer`.

## Tests

Unit tests for `quickStarts` and `upNext`. Browser check at 1440x900 and 390 wide.
