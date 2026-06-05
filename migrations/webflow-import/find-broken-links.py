#!/usr/bin/env python3
"""
Crawl the live Webflow site and list every broken internal URL.

Strategy:
  1. Seed from sitemap.xml (all canonical live pages).
  2. Fetch each page, extract internal <a href> links.
  3. Probe every unique internal target (HEAD, no-redirect).
  4. Classify: 200 ok | 3xx redirect | 404/410/5xx/error = BROKEN.
  5. Record which source pages link to each broken target.

Output: migrations/webflow-export/broken-links.json
Run: python3 migrations/webflow-import/find-broken-links.py
"""
from __future__ import annotations

import json
import os
import re
import urllib.error
import urllib.request
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor

BASE = "https://www.cleanstart.com"
HOSTS = ("https://www.cleanstart.com", "https://cleanstart.com", "http://www.cleanstart.com", "http://cleanstart.com")
OUT = os.path.join(os.path.dirname(__file__), "..", "webflow-export", "broken-links.json")
UA = {"User-Agent": "Mozilla/5.0 (cleanstart-broken-link-audit)"}


class _NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *a, **k):
        return None


def fetch(url: str) -> str | None:
    try:
        return urllib.request.urlopen(
            urllib.request.Request(url, headers=UA), timeout=25).read().decode("utf-8", "replace")
    except Exception:
        return None


def head(url: str):
    op = urllib.request.build_opener(_NoRedirect)
    try:
        r = op.open(urllib.request.Request(url, method="HEAD", headers=UA), timeout=20)
        return r.status, r.headers.get("Location")
    except urllib.error.HTTPError as e:
        return e.code, e.headers.get("Location")
    except Exception as e:  # noqa: BLE001
        return None, str(e)[:40]


def normalize(href: str) -> str | None:
    href = href.strip()
    if not href or href.startswith(("#", "mailto:", "tel:", "javascript:", "data:")):
        return None
    for h in HOSTS:
        if href.startswith(h):
            href = href[len(h):] or "/"
            break
    if href.startswith("http"):
        return None  # external
    if not href.startswith("/"):
        return None  # anchors / relative fragments we don't resolve
    href = href.split("#")[0].split("?")[0]
    if len(href) > 1 and href.endswith("/"):
        href = href[:-1]
    return href or "/"


def extract_links(html: str) -> set[str]:
    out: set[str] = set()
    for m in re.findall(r'<a\b[^>]*href=["\']([^"\']+)["\']', html, re.I):
        n = normalize(m)
        if n:
            out.add(n)
    return out


def main() -> None:
    sm = fetch(BASE + "/sitemap.xml") or ""
    pages = sorted({re.sub(r"^https?://[^/]+", "", l.strip()) or "/"
                    for l in re.findall(r"<loc>(.*?)</loc>", sm)})
    print(f"[crawl] {len(pages)} sitemap pages")

    # 1. crawl pages → collect internal links + who links to them
    linkers: dict[str, set[str]] = defaultdict(set)

    def crawl(path: str):
        html = fetch(BASE + path)
        if not html:
            return path, set()
        return path, extract_links(html)

    with ThreadPoolExecutor(max_workers=10) as ex:
        for src, links in ex.map(crawl, pages):
            for tgt in links:
                linkers[tgt].add(src)

    targets = sorted(linkers)
    print(f"[crawl] {len(targets)} unique internal link targets to check")

    # 2. probe each target
    with ThreadPoolExecutor(max_workers=12) as ex:
        statuses = dict(zip(targets, ex.map(lambda t: head(BASE + t), targets)))

    broken, redirected = [], []
    for t in targets:
        st, loc = statuses[t]
        rec = {"url": t, "status": st, "location": loc,
               "linked_from": sorted(linkers[t])[:25], "link_count": len(linkers[t])}
        if st is None or st >= 400:
            broken.append(rec)
        elif 300 <= st < 400:
            redirected.append(rec)

    # 3. also confirm sitemap pages themselves resolve
    with ThreadPoolExecutor(max_workers=12) as ex:
        page_status = dict(zip(pages, ex.map(lambda p: head(BASE + p), pages)))
    sitemap_broken = [{"url": p, "status": s} for p, (s, _) in page_status.items()
                      if s is None or s >= 400]

    payload = {
        "checked_at": "2026-06-05",
        "host": BASE,
        "sitemap_pages": len(pages),
        "internal_targets_checked": len(targets),
        "broken": sorted(broken, key=lambda x: x["url"]),
        "redirected_internal_links": sorted(redirected, key=lambda x: x["url"]),
        "sitemap_pages_broken": sitemap_broken,
        "counts": {"broken": len(broken), "redirected": len(redirected),
                   "sitemap_broken": len(sitemap_broken)},
    }
    json.dump(payload, open(OUT, "w"), indent=2)
    print(f"\n[result] broken internal links: {len(broken)} | "
          f"internal links that redirect: {len(redirected)} | "
          f"sitemap pages broken: {len(sitemap_broken)}")
    for b in payload["broken"]:
        print(f"  {str(b['status']):4} {b['url']}  (linked from {b['link_count']} page(s))")


if __name__ == "__main__":
    main()
