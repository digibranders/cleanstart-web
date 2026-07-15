/**
 * Clean Libraries hero scene — an interconnected DEPENDENCY GRAPH, built
 * entirely in SVG/CSS (no raster).
 *
 * Concept: a glowing glass "core" cube at the centre, wrapped in a mesh of
 * library nodes (small isometric cubes + glowing dots) linked by dependency
 * edges, floating in a nebula of particle dust. The hue
 * drifts across the field — magenta on the left, violet through the core,
 * cyan/blue on the right — echoing the reference art. A soft dark core gives the
 * glow contrast against the purple hero without a hard black box.
 *
 * Determinism: node/edge/particle layout is generated once at module scope
 * from a fixed-seed PRNG (mulberry32), so SSR output is stable across builds —
 * no Math.random at render, no hydration drift.
 *
 * Motion (all GPU-composited transform/opacity/offset-path, all disabled under
 * prefers-reduced-motion via globals.css):
 *   - `cs-libhero-breathe` pulses the core bloom;
 *   - `cs-dep-ring` fires shockwave rings out of the core;
 *   - `cs-lib-twinkle` fades a staggered subset of nodes + the particle dust;
 *   - `cs-dep-bob` floats a subset of nodes on desynced phases;
 *   - `cs-lib-packet` rides light pulses along edges (deps resolving);
 *   - `cs-lib-rim` sweeps a glint around the core's energy ring;
 *   - the parent's `cs-libhero-float` drifts the whole scene.
 */

type HueKey = "purple" | "violet" | "blue";

interface HueSpec {
  top: string;
  left: string;
  right: string;
  edge: string;
  dot: string;
  halo: string;
}

interface Node {
  x: number;
  y: number;
  s: number;
  hue: HueKey;
  shape: "cube" | "dot";
  back: boolean;
  twinkle: boolean;
  bob: boolean;
  delay: number;
}

interface Edge {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  hub: boolean;
}

interface Particle {
  x: number;
  y: number;
  r: number;
  o: number;
  twinkle: boolean;
  delay: number;
}

interface Pulse {
  d: string;
  delay: number;
  dur: number;
}

const VB = { w: 900, h: 620 } as const;
const HUB = { x: 442, y: 308 } as const;

const HUE: Record<HueKey, HueSpec> = {
  purple: { top: "#ecc0ff", left: "#b24bff", right: "#7a22d6", edge: "#f4d6ff", dot: "#c561ff", halo: "halo-purple" },
  violet: { top: "#dcc6ff", left: "#8a5cff", right: "#5a2ee0", edge: "#ece1ff", dot: "#9a6bff", halo: "halo-violet" },
  blue: { top: "#c4e6ff", left: "#3f9bff", right: "#1c63d6", edge: "#dff1ff", dot: "#48a6ff", halo: "halo-blue" },
};

function hueForX(x: number): HueKey {
  const t = x / VB.w;
  if (t < 0.37) return "purple";
  if (t > 0.63) return "blue";
  return "violet";
}

/** mulberry32 — tiny deterministic PRNG so the graph is stable across renders. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Local visual centre of a node (iso-cube sits ~22px below its anchor). */
function nodeCenter(n: Node): { x: number; y: number } {
  return { x: n.x, y: n.y + 22 * n.s };
}

const { NODES, EDGES, PARTICLES, PULSES } = ((): {
  NODES: Node[];
  EDGES: Edge[];
  PARTICLES: Particle[];
  PULSES: Pulse[];
} => {
  const rnd = mulberry32(20260715);
  let nodes: Node[] = [];

  const N = 37;
  const rMin = 92;
  const rMax = 392;
  for (let i = 0; i < N; i++) {
    const ang = rnd() * Math.PI * 2;
    const rr = rMin + rnd() ** 0.8 * (rMax - rMin);
    const x = Math.max(40, Math.min(VB.w - 40, HUB.x + Math.cos(ang) * rr * 1.26));
    const y = Math.max(48, Math.min(VB.h - 56, HUB.y + Math.sin(ang) * rr * 0.72));
    const prox = 1 - (rr - rMin) / (rMax - rMin);
    const s = 0.34 + prox * 0.42 + rnd() * 0.12;
    const back = rr > 300 && rnd() > 0.5;
    nodes.push({
      x,
      y,
      s,
      hue: hueForX(x),
      shape: rnd() > 0.42 ? "cube" : "dot",
      back,
      twinkle: rnd() > 0.55,
      bob: !back && rnd() > 0.55,
      delay: rnd() * 3.6,
    });
  }

  // Keep a clear zone around the core cube — drop nodes that would crowd/overlap
  // the central glow (they read as clutter sitting on top of the hub).
  const HUB_CENTER = { x: HUB.x, y: HUB.y + 22 };
  nodes = nodes.filter((n) => Math.hypot(nodeCenter(n).x - HUB_CENTER.x, nodeCenter(n).y - HUB_CENTER.y) > 118);

  // Edges: a real mesh — each node links to its 2 nearest neighbours, and the
  // inner ring links to the hub (the primary dependency spokes).
  const edges: Edge[] = [];
  const seen = new Set<string>();
  const addEdge = (a: { x: number; y: number }, b: { x: number; y: number }, hub: boolean, key: string): void => {
    if (seen.has(key)) return;
    seen.add(key);
    edges.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, hub });
  };

  nodes.forEach((n, i) => {
    const c = nodeCenter(n);
    const dHub = Math.hypot(c.x - HUB.x, c.y - HUB.y);
    if (dHub < 268) addEdge(HUB, c, true, `h-${i}`);

    const neighbours = nodes
      .map((m, j) => ({ m, j, d: j === i ? Number.POSITIVE_INFINITY : Math.hypot(c.x - nodeCenter(m).x, c.y - nodeCenter(m).y) }))
      .sort((p, q) => p.d - q.d)
      .slice(0, 2);
    for (const nb of neighbours) {
      if (nb.d >= 236) continue;
      const key = i < nb.j ? `n-${i}-${nb.j}` : `n-${nb.j}-${i}`;
      addEdge(c, nodeCenter(nb.m), false, key);
    }
  });

  // Particle dust — dense near the core, thinning outward (approx-gaussian).
  const particles: Particle[] = [];
  const gauss = (): number => (rnd() + rnd() + rnd() - 1.5) / 1.5;
  for (let i = 0; i < 104; i++) {
    const gx = gauss();
    const gy = gauss();
    const x = HUB.x + gx * 156;
    const y = HUB.y + gy * 88;
    if (x < 20 || x > VB.w - 20 || y < 20 || y > VB.h - 20) continue;
    const near = 1 - Math.min(1, Math.hypot(gx, gy) / 1.4);
    particles.push({
      x,
      y,
      r: 0.5 + rnd() * 1.4,
      o: 0.18 + near * 0.5,
      twinkle: rnd() > 0.45,
      delay: rnd() * 3.2,
    });
  }

  // Travelling data pulses — the strongest hub spokes flow inward, a scatter of
  // mesh edges flow along, so the whole graph reads "live".
  const hubEdges = edges.filter((e) => e.hub).sort((a, b) => Math.hypot(b.x2 - b.x1, b.y2 - b.y1) - Math.hypot(a.x2 - a.x1, a.y2 - a.y1));
  const meshEdges = edges.filter((e) => !e.hub);
  const pulses: Pulse[] = [];
  hubEdges.slice(0, 7).forEach((e, i) => {
    // hub is (x1,y1); flow inward toward the core.
    pulses.push({ d: `M ${e.x2} ${e.y2} L ${e.x1} ${e.y1}`, delay: i * 0.5, dur: 2.6 + (i % 3) * 0.5 });
  });
  meshEdges.forEach((e, i) => {
    if (i % 3 !== 0) return;
    pulses.push({ d: `M ${e.x1} ${e.y1} L ${e.x2} ${e.y2}`, delay: (i % 5) * 0.7, dur: 3.2 + (i % 4) * 0.4 });
  });

  return { NODES: nodes, EDGES: edges, PARTICLES: particles, PULSES: pulses.slice(0, 13) };
})();

const HUB_CX = HUB.x;
const HUB_CY = HUB.y + 22;

function IsoNode({ n }: { n: Node }): React.ReactElement {
  const c = HUE[n.hue];
  const center = nodeCenter(n);
  const haloR = (n.shape === "cube" ? 20 : 12) * n.s + 6;
  const glyph = (
    <g className={n.twinkle ? "cs-lib-twinkle" : undefined} style={n.twinkle ? { animationDelay: `${n.delay}s` } : undefined}>
      <circle cx={center.x} cy={center.y} r={haloR} fill={`url(#${c.halo})`} />
      {n.shape === "cube" ? (
        <g transform={`translate(${n.x} ${n.y}) scale(${n.s})`}>
          <polygon points="0,0 20,10 0,20 -20,10" fill={c.top} />
          <polygon points="-20,10 0,20 0,44 -20,34" fill={c.left} />
          <polygon points="20,10 0,20 0,44 20,34" fill={c.right} />
          <polyline points="-20,10 0,0 20,10" fill="none" stroke={c.edge} strokeOpacity={0.9} strokeWidth={1} />
          <line x1={0} y1={20} x2={0} y2={44} stroke="#ffffff" strokeOpacity={0.14} strokeWidth={0.7} />
          <circle cx={-6} cy={8} r={1.5} fill="#ffffff" opacity={0.8} />
        </g>
      ) : (
        <>
          <circle cx={center.x} cy={center.y} r={2.4 * n.s + 1} fill={c.dot} />
          <circle cx={center.x} cy={center.y} r={1.1 * n.s + 0.4} fill="#ffffff" opacity={0.9} />
        </>
      )}
    </g>
  );
  if (!n.bob) return glyph;
  return (
    <g className="cs-dep-bob" style={{ animationDelay: `${n.delay}s` }}>
      {glyph}
    </g>
  );
}

export function LibrariesHeroScene(): React.ReactElement {
  return (
    <svg
      viewBox={`0 0 ${VB.w} ${VB.h}`}
      role="img"
      aria-label="An interconnected dependency graph: a glowing glass core cube surrounded by a mesh of library nodes linked by edges, drifting from magenta through violet to cyan"
      preserveAspectRatio="xMidYMid meet"
      className="block h-auto w-full select-none"
      style={{ overflow: "visible" }}
    >
      <defs>
        <radialGradient id="depCoreCloud" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#d06bff" stopOpacity={0.62} />
          <stop offset="34%" stopColor="#8a5cff" stopOpacity={0.34} />
          <stop offset="70%" stopColor="#5a4bff" stopOpacity={0.12} />
          <stop offset="100%" stopColor="#5a4bff" stopOpacity={0} />
        </radialGradient>
        <radialGradient id="depCoreCore" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity={0.78} />
          <stop offset="24%" stopColor="#eccfff" stopOpacity={0.44} />
          <stop offset="100%" stopColor="#c98bff" stopOpacity={0} />
        </radialGradient>

        <radialGradient id="halo-purple" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#c561ff" stopOpacity={0.85} />
          <stop offset="100%" stopColor="#c561ff" stopOpacity={0} />
        </radialGradient>
        <radialGradient id="halo-violet" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#9a6bff" stopOpacity={0.85} />
          <stop offset="100%" stopColor="#9a6bff" stopOpacity={0} />
        </radialGradient>
        <radialGradient id="halo-blue" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#48a6ff" stopOpacity={0.85} />
          <stop offset="100%" stopColor="#48a6ff" stopOpacity={0} />
        </radialGradient>

        <linearGradient id="depHubTop" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e3c9ff" />
        </linearGradient>
        <linearGradient id="depHubLeft" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c79bff" />
          <stop offset="100%" stopColor="#7c46e6" />
        </linearGradient>
        <linearGradient id="depHubRight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8a54e8" />
          <stop offset="100%" stopColor="#4f27bf" />
        </linearGradient>
        <linearGradient id="depEdge" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#b06bff" stopOpacity={0.7} />
          <stop offset="50%" stopColor="#8aa0ff" stopOpacity={0.5} />
          <stop offset="100%" stopColor="#5ab6ff" stopOpacity={0.7} />
        </linearGradient>

        <filter id="depBloom" x="-120%" y="-120%" width="340%" height="340%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
        <filter id="depBackBlur" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2.6" />
        </filter>
      </defs>

      <g
        className="cs-libhero-breathe"
        style={{ transformOrigin: `${HUB.x}px ${HUB.y}px`, transformBox: "fill-box" } as React.CSSProperties}
      >
        <ellipse cx={HUB.x} cy={HUB.y} rx={300} ry={210} fill="url(#depCoreCloud)" />
      </g>

      {/* Dependency edges — faint mesh behind the nodes. */}
      <g fill="none" strokeLinecap="round">
        {EDGES.map((e, i) => (
          <line
            key={`e-${i}`}
            x1={e.x1}
            y1={e.y1}
            x2={e.x2}
            y2={e.y2}
            stroke="url(#depEdge)"
            strokeWidth={e.hub ? 1.15 : 0.85}
            strokeOpacity={e.hub ? 0.34 : 0.2}
          />
        ))}
      </g>

      {/* Distant nodes — blurred + dimmed for depth. */}
      <g filter="url(#depBackBlur)" opacity={0.55}>
        {NODES.filter((n) => n.back).map((n, i) => (
          <IsoNode key={`bn-${i}`} n={n} />
        ))}
      </g>

      {/* Particle dust field. */}
      {PARTICLES.map((p, i) => (
        <circle
          key={`p-${i}`}
          cx={p.x}
          cy={p.y}
          r={p.r}
          fill="#d8e6ff"
          className={p.twinkle ? "cs-lib-twinkle" : undefined}
          style={{ opacity: p.o, animationDelay: `${p.delay}s` }}
        />
      ))}

      {/* Foreground nodes. */}
      {NODES.filter((n) => !n.back).map((n, i) => (
        <IsoNode key={`fn-${i}`} n={n} />
      ))}

      {/* Travelling data pulses across the graph. */}
      {PULSES.map((p, i) => (
        <g key={`pulse-${i}`} className="cs-lib-packet" style={{ offsetPath: `path('${p.d}')`, animationDuration: `${p.dur}s`, animationDelay: `${p.delay}s` } as React.CSSProperties}>
          <circle r={5} fill="url(#halo-violet)" filter="url(#depBloom)" />
          <circle r={1.8} fill="#f2e9ff" />
        </g>
      ))}

      {/* Verified glass core — shockwave rings, breathing bloom, layered crystal
          cube, energy ring + light burst. */}
      {[0, 1.55, 3.1].map((delay, i) => (
        <circle
          key={`ring-${i}`}
          cx={HUB_CX}
          cy={HUB_CY}
          r={58}
          fill="none"
          stroke="#d9b8ff"
          strokeWidth={1.4}
          strokeOpacity={0.5}
          className="cs-dep-ring"
          style={{ animationDelay: `${delay}s` }}
        />
      ))}

      <g className="cs-libhero-breathe" style={{ transformOrigin: `${HUB.x}px ${HUB.y}px`, transformBox: "fill-box" } as React.CSSProperties}>
        <circle cx={HUB_CX} cy={HUB_CY} r={104} fill="url(#depCoreCore)" />
      </g>

      <ellipse
        cx={HUB_CX}
        cy={HUB_CY}
        rx={76}
        ry={72}
        fill="none"
        stroke="#e7d4ff"
        strokeWidth={2}
        strokeLinecap="round"
        strokeDasharray="28 440"
        strokeOpacity={0.7}
        className="cs-lib-rim"
      />

      {/* Outer glass cube — translucent faces, bright edges. */}
      <g transform={`translate(${HUB.x} ${HUB.y - 26}) scale(2.2)`}>
        <polyline points="-20,10 0,20 20,10" fill="none" stroke="#e7d4ff" strokeOpacity={0.4} strokeWidth={0.7} />
        <line x1={0} y1={20} x2={0} y2={44} stroke="#e7d4ff" strokeOpacity={0.32} strokeWidth={0.7} />
        <polygon points="0,0 20,10 0,20 -20,10" fill="url(#depHubTop)" fillOpacity={0.58} />
        <polygon points="-20,10 0,20 0,44 -20,34" fill="url(#depHubLeft)" fillOpacity={0.4} />
        <polygon points="20,10 0,20 0,44 20,34" fill="url(#depHubRight)" fillOpacity={0.4} />
        <polyline points="-20,34 0,44 20,34" fill="none" stroke="#ffffff" strokeOpacity={0.5} strokeWidth={0.8} />
        <polyline points="-20,10 0,0 20,10" fill="none" stroke="#ffffff" strokeOpacity={0.95} strokeWidth={1.3} />
        <line x1={-20} y1={10} x2={-20} y2={34} stroke="#ffffff" strokeOpacity={0.55} strokeWidth={0.85} />
        <line x1={20} y1={10} x2={20} y2={34} stroke="#ffffff" strokeOpacity={0.55} strokeWidth={0.85} />
      </g>

      {/* Inner crystal — brighter, denser. */}
      <g transform={`translate(${HUB.x} ${HUB.y - 4}) scale(1.18)`}>
        <polygon points="0,0 20,10 0,20 -20,10" fill="url(#depHubTop)" fillOpacity={0.96} />
        <polygon points="-20,10 0,20 0,44 -20,34" fill="url(#depHubLeft)" fillOpacity={0.88} />
        <polygon points="20,10 0,20 0,44 20,34" fill="url(#depHubRight)" fillOpacity={0.88} />
        <polyline points="-20,10 0,0 20,10" fill="none" stroke="#ffffff" strokeWidth={1.2} />
        <circle cx={-6} cy={7} r={1.8} fill="#ffffff" />
      </g>

      {/* Hot centre + light burst. */}
      <g className="cs-lib-twinkle" style={{ transformOrigin: `${HUB_CX}px ${HUB_CY}px` }}>
        <g stroke="#ffffff" strokeOpacity={0.85} strokeLinecap="round">
          <line x1={HUB_CX - 24} y1={HUB_CY} x2={HUB_CX + 24} y2={HUB_CY} strokeWidth={1} />
          <line x1={HUB_CX} y1={HUB_CY - 22} x2={HUB_CX} y2={HUB_CY + 22} strokeWidth={1} />
          <line x1={HUB_CX - 14} y1={HUB_CY - 12} x2={HUB_CX + 14} y2={HUB_CY + 12} strokeWidth={0.7} strokeOpacity={0.5} />
          <line x1={HUB_CX - 14} y1={HUB_CY + 12} x2={HUB_CX + 14} y2={HUB_CY - 12} strokeWidth={0.7} strokeOpacity={0.5} />
        </g>
        <circle cx={HUB_CX} cy={HUB_CY} r={5} fill="#ffffff" />
      </g>
    </svg>
  );
}
