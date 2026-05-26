"""Generate docs/CTA-INVENTORY.csv — full audit of every Hero + Footer CTA on apps/web."""
import csv

ROWS = [
    ("Product pages",),
    ("/", "Hero", "Browse Images", "https://images.cleanstart.com (new tab)", "https://images.cleanstart.com  [target=_blank]", "Keep — already correct"),
    ("/", "Footer CTA", "Get a Demo", "/book-a-demo", "/book-a-demo", "Keep — already correct"),
    ("/cleansight", "Hero", "Get a Demo", "/contact-us", "/book-a-demo?product=cleansight", "Commercial intent — route to demo, not generic contact"),
    ("/cleansight", "Footer CTA", "Book a Container Scan", "/contact-us", "/book-a-demo?product=cleansight", "Same — book-a-demo carries the lead form"),
    ("/cleanstart-images", "Hero", "Explore Images", "#explore-images", "https://images.cleanstart.com  [target=_blank]", "In-page anchor was broken; send to live catalog"),
    ("/cleanstart-images", "Footer CTA", "Explore Hardened Images", "/cleanstart-images", "https://images.cleanstart.com  [target=_blank]", "Self-link → external catalog"),
    ("/for-developers", "Hero", "Explore CleanStart Images", "/cleanstart-images", "https://images.cleanstart.com  [target=_blank]", "Developers want the live catalog"),
    ("/for-developers", "Footer CTA", "Read the Guide", "/cleanstart-images", "/resource-center?audience=developers", "Guide content lives in Resource Center"),
    ("/for-ciso", "Hero", "Explore Free Secure Image", "/cleanstart-images", "https://images.cleanstart.com  [target=_blank]", "External catalog"),
    ("/for-ciso", "Footer CTA", "Read the Executive Brief", "/contact-us", "/resource-center?type=brief", "Brief is a downloadable resource"),
    ("/teams", "Hero", "(no CTA present)", "—", "Add: 'Get a Demo' → /book-a-demo", "Hero currently has no CTA — add primary"),
    ("/teams", "Footer CTA", "Careers", "/careers", "/careers", "Keep"),
    ("/fips", "Hero", "Explore FIPS Images", "/cleanstart-images", "https://images.cleanstart.com?filter=fips  [target=_blank]", "Pre-filter the catalog to FIPS images"),
    ("/fips", "Footer CTA", "Get a Demo", "/book-a-demo", "/book-a-demo?product=fips", "Add product tag for routing"),
    ("/software-bill-materials", "Hero", "Watch How SBOM Works", "/contact-us", "/book-a-demo?product=sbom", "Demo carries the watch-it-work intent"),
    ("/software-bill-materials", "Footer CTA", "Download the SBOM Datasheet", "/contact-us", "/resource-center?type=datasheet&topic=sbom", "Datasheet = gated resource"),
    ("/software-composition-analysis", "Hero", "Watch How SCA Works", "/contact-us", "/book-a-demo?product=sca", ""),
    ("/software-composition-analysis", "Footer CTA", "Make SCA Actionable", "/contact-us", "/book-a-demo?product=sca", ""),
    ("/attack-surface-reduction", "Hero", "Explore Cleanstart Images", "/cleanstart-images", "https://images.cleanstart.com  [target=_blank]", "External catalog"),
    ("/attack-surface-reduction", "Footer CTA", "Attack Surface Reduction", "/book-a-demo", "/book-a-demo?product=asr", "Add product tag"),
    ("/vulnerability-remediation", "Hero", "Explore Images", "/cleanstart-images", "https://images.cleanstart.com  [target=_blank]", "External catalog"),
    ("/vulnerability-remediation", "Footer CTA", "Assess Your Container Exposure", "/contact-us", "/book-a-demo?product=vuln", "Demo intent"),

    ("Company / conversion pages",),
    ("/about-us", "Hero", "Contact Us", "#contact", "/contact-us", "Broken anchor → real page"),
    ("/about-us", "Footer CTA (card 1)", "Contact Sales", "#contact", "/contact-us", "Broken anchor → real page"),
    ("/about-us", "Footer CTA (card 2)", "How it works", "#how-it-works", "/cleansight", "Broken anchor → product overview (currently commented out in JSX)"),
    ("/about-us", "Footer CTA (card 3)", "Careers", "#careers", "/careers", "Broken anchor → real page"),
    ("/careers", "Hero", "(search input only — no nav CTA)", "—", "—", "n/a — listing"),
    ("/partners", "Hero", "Get a Demo", "/book-a-demo", "/book-a-demo", "Keep"),
    ("/partners", "Hero", "Deal Registration", "/deal-registration", "/deal-registration", "Keep"),
    ("/community", "Hero", "Join Community", "#join", "https://github.com/cleanstart  [target=_blank]", "Broken anchor → GitHub org"),
    ("/community", "Footer CTA", "Join the Community", "#join", "https://github.com/cleanstart  [target=_blank]", "Broken anchor → GitHub org"),
    ("/contact-us", "Hero", "(form page)", "—", "—", "n/a"),
    ("/book-a-demo", "Hero", "(form page)", "—", "—", "n/a"),

    ("Content / listing pages",),
    ("/blogs", "Hero", "(listing only)", "—", "—", "n/a"),
    ("/blogs", "Footer CTA", "Subscribe (email form)", "POST form", "POST /api/leads/submit (newsletter list)", "Already form-based"),
    ("/blog/[slug]", "Footer CTA", "Subscribe (email form)", "POST form", "POST /api/leads/submit (newsletter list)", "Already form-based"),
    ("/news", "Hero", "(listing only)", "—", "—", "n/a"),
    ("/news/[slug]", "Footer CTA", "(NewsDetailCTA)", "/contact-us", "/contact-us", "Keep — news readers may have press/info intent"),
    ("/newsroom", "Hero", "(listing only)", "—", "—", "n/a"),
    ("/events", "Hero", "(event cards link to detail)", "/events/[slug]", "/events/[slug]", "Keep"),
    ("/events", "Footer CTA", "Subscribe (email form)", "POST form", "POST /api/leads/submit (events list)", "Already form-based"),
    ("/webinars", "Hero", "(listing only)", "—", "—", "n/a"),
    ("/webinars", "Footer CTA", "Subscribe (email form)", "POST form", "POST /api/leads/submit (webinar list)", "Already form-based"),
    ("/podcast", "Hero", "(listing only)", "—", "—", "n/a"),
    ("/podcast", "CTA card 1", "Resource Center", "/resource-center", "/resource-center", "Keep"),
    ("/podcast", "CTA card 2", "Read Blogs", "/blogs", "/blogs", "Keep"),
    ("/podcast", "CTA card 3", "Sign Up", "#", "/book-a-demo", "Dead `#` → real conversion path"),
    ("/resource-center", "Hero", "(listing only)", "—", "—", "n/a"),
    ("/resource-center", "Footer CTA", "Book a Container Scan", "/book-a-demo", "/book-a-demo", "Keep"),
    ("/resource/[slug]", "Hero breadcrumbs", "Home / Resource Center / {type}", "/ · /resource-center · /resource-center?type=…", "(same)", "Keep"),
    ("/knowledge-hub/[slug]", "Hero", "(article breadcrumbs only)", "—", "—", "n/a"),
    ("/author/[slug]", "Hero", "Home / Blogs / LinkedIn", "/ · /blogs · external", "(same)", "Keep"),
]

HEADERS = ["Page", "Slot", "CTA text", "Current href", "Recommended target", "Notes"]

out = "docs/CTA-INVENTORY.csv"
with open(out, "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f, quoting=csv.QUOTE_MINIMAL)
    w.writerow(HEADERS)
    for row in ROWS:
        if len(row) == 1:
            # section header row — single cell, rest blank
            w.writerow([f"# {row[0]}"] + [""] * (len(HEADERS) - 1))
        else:
            w.writerow(list(row))

print(f"Wrote {out}")
