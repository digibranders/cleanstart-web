# News & Publisher

**Module:** C5 — News & publisher
**Prefix:** `NEWS`
**Status:** Conditional — invoked per client (`00-index.md` §8)
**Scope:** Google News eligibility, `NewsArticle`/`Article`/`BlogPosting` structured data, News sitemaps, Top Stories eligibility, article dating and freshness, bylines, paywalled content, content licensing, E-E-A-T as the Search Quality Rater Guidelines actually define it, and corrections/live-blog markup.
**Evidence base:** `docs/seo/evidence/sources/conditional/news.md` (research pass, 2026-07-29).

> **Not exercised by CleanStart — verified against primary documentation only.**
>
> **This module has not been through the adversarial verification pass** that the core
> modules (01–11) received. Its rules rest on a single research pass. Adversarial
> verification found defects in roughly one rule in five across the core modules, so
> re-verify every rule here against its cited source before relying on this module for
> a client engagement.

---

## When this module applies

Apply this module the moment a client takes on a news-classified property — a publication seeking Google News/Top Stories/Discover visibility, a newsroom with bylined, time-sensitive articles, or a site implementing a paywall on editorial content. It does not apply to a marketing/technical-content site with no news classification, no `NewsArticle` markup, and no News sitemap — `www.cleanstart.com` is exactly that, which is why every rule below carries a `CleanStart: N/A` verdict. **E-E-A-T is the most misrepresented concept in mainstream SEO advice** (NEWS-13): it comes from the Search Quality Rater Guidelines, whose own text states rater output "cannot directly impact how a particular webpage appears in Google Search." There is no "E-E-A-T score." Treat every "improve your E-E-A-T score" framing encountered in the wild as `Convention — not vendor-confirmed` — in fact directly contradicted by the Tier 1 source.

---

## P1 — material organic or AI-visibility impact, no immediate loss

### NEWS-01 — Do not artificially freshen a story or delete-and-recreate under a new URL to simulate a fresh publish

- **Severity:** P1
- **Applies:** Any article whose `dateModified`/visible date is updated
- **Rule:** Update `dateModified` (and the visible on-page date) only when the article is substantively changed; never delete-and-recreate an article under a new URL to simulate a fresh publish; never bump the date on a cosmetic edit.
- **Why:** Google's guidance is explicit and punitive in framing: "It's against our guidelines to artificially freshen a story when the publisher didn't add significant information or demonstrated a compelling reason," and separately warns against creating "a very slightly updated story from a previously published one, then delete the old story and redirect to the new one." When a real substantive update happens, Google recommends: "If you update a page significantly, also update the visible date... you can show two dates: when a page was originally published and when it was updated."
- **Acceptance:** Every `dateModified` bump in the CMS's edit history corresponds to a content diff that adds/removes/corrects substantive information (not a typo fix, formatting pass, or ad-slot change); no article's canonical URL has been deleted and recreated at a new path with the old URL redirected, purely to simulate a new publish.
- **Verify:** `grep -c "dateModified" <(curl -s <article-url>)`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://developers.google.com/search/blog/2019/03/help-google-search-know-best-date-for
- **Tools:** Manual editorial audit: pull the CMS revision history for any article whose `dateModified` changed and confirm the diff is substantive; grep the redirect map for 301s from old article URLs to near-duplicate new articles as a smell test.
- **Anti-patterns:** A CMS "bump to top" feature that rewrites `datePublished`/`dateModified` and the visible date on unmodified evergreen content purely to re-enter a "recent" filter or newsletter digest — this is precisely the behavior the guidance calls out by name.
- **CleanStart:** N/A

---

### NEWS-02 — The News sitemap must contain only articles published within the last 48 hours, capped at 1,000 entries per file

- **Severity:** P1
- **Applies:** Any site maintaining a Google News sitemap
- **Rule:** Include only articles published within the last two days in the News sitemap, and never exceed 1,000 `<news:news>` entries per sitemap file.
- **Why:** Google's documented rule: "Only include recent URLs for articles that were created in the last two days" — once an article passes the two-day mark, either remove the URL entirely from the news sitemap or strip its `<news:news>` metadata block (the URL can remain in a general sitemap). The per-file cap is 1,000 `<news:news>` tags; a publisher exceeding that volume in a 48-hour window needs a sitemap index pointing at multiple news sitemap files.
- **Acceptance:** No `<news:publication_date>` value in the currently-submitted news sitemap is older than 48 hours from the time of the check; the file contains ≤1,000 `<news:news>` blocks (or the site correctly uses a sitemap index for overflow).
- **Verify:** `node scripts/seo-sop/check-news-sitemap-window.mjs`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap (last updated 2025-12-10 UTC)
- **Tools:** A scheduled job parsing the live news sitemap XML and computing `now() - news:publication_date` for every entry is the correct verification method, not a one-time check.
- **Anti-patterns:** Generating the news sitemap from "all articles from this week" rather than a strict rolling 48-hour filter — a common off-by-several-days bug in naive "last N days" sitemap generators.
- **CleanStart:** N/A

---

### NEWS-03 — Top Stories eligibility is a content-policy gate, not a markup, AMP, or Core Web Vitals gate

- **Severity:** P1
- **Applies:** Any site pursuing Top Stories eligibility
- **Rule:** Gate Top Stories eligibility engineering effort on Google News content policy compliance and general Search Essentials — not on any specific structured data, AMP, or page-experience threshold.
- **Why:** Google's spam policies state continued attempts to bypass content/spam policies can lead Google to "restrict[] or remov[e] eligibility for some search features like Top Stories and Discover." Page experience is a *ranking* input within Top Stories, explicitly not a hard eligibility gate — any page can appear in Top Stories regardless of its page-experience score; page experience only affects ordering among already-eligible content.
- **Acceptance:** A page that (a) is indexed, (b) does not violate Google News content policies (NEWS-07), and (c) does not violate Google Search's general spam policies is eligible to be considered for Top Stories — full stop, independent of markup, AMP status, or Core Web Vitals score.
- **Verify:** `curl -s "https://search.google.com/search-console/manual-actions"`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://developers.google.com/search/docs/essentials/spam-policies
- **Tools:** For a Top Stories absence investigation, check content policy compliance and Search Console manual actions/spam reports first; treat Core Web Vitals and markup completeness as ranking-quality levers only, not gating checks.
- **Anti-patterns:** Prioritizing AMP migration or perfect Core Web Vitals scores as a prerequisite "to get into Top Stories" — conflates a ranking signal with an eligibility gate.
- **CleanStart:** N/A

---

### NEWS-04 — Google News content policies require clear dates, bylines, publisher identity, and disclosed sponsorship — violations can delist a site from news surfaces entirely

- **Severity:** P1
- **Applies:** Any news-classified page
- **Rule:** Every news-classified page must carry clear publication dates, bylines/author information, publisher/company identity, and contact information; sponsorship or paid promotion must be clearly disclosed and must not exceed the surrounding content in prominence.
- **Why:** Google's stated transparency requirement: "News sources must provide clear dates, bylines, author information, publication details, company/network information, and contact information." Advertising "shouldn't exceed your content," and sponsorships must be clearly disclosed. Consequence framing is explicit: "When we find content or behavior that violates these policies, we may remove the content from our news surfaces," and "In cases of repeated or egregious violations, a site may be no longer eligible to appear on our news surfaces" — site-wide delisting is a documented, real consequence, not a rhetorical warning.
- **Acceptance:** Every article page has a visible byline, a visible publish date/time, a link to (or embedded) contact/masthead information, and — where sponsored — an explicit "Sponsored"/"Paid Content" label rendered at least as prominently as the surrounding editorial content.
- **Verify:** `curl -s <article-url> | grep -ci "sponsored\|paid content"`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://support.google.com/news/publisher-center/answer/6204050
- **Tools:** Manual template audit of one article per content type (staff-written, guest/sponsored, wire-syndicated) confirming byline + date + contact-info presence.
- **Anti-patterns:** A wire-syndicated article rendered with no byline and no indication of the original source/agency — violates the transparency requirement even if the underlying content itself is accurate.
- **CleanStart:** N/A

---

### NEWS-05 — Paywalled content must declare `isAccessibleForFree: false` with a `hasPart`/`cssSelector` pointing at exactly the gated region, or risk a cloaking violation

- **Severity:** P1
- **Applies:** Any article gated behind a paywall or mandatory registration
- **Rule:** Any article gated behind a paywall or mandatory registration must declare `isAccessibleForFree: false` at the article level and wrap the specific gated HTML section in a `hasPart`/`WebPageElement` node with its own `isAccessibleForFree: false` and a `.class`-selector `cssSelector` pointing at that section. Never nest content sections.
- **Why:** This markup exists specifically so Google can distinguish a legitimate paywall from cloaking (serving Googlebot different content than users see) — a serious spam violation absent this signal. Google requires: "Only use `.class` selectors for the cssSelector property," and "Don't nest content sections." Multiple gated sections use an array of `hasPart` objects.
- **Acceptance:** The rendered JSON-LD contains `isAccessibleForFree: false` at the root and at least one `hasPart` entry whose `cssSelector` resolves (via `document.querySelectorAll`) to exactly the DOM node(s) that are actually hidden/truncated behind the paywall for a logged-out user — no more, no less.
- **Verify:** `curl -s <article-url> | grep -o '"isAccessibleForFree":[a-z]*'`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://developers.google.com/search/docs/appearance/structured-data/paywalled-content (last updated 2025-12-10 UTC)
- **Tools:** Rich Results Test on the live URL; manually diff the DOM served to an unauthenticated fetch vs. what `cssSelector` targets.
- **Anti-patterns:** Marking `isAccessibleForFree: false` but pointing `cssSelector` at a class that doesn't actually correspond to the gated DOM region (e.g., a stale selector left over from a template redesign) — reintroduces the exact cloaking ambiguity the markup exists to resolve.
- **CleanStart:** N/A

---

## P2 — meaningful improvement, non-urgent

### NEWS-06 — Google News inclusion is automatic compliance, never a submission or approval workflow

- **Severity:** P2
- **Applies:** Any site considering enrollment in Google News
- **Rule:** Do not build or budget for a Google News "application" step — treat inclusion as a compliance gate, not a submission workflow.
- **Why:** Google Publisher Center Help states verbatim: "Google automatically considers all web content for inclusion in Google News, so you don't need to apply." Eligibility depends on complying with Google's overall Search requirements/policies and Google News content policies. Publisher Center itself "isn't an authoring tool or a content management system" — it's a configuration surface, not a gatekeeper you submit content through.
- **Acceptance:** A news-classified URL that (a) is indexed by Google, (b) meets Google Search Essentials, and (c) meets Google News content policies is eligible to surface in Google News/Top Stories/Discover without any separate submission action.
- **Verify:** `curl -s "https://support.google.com/news/publisher-center/answer/9606538"`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://support.google.com/news/publisher-center/answer/9606538
- **Tools:** Confirm the article URL is indexed via `site:` search or Search Console URL Inspection; if absent, diagnose against technical guidelines and content policies rather than looking for an "approval" step.
- **Anti-patterns:** Treating "Google News approval" as a discrete milestone to chase — there is no approval gate to pass; there is only continuous compliance to maintain.
- **CleanStart:** N/A

---

### NEWS-07 — `Article`/`NewsArticle`/`BlogPosting` markup has no required properties and is not itself a Top Stories prerequisite

- **Severity:** P2
- **Applies:** Any news-classified article
- **Rule:** Implement `Article`, `NewsArticle`, or `BlogPosting` JSON-LD for explicit machine-readability, but do not treat any single property as a hard eligibility gate, and do not treat the markup itself as a Top Stories prerequisite.
- **Why:** Google's Article structured-data doc states "there are no required properties; instead, add the properties that apply to your content," and explicitly: "While there's no markup requirement to be eligible for Google News features like Top stories, you can add Article to more explicitly tell Google what your content is about."
- **Acceptance:** A `<script type="application/ld+json">` block with `@type` one of `Article`/`NewsArticle`/`BlogPosting` validates in the Rich Results Test with zero errors; absence of this markup does not, by itself, explain a Top Stories absence.
- **Verify:** `curl -s "https://search.google.com/test/rich-results?url=<article-url>"`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://developers.google.com/search/docs/appearance/structured-data/article (last updated 2025-12-10 UTC)
- **Tools:** Rich Results Test against the live article URL; if a rich result doesn't render, check for missing recommended `headline`/`image`/`datePublished`/`author` before assuming a hard failure.
- **Anti-patterns:** Assuming a missing/invalid `NewsArticle` block is *the* reason a site is absent from Top Stories — Google explicitly decouples the two.
- **CleanStart:** N/A

---

### NEWS-08 — Author markup: one `Person`/`Organization` entry per byline, bare name only, `url` to a real bio page

- **Severity:** P2
- **Applies:** Any article with one or more bylines
- **Rule:** Populate `author` with one entry per contributing author, each typed `Person` (or `Organization` for house bylines), `name` holding the bare name only, and `url` pointing to that author's profile/bio page.
- **Why:** Google: "Include all authors in the markup"; `author.name` should be "Author's name only—don't include job titles, publisher names, or honorifics"; `author.url` should link to "author's profile, social media, or 'about me' page."
- **Acceptance:** Every byline on the page has a corresponding `author` object; `author.name` string matches the visible byline text exactly (no title/honorific suffix); `author.url` resolves (HTTP 200) to a page containing further biographical information about that person.
- **Verify:** `curl -s <article-url> | grep -o '"author":{[^}]*}'`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://developers.google.com/search/docs/appearance/structured-data/article
- **Tools:** Diff the visible byline text against `author.name` in the rendered JSON-LD; `curl -I` each `author.url` to confirm it resolves and is not a 404 stub.
- **Anti-patterns:** A single `author` object listing "Staff" or a comma-joined string of names inside one `name` field instead of separate `author` entries per contributor.
- **CleanStart:** N/A

---

### NEWS-09 — `datePublished`/`dateModified` must be ISO 8601 with an explicit timezone offset

- **Severity:** P2
- **Applies:** Any article with `datePublished`/`dateModified` markup
- **Rule:** Emit both `datePublished` and `dateModified` in ISO 8601 format with an explicit timezone offset.
- **Why:** Google's own note: "We recommend that you provide timezone information; otherwise, we will default to the timezone used by Googlebot" — omitting the offset hands Google's own crawl timezone as the fallback, which will not match the publisher's actual local time and can misstate freshness by hours.
- **Acceptance:** Both properties are present, parse as valid ISO 8601 datetimes, and include a UTC offset (e.g., `2026-07-29T14:30:00-05:00`) rather than a bare date or an offset-less local time.
- **Verify:** `curl -s <article-url> | grep -o '"datePublished":"[^"]*"'`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://developers.google.com/search/docs/appearance/structured-data/article
- **Tools:** Regex-validate the string against `^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$` (or `Z`); Rich Results Test flags malformed date strings.
- **Anti-patterns:** Setting `dateModified` to the current build/deploy timestamp on every CI run rather than the actual last substantive edit — this silently and continuously "freshens" every page, crossing into NEWS-01's anti-pattern.
- **CleanStart:** N/A

---

### NEWS-10 — Headline concise, image ≥50,000 pixels and genuinely relevant to the specific article — not a reused masthead graphic

- **Severity:** P2
- **Applies:** Any `NewsArticle`-typed page
- **Rule:** Keep `headline` concise (it will be truncated on some surfaces if long) and provide at least one `image` genuinely relevant to the article, at ≥50,000 total pixels (width × height), ideally supplied in 16:9, 4:3, and 1:1 crops.
- **Why:** Google: "Consider using a concise title, as long titles may be truncated on some devices." For images: "Image URLs must be crawlable and indexable," minimum resolution "50K pixels (width x height)," and critically for news specifically: "if you define the image property of NewsArticle, the image must be relevant to that news article" — a news-specific relevance requirement layered on top of the general Article image rules.
- **Acceptance:** `image` URLs return HTTP 200, are not blocked by `robots.txt`/`noindex`, and each image's pixel area is ≥50,000; the image visually depicts the article's actual subject, not a generic house graphic.
- **Verify:** `curl -I <image-url>`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://developers.google.com/search/docs/appearance/structured-data/article
- **Tools:** Fetch the image and check dimensions to confirm the 50K-pixel floor; manual relevance check against the headline.
- **Anti-patterns:** Reusing one sitewide "News" masthead graphic as the `image` value across every `NewsArticle` — this fails the NewsArticle-specific relevance requirement even though it would pass for a generic `Article`.
- **CleanStart:** N/A

---

### NEWS-11 — Publish a dedicated News sitemap using the correct namespace and bare-headline `news:title`

- **Severity:** P2
- **Applies:** Any site maintaining a Google News sitemap
- **Rule:** Publish a dedicated News sitemap (separate from the general sitemap) using the `http://www.google.com/schemas/sitemap-news/0.9` namespace, with `<news:news>` containing `<news:publication>` (`<news:name>` + `<news:language>`), `<news:publication_date>`, and `<news:title>` for every included URL.
- **Why:** `<news:name>` "Must match exactly as it appears on news.google.com"; `<news:title>` is "Article headline only, excluding author/publication name" — do not append the site name or byline the way a browser `<title>` tag might.
- **Acceptance:** The sitemap XML validates against the news sitemap namespace; `news:name` string-matches the Publisher Center-registered publication name exactly; `news:title` contains no " | SiteName" or " - Author" suffix.
- **Verify:** `curl -s https://example.com/news-sitemap.xml | grep -o 'xmlns:news="[^"]*"'`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap
- **Tools:** Diff `news:name` against the Publisher Center dashboard's registered name; spot-check `news:title` values against the raw `headline`, not the SEO `<title>` tag.
- **Anti-patterns:** Reusing the site's rendered `<title>` (which typically appends " | Brand Name") as `news:title` instead of the bare headline.
- **CleanStart:** N/A

---

### NEWS-12 — AMP has not been required for Top Stories since June 2021 — actively correct this widely-repeated stale claim

- **Severity:** P2
- **Applies:** Always, wherever Top Stories eligibility is discussed
- **Rule:** Do not implement or maintain AMP pages under the belief that AMP is required for Top Stories eligibility. It is not, and has not been for over four years.
- **Why:** Google's page-experience update blog post states directly: "This means that using the AMP format is no longer required and that any page, irrespective of its Core Web Vitals score or page experience status, will be eligible to appear in the Top Stories carousel." The rollout began June 2021; the AMP badge/icon was removed from search results entirely. A large volume of current (2026) SEO trade content still states or implies AMP is required for Top Stories — this claim is false and should be explicitly corrected in any deliverable, not merely omitted.
- **Acceptance:** No internal deliverable, audit, or client-facing document lists "implement AMP" as a Top Stories prerequisite.
- **Verify:** `grep -rni "amp.*top stories\|top stories.*amp" docs/seo/`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://developers.google.com/search/blog/2021/04/more-details-page-experience — "any page, irrespective of its Core Web Vitals score or page experience status, will be eligible to appear in the Top Stories carousel." Corroborating timeline detail from contemporaneous trade-press reporting on the same announcement is `Convention — not vendor-confirmed`, used only to triangulate the rollout date.
- **Tools:** Visually inspect a live mobile SERP for a current news query — absence of the AMP lightning-bolt badge corroborates that the feature itself was removed.
- **Anti-patterns:** Any 2026-dated blog post, vendor pitch, or internal SOP draft that lists "implement AMP" as a Top Stories prerequisite — the single most out-of-date claim in mainstream news-SEO advice.
- **CleanStart:** N/A

---

### NEWS-13 — E-E-A-T is a rater-training and measurement framework, not a ranking algorithm — there is no "E-E-A-T score"

- **Severity:** P2
- **Applies:** Always, wherever E-E-A-T is discussed
- **Rule:** Never describe E-E-A-T work as "improving your E-E-A-T score" in any deliverable — no such score exists in any Google system. Frame every E-E-A-T-related recommendation as improving genuine trust signals (author transparency, accuracy, verifiable expertise), not as satisfying an algorithmic input.
- **Why:** The Search Quality Rater Guidelines' own purpose statement (§0.1) states directly: "No single rating can directly impact how a particular webpage, website, or result appears in Google Search, nor can it cause specific webpages, websites, or results to move up or down on the search results page... Instead, ratings are used to measure how effectively search engines are working to deliver helpful content to people around the world." Section 3.4 defines E-E-A-T around a central Trust — "the most important member of the E-E-A-T family because untrustworthy pages have low E-E-A-T no matter how Experienced, Expert, or Authoritative they may seem" — and ties the required level of E-E-A-T to YMYL (Your Money or Your Life) assessment. Google trains and periodically re-calibrates its live ranking systems using rating data *informed by* E-E-A-T concepts; this does not mean any page has a stored, retrievable "E-E-A-T score," or that a specific action (adding an author bio, a `sameAs` link) directly and immediately moves a ranking.
- **Acceptance:** Any SOP language, audit report, or client deliverable that says a page's "E-E-A-T score" was measured, computed, or improved is a documentation error and must be rewritten to describe the underlying signal (author credentials verified, factual accuracy checked, independent citations found) instead.
- **Verify:** `grep -rni "e-e-a-t score\|eeat score" docs/`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] Google, "Search Quality Rater Guidelines" (General Guidelines), PDF, September 11, 2025 revision, §0.1 and §3.4, https://static.googleusercontent.com/media/guidelines.raterhub.com/en//searchqualityevaluatorguidelines.pdf
- **Tools:** Not applicable — grep any produced audit/report content for the string "E-E-A-T score"; zero hits is the passing state.
- **Anti-patterns:** Any content, tool, or vendor claiming to "calculate your E-E-A-T score," rank pages by "E-E-A-T strength" as an algorithmic metric, or promise a specific ranking lift from "E-E-A-T optimization" tactics — the Tier 1 source directly contradicts the premise that individual ratings, let alone a derived score, move rankings at all.
- **CleanStart:** N/A

---

### NEWS-14 — No Google-mandated AI-content disclosure exists for news; gate AI-assisted production against the scaled-content-abuse policy instead

- **Severity:** P2
- **Applies:** Any news-classified content produced with AI assistance
- **Rule:** Do not build a Google-News-specific "AI disclosure" compliance feature under the assumption Google requires it for news content — it does not, as of this module's research date. Instead, gate AI-assisted content production against Google's general scaled-content-abuse spam policy.
- **Why:** Google's generative-AI content guidance states disclosure is not required for AI-assisted content in Search generally: "Sharing information about how a piece of content was created can help give your readers more context" is framed as optional good practice. The binding constraint is instead the spam policy: "using generative AI tools or other similar tools to generate many pages without adding value for users may violate Google's spam policy on scaled content abuse." The evaluative standard is outcome-based — accuracy, quality, relevance — not tool-based.
- **Acceptance:** No content-management feature hard-blocks publishing on "missing AI disclosure" as a Google-compliance requirement; any AI-assisted article production pipeline is auditable for whether each output adds unique value (the actual, enforceable standard) rather than being templated boilerplate at scale.
- **Verify:** `curl -s "https://developers.google.com/search/docs/fundamentals/using-gen-ai-content"`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://developers.google.com/search/docs/fundamentals/using-gen-ai-content (last updated 2025-12-10 UTC) — re-check at implementation time; this is one of the fastest-moving policy areas at Google, and a future hard disclosure mandate would be a breaking change to this rule, not an extension of it.
- **Tools:** Not applicable — this is a policy-currency check, re-run at implementation time.
- **Anti-patterns:** Practitioner claims that "Google News requires publishers to label AI-generated articles" — not supported by the current Tier 1 source; label `Convention — not vendor-confirmed` if encountered, and do not implement a mandatory-disclosure gate on that basis alone.
- **CleanStart:** N/A

---

## P3 — hygiene, marginal or speculative gain

### NEWS-15 — Content licensing signals for images: `license` + `acquireLicensePage`, or equivalent IPTC metadata — structured data wins on conflict

- **Severity:** P3
- **Applies:** Any editorially-licensed image (wire-service photos, licensed stock)
- **Rule:** For image content, supply license information via either Schema.org's `license` + `acquireLicensePage` properties in structured data, or equivalent IPTC photo metadata embedded in the image file itself — not both inconsistently.
- **Why:** Google's Image License Metadata doc: only one of the two methods is required for the "Licensable" badge in Google Images. "In instances where both structured data and IPTC photo metadata are present and they conflict, Google will use the structured data information."
- **Acceptance:** Every editorially-licensed image carries either a `license`/`acquireLicensePage` pair in the page's `ImageObject` structured data or equivalent embedded IPTC metadata — and if both are present, they agree.
- **Verify:** `exiftool <image> | grep -i "webstatement\|licensorurl"`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://developers.google.com/search/docs/appearance/structured-data/image-license-metadata
- **Tools:** Rich Results Test for the structured-data path.
- **Anti-patterns:** Embedding IPTC licensing metadata in the master image file but stripping it on upload/resize in the CMS's image pipeline (a common image-processing-library default) — leaves no license signal at all despite editorial intent.
- **CleanStart:** N/A

---

### NEWS-16 — Corrections markup is real vocabulary with no Google-documented consuming rich result — scope it as editorial trust practice only

- **Severity:** P3
- **Applies:** Any site publishing correction/retraction notices
- **Rule:** Publish `correctionsPolicy` (a `NewsMediaOrganization` property) and use `CorrectionComment` to mark specific corrected passages as a transparency/trust practice — but do not expect any Google-documented rich result, badge, or ranking effect from doing so.
- **Why:** Schema.org defines `CorrectionComment` and `NewsMediaOrganization.correctionsPolicy` as real, valid, documented vocabulary. A direct check of Google's full structured-data feature gallery confirms neither "Corrections" nor "CorrectionComment" appears anywhere in Google's list of supported rich-result types. Google's Fact Check (`ClaimReview`) docs reference a corrections policy as part of the accountability standard expected of `ClaimReview` publishers, but that is a policy precondition for a different feature, not a rich result for corrections markup itself.
- **Acceptance:** Any deliverable treats `correctionsPolicy`/`CorrectionComment` implementation as a genuine, worthwhile trust/transparency practice (feeding the Trust component of E-E-A-T, NEWS-13) — but does not promise a rich result, SERP feature, or measurable ranking lift attributable to this markup.
- **Verify:** `curl -s "https://developers.google.com/search/docs/appearance/structured-data/search-gallery" | grep -ic "correction"`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://schema.org/CorrectionComment; https://schema.org/NewsMediaOrganization (vocabulary); [Tier 1] https://developers.google.com/search/docs/appearance/structured-data/search-gallery (absence-of-feature check, full table enumerated directly)
- **Tools:** Re-run the search-gallery enumeration at implementation time to confirm this absence hasn't changed.
- **Anti-patterns:** Selling or scoping "corrections markup implementation" internally as if it unlocks a Google rich result — it doesn't; scope it honestly as an editorial-trust practice with schema.org-level, not Google-feature-level, backing.
- **CleanStart:** N/A

---

### NEWS-17 — `LiveBlogPosting` is real schema.org vocabulary; do not promise a Google "LIVE" badge as a currently-documented feature

- **Severity:** P3
- **Applies:** Any site building live-blog coverage
- **Rule:** If building live-blog coverage, use schema.org's `LiveBlogPosting` (with `coverageStartTime`, `coverageEndTime`, and per-update `liveBlogUpdate` entries) as the vocabulary of record — but do not promise a specific Google "LIVE" badge or Top Stories carousel behavior as a documented, currently-supported Google feature.
- **Why:** A direct request to Google's previously-known Live Blog structured-data documentation URL returned HTTP 404, and a full enumeration of Google's current structured-data feature gallery confirmed neither "Live blog" nor "LiveBlogPosting" appears as a supported feature. Google's public documentation changelog was checked for a removal/deprecation entry specific to Live Blog and none was found — this is a documented absence in the current state, not a dated, citable deprecation event.
- **Acceptance:** Any claim that "LiveBlogPosting markup earns a red LIVE badge in Google Search" is labeled `Convention — not vendor-confirmed` rather than presented as a documented Google feature; the schema.org vocabulary is still implemented correctly (harmless, semantically accurate, may feed general Article-level understanding), scoped as "correct semantic markup," not "guaranteed SERP feature."
- **Verify:** `curl -sI "https://developers.google.com/search/docs/appearance/structured-data/live-blog" | head -1`
- **Reference:** None — no reference implementation
- **Source:** [Tier 1] https://schema.org/LiveBlogPosting (vocabulary); [Tier 1] direct 404 on the last-known Google Search Central Live Blog URL and full enumeration of the structured-data feature gallery, both performed directly during this module's research. The claim that LiveBlogPosting earns a "LIVE" badge is `Convention — not vendor-confirmed` (multiple current SEO vendor blog posts assert this; none is a Google-owned source).
- **Tools:** Re-attempt the Google Search Central Live Blog URL and re-enumerate the search-gallery page at implementation time — if Google has since published or restored a dedicated feature, this rule must be rewritten with the new citation, not merely appended to.
- **Anti-patterns:** Scoping an SOP deliverable around "implement LiveBlogPosting to get the LIVE badge" as if this were a guaranteed, Google-documented mechanical outcome.
- **CleanStart:** N/A
