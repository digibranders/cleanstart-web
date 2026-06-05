#!/usr/bin/env python3
"""
Merge the authoritative Webflow redirect export with the live-probe results into
a single enriched dataset for the Redirects sheet.

Inputs:
  migrations/webflow-export/webflow-redirects-export.csv  (authoritative, from
    Webflow admin → Publishing → 301 Redirects → Export; 'source,target')
  migrations/webflow-export/redirects.json                (live-probe results;
    used to flag which sources are live-verified + the structural CF redirects)

Output: migrations/webflow-export/redirects-final.json
  - Resolves redirect CHAINS to a final destination (cycle-guarded).
  - Flags live_verified (probe actually saw the 301).
  - Keeps the 2 structural (Cloudflare/host) redirects from the probe.

Run: python3 migrations/webflow-import/build-redirects-data.py
"""
from __future__ import annotations

import csv
import json
import os

BASE = os.path.join(os.path.dirname(__file__), "..", "webflow-export")
CSV_IN = os.path.join(BASE, "webflow-redirects-export.csv")
PROBE = os.path.join(BASE, "redirects.json")
OUT = os.path.join(BASE, "redirects-final.json")


def norm(p: str) -> str:
    p = (p or "").strip()
    # compare on path only (strip host for self-targets)
    if p.startswith("https://www.cleanstart.com"):
        rest = p[len("https://www.cleanstart.com"):]
        return rest or "/"
    return p


def resolve_chain(source: str, mapping: dict[str, str]) -> tuple[str, int]:
    """Follow target → (target as source) until it no longer maps. Cycle-guarded."""
    seen = {source}
    cur = mapping[source]
    hops = 1
    while True:
        key = norm(cur)
        if key in mapping and key not in seen:
            seen.add(key)
            cur = mapping[key]
            hops += 1
        else:
            return cur, hops


def main() -> None:
    rows = list(csv.DictReader(open(CSV_IN, encoding="utf-8")))
    mapping = {r["source"].strip(): r["target"].strip() for r in rows}

    probe = json.load(open(PROBE, encoding="utf-8")) if os.path.exists(PROBE) else {"redirects": []}
    probed_sources = {r["source"] for r in probe.get("redirects", [])}
    structural = [r for r in probe.get("redirects", [])
                  if r.get("category", "").startswith("Cloudflare")]
    # Cloudflare dashboard verified 2026-06-05 (browser): 0 Redirect Rules,
    # 0 Page Rules, 0 Bulk-Redirect lists. So the apex→www redirect is Webflow's
    # default-domain redirect (www is the Webflow default), not a Cloudflare rule.
    for s in structural:
        if "apex" in s.get("category", ""):
            s["category"] = "Webflow default-domain (apex→www)"
        elif "HTTP" in s.get("category", ""):
            s["category"] = "Cloudflare Always-Use-HTTPS (setting)"

    entries = []
    for r in rows:
        src = r["source"].strip()
        tgt = r["target"].strip()
        final, hops = resolve_chain(src, mapping)
        entries.append({
            "source": src,
            "configured_target": tgt,
            "final_destination": final,
            "hops": hops,
            "status": 301,
            "layer": "Webflow",
            "live_verified": src in probed_sources,
            "chain": hops > 1,
        })
    entries.sort(key=lambda e: e["source"])

    payload = {
        "checked_at": "2026-06-05",
        "authoritative_source": "Webflow admin → Publishing → 301 Redirects (Export)",
        "webflow_count": len(entries),
        "structural": [
            {"source": s["source"], "configured_target": s.get("location"),
             "final_destination": s.get("final_url"), "hops": 1, "status": s.get("status"),
             "layer": s.get("category"), "live_verified": True, "chain": False}
            for s in structural
        ],
        "redirects": entries,
        "cloudflare_layer": ("Verified 2026-06-05 (dashboard): 0 Redirect Rules, "
                             "0 Page Rules, 0 Bulk-Redirect lists — no Cloudflare "
                             "custom redirects. apex→www is Webflow's default-domain "
                             "redirect; HTTP→HTTPS is Always-Use-HTTPS."),
    }
    json.dump(payload, open(OUT, "w"), indent=2)
    chains = [e for e in entries if e["chain"]]
    print(f"[redirects] {len(entries)} Webflow + {len(payload['structural'])} structural "
          f"→ {OUT}")
    print(f"  redirect chains (collapsed to final): {len(chains)}")
    for e in chains:
        print(f"    {e['source']} -> {e['configured_target']} -> ... -> {e['final_destination']} ({e['hops']} hops)")


if __name__ == "__main__":
    main()
