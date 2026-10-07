/**
 * Particle field behind the home platform section (plain 2D canvas, no
 * library). The CleanStart logomark hangs in the dust behind the three product
 * cards; hover or focus a card and the dust regathers into that product's own
 * badge, sampled from the artwork in its real colours. A few loose warm
 * specks stay as ambient "inherited risk", and a roaming lens turns them into
 * clean, ordered light. The emblem dots themselves do not react to the pointer.
 *
 * Everything readable lives in the server-rendered DOM. This file only paints
 * behind it, and is loaded after the section approaches the viewport.
 */
import { LOGOMARK, PRODUCT_ART, PRODUCT_KEYS, optimisedImageUrl, type ProductKey } from "./product-art";
import { RAIL_H, RAIL_W, pointAt, polyPath, railCommands, toPoints, type PolyPath, type Point, type RailIndex } from "./rail";
import { sampleAlpha, type SampleOptions } from "./sampling";

type Rgb = readonly [number, number, number];
type Rect = { x: number; y: number; w: number; h: number };

export interface FieldOptions {
  readonly root: HTMLElement;
  readonly canvas: HTMLCanvasElement;
  readonly reducedMotion: boolean;
  readonly onReady?: () => void;
}

export interface FieldHandle {
  destroy(): void;
}

const MASK = 768;
const ART = MASK * 0.8;
/** Pixels at or below this luminance are the emblem's dark glass body and get no dots. */
const BADGE_MIN_LUMA = 62;
const LOGO_MODE = 3;
const TINTS: readonly Rgb[] = [
  [91, 155, 255],
  [167, 128, 255],
  [45, 212, 176],
];
const CYAN: Rgb = [44, 193, 235];
const WHITE: Rgb = [255, 255, 255];
const ICE: Rgb = [190, 239, 255];
const RISK: readonly Rgb[] = [
  [244, 63, 94],
  [247, 163, 92],
  [255, 224, 138],
  [150, 170, 215],
];
const LOGO_PAINT = ["#f00", "#0f0"] as const;

/**
 * Adds a little contrast to a sampled colour, keeping its tone: mid blues
 * stay deep, bright rims and glyphs stay bright, so the emblem keeps
 * the same light and shade as the artwork on the card.
 */
function contrast(v: number, floor: number): number {
  return Math.max(floor, Math.min(255, ((v / 255 - 0.5) * 1.25 + 0.5) * 255 + 10));
}

function at<T>(list: readonly T[], i: number): T {
  return list[i] as T;
}

/* ---------- stencils ---------- */

interface Stencil {
  readonly data: Uint8ClampedArray;
  readonly sampling: SampleOptions;
}

function newContext(): CanvasRenderingContext2D {
  const c = document.createElement("canvas");
  c.width = MASK;
  c.height = MASK;
  const g = c.getContext("2d", { willReadFrequently: true });
  if (!g) throw new Error("2D canvas is unavailable");
  g.lineJoin = "round";
  g.lineCap = "round";
  return g;
}

function paintLogomark(): Stencil {
  const g = newContext();
  const k = ART / LOGOMARK.h;
  g.setTransform(k, 0, 0, k, MASK / 2 - (LOGOMARK.w / 2) * k, MASK / 2 - (LOGOMARK.h / 2) * k);
  g.fillStyle = LOGO_PAINT[0];
  g.fill(new Path2D(LOGOMARK.cyan));
  g.fillStyle = LOGO_PAINT[1];
  g.fill(new Path2D(LOGOMARK.white));
  return { data: g.getImageData(0, 0, MASK, MASK).data, sampling: {} };
}

/** Draws a live badge, trimmed to its visible hexagon, into a stencil. */
async function paintBadge(key: ProductKey): Promise<Stencil | null> {
  const art = PRODUCT_ART[key];
  const img = new Image();
  img.decoding = "async";
  img.src = optimisedImageUrl(art.src);
  try {
    await img.decode();
  } catch {
    return null;
  }
  const g = newContext();
  const sw = art.trim.w * img.naturalWidth;
  const sh = art.trim.h * img.naturalHeight;
  const k = ART / Math.max(sw, sh);
  g.drawImage(
    img,
    art.trim.x * img.naturalWidth,
    art.trim.y * img.naturalHeight,
    sw,
    sh,
    (MASK - sw * k) / 2,
    (MASK - sh * k) / 2,
    sw * k,
    sh * k,
  );
  return { data: g.getImageData(0, 0, MASK, MASK).data, sampling: { halftone: true, minLuma: BADGE_MIN_LUMA } };
}

async function loadStencils(): Promise<Stencil[]> {
  const logo = paintLogomark();
  const badges = await Promise.all(PRODUCT_KEYS.map((key) => paintBadge(key)));
  return [...badges.map((b) => b ?? logo), logo];
}

/* ---------- field ---------- */

interface Target {
  readonly x: number;
  readonly y: number;
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

interface Particle {
  x: number;
  y: number;
  pp: number;
  hold: number;
  delay: number;
  live: boolean;
  mode: number;
  pending: number;
  /** Loose ambient speck (not part of any emblem). */
  readonly amb: boolean;
  readonly risk: number;
  /** The last colour this dot was shown in, kept while it has no place in the current shape. */
  last: Target | undefined;
  readonly sp: number;
  readonly s1: number;
  readonly s2: number;
  /** One target per mode; a particle past a mode's dot count has none there and just drifts. */
  targets: ReadonlyArray<Target | undefined>;
}

interface Layout {
  w: number;
  h: number;
  stacked: boolean;
  compact: boolean;
  cards: Rect[];
  rail: Rect | null;
  wires: PolyPath[];
  bar: Rect;
}

export function createField(opts: FieldOptions): FieldHandle {
  const { root, canvas, reducedMotion } = opts;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { destroy: () => undefined };

  let stencils: Stencil[] | null = null;
  let destroyed = false;
  const cardEls = Array.from(root.querySelectorAll<HTMLElement>("[data-pf-card]"));

  let layout: Layout | null = null;
  let places: Array<{ cx: number; cy: number; size: number }> = [];
  let particles: Particle[] = [];
  let hoverMode = -1;
  const ptr = { x: 0, y: 0, on: false };
  let tourMode = -1;
  let interacted = false;
  let shown = -2;
  let tourClock = 0;
  let clock = 0;
  let quality = 1;
  let dtAvg = 0.016;
  let sinceCheck = 0;
  let visible = false;
  let raf = 0;
  let last = 0;
  let ready = false;
  let armed = reducedMotion;
  const flows: Array<Array<{ u: number; v: number }>> = [];
  /* ----- layout ----- */

  function measure(): Layout {
    const o = canvas.getBoundingClientRect();
    const rect = (el: Element): Rect => {
      const r = el.getBoundingClientRect();
      return { x: r.left - o.left, y: r.top - o.top, w: r.width, h: r.height };
    };
    const cards = cardEls.map(rect);
    const railEl = root.querySelector("[data-pf-rail]");
    const barEl = root.querySelector("[data-pf-bar]");
    const rail = railEl ? rect(railEl) : null;
    const stacked = cards.length > 1 && (at(cards, 1).x < at(cards, 0).x + at(cards, 0).w - 2);
    const usableRail = rail && rail.w > 40 && rail.h > 20 && !stacked ? rail : null;
    const wires = usableRail
      ? ([0, 1, 2] as const).map((i: RailIndex) =>
          polyPath(
            toPoints(railCommands(i)).map(
              (p): Point => [usableRail.x + (p[0] / RAIL_W) * usableRail.w, usableRail.y + (p[1] / RAIL_H) * usableRail.h],
            ),
          ),
        )
      : [];
    return { w: o.width, h: o.height, stacked, compact: o.width < 760, cards, rail: usableRail, wires, bar: barEl ? rect(barEl) : { x: 0, y: o.height, w: o.width, h: 0 } };
  }

  function centreFor(mode: number, l: Layout): { cx: number; cy: number; size: number } {
    if (mode === LOGO_MODE) {
      // A quiet watermark centred on the connector band, between the cards and
      // the bar, so it sits behind the lines and not behind any card copy.
      const c0 = at(l.cards, 0);
      const mid = l.rail ? l.rail.y + l.rail.h / 2 : c0.y + c0.h + 20;
      const size = Math.max(180, Math.min(l.w * 0.3, 300));
      return { cx: l.w / 2, cy: mid, size };
    }
    // The emblem forms inside the active card, flush to its right edge, so it
    // never lands on a neighbouring card's copy. It sits above the card surface
    // and under the card's own copy, so nothing boxes it in.
    const c = at(l.cards, mode);
    if (l.stacked || c.w < 300) {
      // Phone and tablet: the copy fills the card, so the emblem takes the free
      // top-right corner beside the small badge instead of sitting behind the text.
      const size = l.stacked ? Math.min(c.w * 0.46, 170) : Math.max(84, Math.min(c.w * 0.46, c.w - 122));
      return { cx: c.x + c.w - size / 2 - 16, cy: c.y + 16 + size / 2, size };
    }
    const size = Math.min(c.h * 0.78, c.w * 0.52, 250);
    return { cx: c.x + c.w - size / 2 - 14, cy: c.y + c.h * 0.5, size };
  }

  /**
   * Dots an emblem gets, from its own rendered area so the dot spacing is the
   * same whatever the screen. Only the bright artwork gets dots (the dark glass
   * body is skipped), so this lands at about 3 px between neighbouring dots.
   */
  function dotsFor(l: Layout, size: number, mode: number): number {
    const cores = typeof navigator !== "undefined" ? navigator.hardwareConcurrency || 4 : 4;
    // The resting logomark is a sparse watermark; the product emblems are tighter.
    const perPx2 = mode === LOGO_MODE ? 0.014 : l.compact ? 0.034 : 0.036;
    const wanted = perPx2 * size * size * (cores <= 4 ? 0.8 : 1);
    return Math.round(Math.min(mode === LOGO_MODE ? 2000 : 2800, Math.max(mode === LOGO_MODE ? 380 : 260, wanted)));
  }

  function applyLayout(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const l = measure();
    if (!stencils || l.w < 2 || l.h < 2 || cardEls.length === 0) return;
    layout = l;
    canvas.width = Math.round(l.w * dpr);
    canvas.height = Math.round(l.h * dpr);
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);

    places = [0, 1, 2, LOGO_MODE].map((m) => centreFor(m, l));
    const need = places.map((pl, m) => dotsFor(l, pl.size, m));
    const nf = Math.max(...need);
    const n = Math.round(nf / 0.97);
    const sets = stencils.map((st, m) => sampleAlpha(st.data, MASK, at(need, m), Math.random, st.sampling));
    const fresh = particles.length === 0 || Math.abs(particles.length - n) > n * 0.25;
    if (fresh) {
      particles = [];
      for (let i = 0; i < n; i++) {
        particles.push({
          x: Math.random() * l.w,
          y: Math.random() * l.h,
          pp: 0,
          hold: 0,
          delay: Math.random() * 0.9,
          live: false,
          mode: LOGO_MODE,
          pending: LOGO_MODE,
          amb: i >= nf,
          risk: Math.random() < 0.12 ? 3 : Math.floor(Math.random() * 3),
          last: undefined,
          sp: 0.5 + Math.random() * 0.9,
          s1: Math.random() * 6.28,
          s2: Math.random() * 6.28,
          targets: [],
        });
      }
    }
    for (let i = 0; i < particles.length; i++) {
      const p = at(particles, i);
      if (p.amb) continue;
      p.targets = sets.map((set, m) => {
        const s = set[i];
        if (!s) return undefined;
        const pl = at(places, m);
        const k = pl.size / ART;
        const x = pl.cx + (s[0] - MASK / 2) * k;
        const y = pl.cy + (s[1] - MASK / 2) * k;
        if (m === LOGO_MODE) {
          const c = s[3] > s[2] ? WHITE : CYAN;
          return { x, y, r: c[0], g: c[1], b: c[2] };
        }
                return { x, y, r: contrast(s[2], 0), g: contrast(s[3], 0), b: contrast(s[4], 0) };
      });
    }
    flows.length = 0;
    for (let i = 0; i < l.wires.length; i++) {
      flows.push(Array.from({ length: 16 }, () => ({ u: Math.random(), v: 0.14 + Math.random() * 0.1 })));
    }
    if (reducedMotion) settle();
  }

  /* ----- interaction state ----- */

  function activeMode(): number {
    if (hoverMode >= 0) return hoverMode;
    if (tourMode >= 0) return tourMode;
    return LOGO_MODE;
  }

  function syncMode(): void {
    const m = activeMode();
    if (m === shown) return;
    shown = m;
    for (const p of particles) {
      if (p.amb) continue;
      p.pending = m;
      p.hold = reducedMotion ? 0 : Math.random() * 0.28;
    }
    cardEls.forEach((el, i) => {
      if (i === m) el.setAttribute("data-active", "true");
      else el.removeAttribute("data-active");
    });
    if (reducedMotion) settle();
  }

  function setHover(mode: number): void {
    interacted = true;
    tourMode = -1;
    hoverMode = mode;
    syncMode();
  }

  /* ----- painting ----- */

  function settle(): void {
    syncMode();
    for (const p of particles) {
      p.mode = p.pending;
      const t = p.targets[p.mode];
      if (t) {
        p.x = t.x;
        p.y = t.y;
      }
      p.live = true;
      p.pp = p.amb ? 0 : 1;
    }
    paint(0, 0, true);
  }

  function shapePlace(mode: number): { cx: number; cy: number; size: number } | undefined {
    return places[mode];
  }

  function paint(t: number, dt: number, still: boolean): void {
    const l = layout;
    if (!l || !ctx) return;
    ctx.clearRect(0, 0, l.w, l.h);
    const active = activeMode();
    const lens = ptr.on ? { x: ptr.x, y: ptr.y } : { x: l.w * (0.5 + 0.38 * Math.sin(t * 0.45)), y: l.h * (0.45 + 0.36 * Math.sin(t * 0.33 + 1)) };
    const lensR = Math.min(l.w, l.h) * (ptr.on ? 0.19 : 0.16);
    const beamX = ((t * 0.17) % 1.6 - 0.3) * l.w;
    const count = Math.max(1, Math.floor(particles.length * quality));
    const dotScale = l.compact ? 0.88 : 1;

    // soft light behind whatever shape the dust is making
    const place = shapePlace(active);
    if (place) {
      const tint = active === LOGO_MODE ? CYAN : at(TINTS, active);
      const g = ctx.createRadialGradient(place.cx, place.cy, 0, place.cx, place.cy, place.size * 0.75);
      g.addColorStop(0, `rgba(${tint[0]},${tint[1]},${tint[2]},0.24)`);
      g.addColorStop(1, `rgba(${tint[0]},${tint[1]},${tint[2]},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(place.cx - place.size, place.cy - place.size, place.size * 2, place.size * 2);
    }

    ctx.globalCompositeOperation = "source-over";

    // current running up the rail, brightest on the active card's wire
    for (let i = 0; i < flows.length; i++) {
      const f = at(flows, i);
      const hot = i === active ? 1 : 0;
      const tint = at(TINTS, i);
      for (const d of f) {
        if (!still) {
          d.u += d.v * dt * (1 + 2.6 * hot);
          if (d.u > 1) d.u -= 1;
        }
        const pt = pointAt(at(l.wires, i), 1 - d.u);
        ctx.fillStyle = `rgba(${tint[0]},${tint[1]},${tint[2]},${0.55 + 0.4 * hot})`;
        ctx.beginPath();
        ctx.arc(pt[0], pt[1], 1.6 + hot * 0.9, 0, 6.2832);
        ctx.fill();
      }
    }

    let additive = false;
    for (let i = 0; i < count; i++) {
      const p = at(particles, i);
      if (p.amb) {
        if (!additive) {
          // The loose risk specks glow; the emblem dots are opaque so the shapes read cleanly.
          ctx.globalCompositeOperation = "lighter";
          additive = true;
        }
        const d = Math.hypot(p.x - lens.x, p.y - lens.y);
        const weight = d < lensR ? (1 - d / lensR) ** 2 * (3 - 2 * (1 - d / lensR)) : 0;
        if (!still) {
          const ang = Math.sin(p.x * 0.0045 + t * 0.25 + p.s1) * 2.6 + Math.cos(p.y * 0.005 - t * 0.2 + p.s2) * 2.6;
          const drift = 22 * p.sp * (1 - weight);
          p.x += Math.cos(ang) * drift * dt;
          p.y += Math.sin(ang) * drift * dt;
          if (weight > 0.001) {
            const hexS = 24;
            const tx = Math.round(p.x / hexS) * hexS;
            const ty = Math.round(p.y / (hexS * 0.866)) * hexS * 0.866;
            const k = (1 - Math.exp(-dt * 9 * (0.6 + 0.4 * p.sp))) * weight;
            p.x += (tx - p.x) * k;
            p.y += (ty - p.y) * k;
          }
          if (p.x < -10) p.x = l.w + 10;
          else if (p.x > l.w + 10) p.x = -10;
          if (p.y < -10) p.y = l.h + 10;
          else if (p.y > l.h + 10) p.y = -10;
          p.pp += (weight - p.pp) * (1 - Math.exp(-dt * (weight > p.pp ? 7 : 0.4)));
        }
        const risk = at(RISK, p.risk);
        const r = risk[0] + (ICE[0] - risk[0]) * p.pp;
        const g = risk[1] + (ICE[1] - risk[1]) * p.pp;
        const b = risk[2] + (ICE[2] - risk[2]) * p.pp;
        ctx.fillStyle = `rgba(${r | 0},${g | 0},${b | 0},${(0.5 + 0.5 * p.pp).toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.2 + 0.5 * p.pp, 0, 6.2832);
        ctx.fill();
        continue;
      }

      if (!p.live && armed && !still) {
        p.delay -= dt;
        if (p.delay <= 0) p.live = true;
      }
      if (!still && p.hold > 0) {
        p.hold -= dt;
        if (p.hold <= 0) p.mode = p.pending;
      }
      const tg = p.targets[p.mode];
      if (!tg) {
        // A dot past this shape's count has no place in it: it fades out where it is.
        p.pp += (0 - p.pp) * (1 - Math.exp(-dt * 6));
        if (p.pp < 0.02) continue;
      } else if (!still) {
        // Dots fly in from wherever they were and settle on the artwork's pixels.
        const weight = p.live ? 1 : 0;
        if (weight > 0) {
          const k = 1 - Math.exp(-dt * 3.4 * (0.6 + 0.4 * p.sp));
          p.x += (tg.x + Math.sin(t * 1.3 + p.s1) * 0.22 - p.x) * k;
          p.y += (tg.y + Math.cos(t * 1.1 + p.s2) * 0.22 - p.y) * k;
        }
        p.pp += (weight - p.pp) * (1 - Math.exp(-dt * 5));
      }

      const hue = tg ?? p.last;
      if (!hue) continue;
      p.last = hue;
      // Dots stay invisible until they are on their way in, so nothing stray shows.
      let alpha = p.pp * p.pp * (p.mode === LOGO_MODE ? (l.stacked ? 0 : 0.4) : 1);
      if (alpha <= 0.01) continue;
      let r = hue.r;
      let g = hue.g;
      let b = hue.b;
      let size = (1.1 + 0.8 * p.pp) * dotScale;
      const bd = Math.abs(p.x - beamX);
      if (bd < 70) {
        const f = 1 - bd / 70;
        alpha = Math.min(1, alpha + 0.3 * f);
        size += 0.5 * f;
        r += (255 - r) * f * 0.55;
        g += (255 - g) * f * 0.55;
        b += (255 - b) * f * 0.55;
      }
      ctx.fillStyle = `rgba(${r | 0},${g | 0},${b | 0},${alpha.toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, size, 0, 6.2832);
      ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";

    if (!still && hoverMode < 0) {
      ctx.strokeStyle = "rgba(190,239,255,0.3)";
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 8]);
      ctx.lineDashOffset = -t * 14;
      ctx.beginPath();
      ctx.arc(lens.x, lens.y, lensR, 0, 6.2832);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  /* ----- loop ----- */

  function frame(ts: number): void {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, Math.max(0.001, (ts - last) / 1000));
    last = ts;
    clock += dt;

    if (!interacted && !reducedMotion && armed) {
      tourClock += dt;
      const t = tourClock;
      tourMode = t < 5 ? -1 : t < 7.6 ? 0 : t < 10.2 ? 1 : t < 12.8 ? 2 : -1;
    }
    syncMode();

    dtAvg = dtAvg * 0.95 + dt * 0.05;
    sinceCheck += dt;
    if (sinceCheck > 1.5) {
      sinceCheck = 0;
      if (dtAvg > 0.026 && quality > 0.5) quality = Math.max(0.5, quality - 0.2);
    }

    paint(clock, dt, false);
    if (!ready && armed) {
      ready = true;
      opts.onReady?.();
    }
  }

  function start(): void {
    if (raf || reducedMotion || !layout) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function stop(): void {
    cancelAnimationFrame(raf);
    raf = 0;
  }

  /* ----- wiring ----- */

  const cardIndex = (target: EventTarget | null): number => {
    if (!(target instanceof Element)) return -1;
    const el = target.closest("[data-pf-card]");
    return el ? cardEls.indexOf(el as HTMLElement) : -1;
  };
  const onOver = (e: PointerEvent): void => {
    const i = cardIndex(e.target);
    if (i >= 0) setHover(i);
  };
  const onOut = (e: PointerEvent): void => {
    if (cardIndex(e.target) >= 0 && cardIndex(e.relatedTarget) !== cardIndex(e.target)) setHover(-1);
  };
  const onFocusIn = (e: FocusEvent): void => {
    const i = cardIndex(e.target);
    if (i >= 0) setHover(i);
  };
  const onFocusOut = (e: FocusEvent): void => {
    if (cardIndex(e.target) >= 0) setHover(-1);
  };
  const onMove = (e: PointerEvent): void => {
    const o = canvas.getBoundingClientRect();
    ptr.x = e.clientX - o.left;
    ptr.y = e.clientY - o.top;
    ptr.on = e.pointerType !== "touch";
  };
  const onLeave = (): void => {
    ptr.on = false;
  };

  root.addEventListener("pointerover", onOver);
  root.addEventListener("pointerout", onOut);
  root.addEventListener("pointermove", onMove);
  root.addEventListener("pointerleave", onLeave);
  root.addEventListener("focusin", onFocusIn);
  root.addEventListener("focusout", onFocusOut);

  let resizeTimer = 0;
  const ro = new ResizeObserver(() => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      applyLayout();
      if (reducedMotion && layout) settle();
    }, 140);
  });
  ro.observe(root);

  const io = new IntersectionObserver(
    (entries) => {
      visible = entries.some((e) => e.isIntersecting);
      if (visible) start();
      else stop();
    },
    { rootMargin: "80px 0px" },
  );
  io.observe(canvas);

  const armObserver = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const shownHeight = Math.min(e.boundingClientRect.height, window.innerHeight) || 1;
        if (e.intersectionRect.height / shownHeight >= 0.45) {
          armed = true;
          armObserver.disconnect();
          return;
        }
      }
    },
    { threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1] },
  );
  if (!reducedMotion) armObserver.observe(canvas);

  void loadStencils()
    .then((loaded) => {
      if (destroyed) return;
      stencils = loaded;
      applyLayout();
      syncMode();
      if (reducedMotion) {
        settle();
        ready = true;
        opts.onReady?.();
      } else if (visible) start();
    })
    .catch(() => undefined);

  return {
    destroy(): void {
      destroyed = true;
      stop();
      window.clearTimeout(resizeTimer);
      ro.disconnect();
      io.disconnect();
      armObserver.disconnect();
      root.removeEventListener("pointerover", onOver);
      root.removeEventListener("pointerout", onOut);
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
      root.removeEventListener("focusin", onFocusIn);
      root.removeEventListener("focusout", onFocusOut);
      for (const el of cardEls) el.removeAttribute("data-active");
    },
  };
}
