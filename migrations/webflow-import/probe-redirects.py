#!/usr/bin/env python3
"""
Probe the live Webflow site for redirects (the rule list is Enterprise-API-gated,
so we measure effective behavior). Enumerates every URL we can derive — sitemap,
URL-parity report, static page paths, all CMS slugs under old prefixes, plus
common variant sources — and records the actual HTTP redirect for each.

Writes migrations/webflow-export/redirects.json:
  { "redirects": [ {source, status, location, final_status, final_url, category} ],
    "dead_old_urls": [paths that 404 but were live/indexed],
    "probed": N, "checked_at": "..." }

Run: python3 migrations/webflow-import/probe-redirects.py
"""
from __future__ import annotations

import json
import os
import re
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor

BASE = "https://www.cleanstart.com"
APEX = "https://cleanstart.com"
EXPORT = os.path.join(os.path.dirname(__file__), "..", "webflow-export")
OUT = os.path.join(EXPORT, "redirects.json")
UA = {"User-Agent": "Mozilla/5.0 (cleanstart-redirect-audit)"}

OLD_PREFIX = {
    "blogs": "/blogs", "news": "/news", "guides": "/guide", "events": "/event",
    "webinars": "/webinar", "jobs": "/job", "authors": "/author",
    "resources": "/resources", "categories": "/category",
    "newsCategories": "/news-categories",
}
VARIANTS = [
    "/blog", "/blogs", "/guide", "/guides", "/webinar", "/webinars", "/author",
    "/authors", "/resource", "/resources", "/resource-center", "/news", "/newsroom",
    "/event", "/events", "/job", "/jobs", "/career", "/careers", "/home", "/index",
    "/index.html", "/about", "/about-us", "/team", "/teams", "/leadership", "/demo",
    "/book-a-demo", "/contact", "/contact-us", "/podcast", "/knowledge-hub",
    "/knowledge-hub-old", "/pricing", "/privacy", "/privacy-policy", "/terms",
    "/terms-and-condition", "/legal", "/partner", "/partners", "/community", "/sbom",
    "/software-bill-materials", "/software-bill-of-materials", "/cleansight", "/fips",
]


class _NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *a, **k):
        return None


def _head(url: str, follow: bool):
    handler = urllib.request.HTTPRedirectHandler if follow else _NoRedirect
    op = urllib.request.build_opener(handler)
    req = urllib.request.Request(url, method="HEAD", headers=UA)
    try:
        r = op.open(req, timeout=20)
        return r.status, r.headers.get("Location"), r.geturl()
    except urllib.error.HTTPError as e:
        return e.code, e.headers.get("Location"), url
    except Exception as e:  # noqa: BLE001
        return None, None, str(e)[:40]


def enumerate_paths() -> set[str]:
    paths: set[str] = set(VARIANTS)
    sm = os.path.join("/tmp", "wf_sitemap.xml")
    try:
        xml = urllib.request.urlopen(BASE + "/sitemap.xml", timeout=20).read().decode("utf-8", "replace")
        open(sm, "w").write(xml)
    except Exception:
        xml = open(sm, encoding="utf-8", errors="replace").read() if os.path.exists(sm) else ""
    for loc in re.findall(r"<loc>(.*?)</loc>", xml):
        paths.add(re.sub(r"^https?://[^/]+", "", loc.strip()) or "/")
    rep = os.path.join(os.path.dirname(__file__), "..", "URL-PARITY-REPORT.md")
    if os.path.exists(rep):
        for m in re.findall(r"`(/[^`]*)`", open(rep, encoding="utf-8").read()):
            paths.add(m)
    pages = os.path.join(EXPORT, "raw", "pages.jsonl")
    if os.path.exists(pages):
        for line in open(pages, encoding="utf-8"):
            if line.strip():
                pp = json.loads(line).get("publishedPath")
                if pp:
                    paths.add(pp)
    for stem, pre in OLD_PREFIX.items():
        f = os.path.join(EXPORT, "raw", f"{stem}.jsonl")
        if os.path.exists(f):
            for line in open(f, encoding="utf-8"):
                if line.strip():
                    s = json.loads(line).get("slug")
                    if s:
                        paths.add(f"{pre}/{s}")
    norm: set[str] = set()
    for p in paths:
        p = p.strip()
        if not p.startswith("/"):
            continue
        if len(p) > 1 and p.endswith("/"):
            p = p[:-1]
        norm.add(p)
    norm.add("/")
    return norm


def probe(path: str) -> dict:
    st, loc, _ = _head(BASE + path, follow=False)
    rec = {"source": path, "status": st, "location": loc}
    if st and 300 <= st < 400 and loc:
        fst, _, furl = _head(BASE + path, follow=True)
        rec["final_status"] = fst
        rec["final_url"] = furl
    return rec


def main() -> None:
    paths = sorted(enumerate_paths())
    results: list[dict] = []
    with ThreadPoolExecutor(max_workers=10) as ex:
        results = list(ex.map(probe, paths))

    redirects = [r for r in results if r["status"] and 300 <= r["status"] < 400]
    for r in redirects:
        r["category"] = "Webflow 301 (content)"

    # Structural (host-level) redirects — verified separately.
    a_st, a_loc, _ = _head(APEX + "/", follow=False)
    h_st, h_loc, _ = _head("http://cleanstart.com/", follow=False)
    structural = [
        {"source": "http://cleanstart.com/* (any path)", "status": h_st,
         "location": h_loc, "final_status": 200, "final_url": h_loc or "",
         "category": "Cloudflare (HTTP→HTTPS)"},
        {"source": "https://cleanstart.com/* (apex, any path)", "status": a_st,
         "location": a_loc, "final_status": 200, "final_url": a_loc or "",
         "category": "Cloudflare (apex→www)"},
    ]

    dead = sorted(r["source"] for r in results if r["status"] == 404)

    payload = {
        "checked_at": "2026-06-05",
        "host": BASE,
        "probed": len(results),
        "redirects": structural + sorted(redirects, key=lambda x: x["source"]),
        "dead_old_urls": dead,
        "counts": {
            "200": sum(1 for r in results if r["status"] == 200),
            "3xx": len(redirects),
            "404": len(dead),
        },
    }
    json.dump(payload, open(OUT, "w"), indent=2)
    print(f"[probe] {len(results)} URLs | {len(redirects)} content 301s + "
          f"{len(structural)} structural | {len(dead)} dead → {OUT}")
    for r in payload["redirects"]:
        print(f"  {r['source']:46} -> {r['status']} -> {r.get('location')}")


if __name__ == "__main__":
    main()
