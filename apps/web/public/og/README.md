# OpenGraph fallback images

`default.png` — 1200×630 PNG (<300 KB), branded.
Referenced by `apps/web/src/app/layout.tsx` as the default `og:image` /
`twitter:image` for any page that doesn't override it.

**TODO before launch:** design team to drop the final `default.png` here. The
layout already references `/og/default.png` so the file just needs to land at
this path — no code change required.
