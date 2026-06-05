#!/usr/bin/env python3
"""
Update hardcoded static-page meta descriptions in apps/web from the file CSV.

Replaces ONLY the first `description:` string inside the page's
`buildPageMetadata({ ... })` metadata block. Pages with no apps/web route
(junk / not-built / moved) are skipped and reported.

Run: python3 migrations/webflow-import/update-static-meta-desc.py [--apply]
Without --apply it's a dry run.
"""
from __future__ import annotations

import csv
import json
import os
import re
import sys

ROOT = os.path.join(os.path.dirname(__file__), "..", "..")
APP = os.path.join(ROOT, "apps", "web", "src", "app")
CSV = os.path.join(os.path.dirname(__file__), "..", "webflow-export",
                   "meta-desc-static-pages.csv")

# file path -> apps/web route path (when they differ)
ROUTE_OVERRIDE = {"/software-bill-of-materials": "/software-bill-materials"}
# no route on the new site (junk / not-built / moved to CMS or elsewhere)
# /legal is excluded — it's mid-restructure (uncommitted WIP); don't touch.
SKIP = {
    "/about-copy", "/pricing", "/pricing-copy", "/leadership", "/search",
    "/survey", "/cleanstart-raksha-chennai", "/acceptable-use-policy", "/legal",
}

_LIT = r'("(?:[^"\\]|\\.)*"|\'(?:[^\'\\]|\\.)*\')'


def page_file(route: str) -> str:
    sub = "" if route == "/" else route
    return os.path.join(APP, sub.lstrip("/"), "page.tsx")


def replace_desc(text: str, new_desc: str) -> tuple[str, bool]:
    anchor = text.find("buildPageMetadata({")
    if anchor == -1:
        return text, False
    km = re.search(r"description:\s*", text[anchor:])
    if not km:
        return text, False
    pos = anchor + km.end()
    # Case 1: inline string literal (single or double quoted).
    lit = re.match(_LIT, text[pos:])
    if lit:
        return text[:pos] + json.dumps(new_desc) + text[pos + lit.end():], True
    # Case 2: identifier (e.g. DESCRIPTION, or `x ?? FALLBACK_DESCRIPTION`) —
    # rewrite the SCREAMING_CASE const's string definition instead.
    value_line = text[pos:text.find("\n", pos)]
    for ident in reversed(re.findall(r"[A-Z_][A-Z0-9_]{2,}", value_line)):
        cm = re.search(rf"\bconst {re.escape(ident)}\s*=\s*{_LIT}", text)
        if cm:
            return text[:cm.start(1)] + json.dumps(new_desc) + text[cm.end(1):], True
    return text, False


def main() -> None:
    apply = "--apply" in sys.argv
    seen: set[str] = set()
    updated = skipped = noroute = nomatch = 0
    for row in csv.DictReader(open(CSV, encoding="utf-8")):
        path, desc = row["path"], row["meta_description"].strip()
        if path in seen:
            continue
        seen.add(path)
        if path in SKIP:
            skipped += 1
            print(f"  SKIP (no route)   {path}")
            continue
        route = ROUTE_OVERRIDE.get(path, path)
        f = page_file(route)
        if not os.path.exists(f):
            noroute += 1
            print(f"  NO ROUTE          {path}")
            continue
        text = open(f, encoding="utf-8").read()
        new_text, ok = replace_desc(text, desc)
        if not ok:
            nomatch += 1
            print(f"  ⚠ NO buildPageMetadata description  {path} ({f})")
            continue
        if new_text != text:
            if apply:
                open(f, "w", encoding="utf-8").write(new_text)
            updated += 1
            print(f"  {'UPDATED' if apply else 'would-update'}  {path}")
        else:
            print(f"  unchanged         {path}")
    print(f"\n{'APPLIED' if apply else 'DRY RUN'} — updated={updated} "
          f"skipped(no-route)={skipped} no-route={noroute} no-match={nomatch}")


if __name__ == "__main__":
    main()
