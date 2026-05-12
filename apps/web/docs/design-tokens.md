# CleanStart Design Tokens (extracted from Figma)

File: `doWR9Xbwgkz6dqR9n4m3BB` — Home page (node 108:7624) — frame 1920×9276

## Layout
- Frame width: **1920px**
- Container width: **1276px** (centered, 322px side margin)
- Header pill: 1295×70, padding 16, x=313 (slightly wider than container)
- Hero block: 1201px wide, 360px from left
- Section gaps: ~96–110px vertical between sections

## Typography — **Figtree** (Google Fonts)
| Style | Weight | Size | LH | LS |
|-------|--------|------|----|----|
| Display 62 SemiBold (Factory heading) | 600 | 62px | 100% | -5% |
| Display 62 Bold (Security heading) | 700 | 62px | 100% | -5% |
| Body 30 Regular (description) | 400 | 30px | 140% | -4% |
| Body 19 Regular (Trusted by subtitle) | 400 | 19px | 110% | -3% |

## Colors
### Brand
- Hero gradient stop 0 — `#151021` (deep navy purple)
- Hero gradient stop 60% — `#131E8F` (deep blue)
- Hero gradient stop 75% — `#471EC0` (purple)
- Hero gradient stop 84% — `#471FC3`
- Engine panel gradient — same start, ends `#551EC3`
- Cyan accent — `#2CC1EB` (used at 0.4 opacity in comparison cards)
- Lavender highlight — `#DAB6F3` (radial-gradient strokes on glassy elements)

### Neutrals
- White — `#FFFFFF` (display headings on dark sections)
- Off-black text — `#111111` at 80% opacity (description copy on light sections)

## Hero gradient (linear, ~vertical)
```css
background: linear-gradient(180deg,
  #151021 0%,
  #10123E 45%,
  #131E8F 60.7%,
  #471EC0 74.7%,
  #471FC3 83.5%,
  rgba(70,30,191,.85) 87.6%,
  rgba(66,30,188,.4) 94.5%,
  rgba(66,30,188,0) 98.6%);
```

## Engine panel gradient (linear, ~vertical)
```css
background: linear-gradient(180deg, #151021 0%, #131E8F 71%, #551EC3 100%);
```

## Effects
### Engine panel drop shadow stack
```css
box-shadow:
  -8px 4px 20px 0 rgba(0,0,0,.23),
  -33px 16px 37px 0 rgba(0,0,0,.20),
  -74px 37px 49px 0 rgba(0,0,0,.12),
  -131px 65px 59px 0 rgba(0,0,0,.03);
```

### Comparison card (Public Images / CleanStart)
- 622×600, corner-radius **40**, white fill stacked with cyan `#2CC1EB` at 40% layer opacity (glass tint)

### Header "Book a Demo" pill
- 153×38, corner-radius **8**, padding 0
- Fill: linear gradient grey 20% opacity
- Stroke: linear gradient grey 1.5px
- Glass effect: blur 4

### Hero "Browse Images" pill
- 205×40, corner-radius **8**, padding 9 vertical / 18 horizontal
- Fill: white 65% opacity + radial-gradient highlights (linear-dodge blend)
- Stroke: white SOFT_LIGHT + lavender radial gradient

## Cards row
- Frame 1276×374, horizontal layout, gap **28px**
- Each card: **233×374**, corner-radius from icon mask groups

## Engine arrow
- SVG asset at `/public/images/engine-arrow.svg`
- 154×71, gradient fill `#33BAEC → #131E8F → #222594` with lavender radial stroke

## Assets exported
- `logo-cleanstart.png` 153×32
- `factory-card-{1..5}.png` 302×312 (the orb icon graphics)
- `kubr-bird.png` 290×299
- `advantage-bg.jpg` 1920×817
- `engine-arrow.svg` vector
- 75 SVGs in `public/images/trusted/` (community/CNCF logos)

## Key Figma node IDs (for re-extraction if needed)
- Home page frame: `108:7624`
- Header: `108:8867`
- Hero headline+CTA: `108:9108`
- Trusted by strip: `108:9116`
- Cards row (5 cards): `108:9151`
- Engine panel: `108:9288`
- Security section: `108:7892`
- Advantage section: `108:7864`
