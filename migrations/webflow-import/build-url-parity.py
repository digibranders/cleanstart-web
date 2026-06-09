#!/usr/bin/env python3
"""
URL parity audit: for every OLD live URL (current Webflow sitemap), determine what
happens on the NEW Next.js site — exists at same path / redirected / would 404.

Inputs:
  - live sitemap.xml (old indexed URLs)
  - apps/web/src/app routes (new site: static routes + dynamic [slug] prefixes)
  - seo-extract.csv (CMS slugs per collection — what detail pages exist)
  - webflow-redirects-export.csv (the 26 authoritative redirect sources)

Output: migrations/webflow-export/url-parity.json
Run: python3 migrations/webflow-import/build-url-parity.py
"""
from __future__ import annotations

import csv
import json
import os
import re
import urllib.request

ROOT = os.path.join(os.path.dirname(__file__), "..", "..")
APP = os.path.join(ROOT, "apps", "web", "src", "app")
EXPORT = os.path.join(os.path.dirname(__file__), "..", "webflow-export")
OUT = os.path.join(EXPORT, "url-parity.json")
BASE = "https://www.cleanstart.com"
UA = {"User-Agent": "Mozilla/5.0 (url-parity-audit)"}

# old URL first-segment prefix -> CMS collection (export stem)
PREFIX_COLL = {
    "/blogs": "blogs", "/news": "news", "/guide": "guides", "/event": "events",
    "/events": "events", "/resources": "resources", "/webinar": "webinars",
    "/job": "jobs", "/author": "authors", "/category": "categories",
    "/news-categories": "newsCategories",
}


def new_routes() -> tuple[set[str], set[str]]:
    static, dynamic = set(), set()
    for dirpath, _dirs, files in os.walk(APP):
        if "page.tsx" not in files:
            continue
        rel = dirpath[len(APP):]
        if "[collection]" in rel or "/preview" in rel:
            continue
        if "[" in rel:  # dynamic detail route
            prefix = rel.split("/[")[0] or "/"
            dynamic.add(prefix)
        else:
            static.add(rel or "/")
    return static, dynamic


def cms_slugs() -> dict[str, set[str]]:
    out: dict[str, set[str]] = {}
    with open(os.path.join(EXPORT, "seo-extract.csv"), encoding="utf-8") as fh:
        for row in csv.DictReader(fh):
            out.setdefault(row["collection"], set()).add(row["slug"].strip())
    return out


def old_urls() -> list[str]:
    try:
        xml = urllib.request.urlopen(
            urllib.request.Request(BASE + "/sitemap.xml", headers=UA), timeout=25
        ).read().decode("utf-8", "replace")
        open("/tmp/wf_sitemap.xml", "w").write(xml)
    except Exception:
        xml = open("/tmp/wf_sitemap.xml", encoding="utf-8", errors="replace").read()
    urls = set()
    for loc in re.findall(r"<loc>(.*?)</loc>", xml):
        p = re.sub(r"^https?://[^/]+", "", loc.strip()) or "/"
        if len(p) > 1 and p.endswith("/"):
            p = p[:-1]
        urls.add(p)
    return sorted(urls)


def main() -> None:
    static, dynamic = new_routes()
    slugs = cms_slugs()
    redirect_src = {r["source"].strip() for r in
                    csv.DictReader(open(os.path.join(EXPORT, "webflow-redirects-export.csv"), encoding="utf-8"))}
    olds = old_urls()

    rows = []
    for u in olds:
        seg1 = "/" + u.split("/")[1] if u != "/" else "/"
        slug = u[len(seg1) + 1:] if u != seg1 else ""
        if u in static or u == "/":
            status, detail = "OK", "static route exists"
        elif seg1 in dynamic and seg1 in PREFIX_COLL and slug in slugs.get(PREFIX_COLL[seg1], set()):
            status, detail = "OK", f"CMS detail route ({seg1}/[slug]) + slug exists"
        elif seg1 in dynamic and slug:
            status, detail = "CHECK", f"detail route {seg1}/[slug] exists but slug not in CMS export"
        elif seg1 in PREFIX_COLL and PREFIX_COLL[seg1] in slugs and slug:
            status, detail = "404 RISK", f"no {seg1}/[slug] detail route on new site"
        elif u in redirect_src:
            status, detail = "REDIRECT", "covered by a Webflow 301 (seed into new redirects table)"
        else:
            status, detail = "404 RISK", "no matching new-site route and no redirect"
        # a redirect can also rescue a 404-risk
        if status == "404 RISK" and u in redirect_src:
            status, detail = "REDIRECT", "covered by a Webflow 301"
        rows.append({"old_url": u, "status": status, "detail": detail})

    from collections import Counter
    counts = Counter(r["status"] for r in rows)
    payload = {
        "checked_at": "2026-06-05",
        "old_urls_from": "live sitemap.xml",
        "old_url_count": len(olds),
        "counts": dict(counts),
        "rows": rows,
    }
    json.dump(payload, open(OUT, "w"), indent=2)
    print(f"[parity] {len(olds)} old URLs → {dict(counts)}  → {OUT}")
    for r in rows:
        if r["status"] in ("404 RISK", "CHECK"):
            print(f"  {r['status']:9} {r['old_url']:55} {r['detail']}")


if __name__ == "__main__":
    main()
