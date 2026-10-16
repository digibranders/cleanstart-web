# Lexical contract (research, 2026-10-16)

**Key risks for a self-hosted Lexical editor (under 200 words):**
1. **Nothing on the server stops bad node types.** Payload only validates node types it knows (`richtext-lexical/dist/validate/index.js`) and skips the rest, so a stray node saves fine and then renders as nothing.
2. **Link URLs get rewritten on save.** The popover always saves `linkType:'custom'` with an absolute `url` (`toStoredUrl`). Payload percent-encodes any URL that fails `validateUrl` (`link/server/baseFields.js`). Internal-doc links would render as `href="#"`.
3. **The renderer silently drops a lot.** Not drawn: `relationship`, `tab`, iframe-mode `embed` (`rawHtml:''` gives null), checklist state, alignment/indent, and the per-placement image fields (`fields.alt/caption/alignment/size`). Upload `value` must be populated (depth ≥ 1) or the image disappears.
4. **Ids and versions must match Payload.** Link v3 / upload v3 / block v2 nodes carry Payload ObjectID ids. Block `fields` must pass Payload validation.
5. **Table header state is inconsistent.** Editor-made header rows use `headerState 1`; migrated ones use `2`. Table JSON includes `colWidths` and `width`.
6. **Versions differ from what you assumed.** Payload installed is 3.84.1, not 3.81. lexical is 0.41.0.
7. **The architecture doc's link model (`{kind:'doc'}`, `[[` typeahead) is not built.** Don't use it as the spec.

---

# CleanStart rich-text (Lexical) contract: for replacing Payload's admin editor

Repo root: `/Users/a12345/Desktop/AI/cleanstart/cleanstart-website`. All paths below are relative to it unless absolute.

**Installed versions (verified):**
- `@payloadcms/richtext-lexical` is **3.84.1** (`apps/cms/node_modules/@payloadcms/richtext-lexical/package.json`). `apps/cms/package.json:51` declares `^3.81.0`.
- `lexical` and every `@lexical/*` package is **0.41.0** (`node_modules/.pnpm/lexical@0.41.0`). Payload pins `@lexical/*` 0.41.0 at `richtext-lexical/package.json:356-365`.

## 1. Editor configs

Only two `lexicalEditor(...)` calls exist:

| Config | File | Used by |
|---|---|---|
| `cleanstartLexicalEditor()` | `apps/cms/src/payload/lib/lexical/editor-config.ts:39-172` | Global default, `apps/cms/src/payload.config.ts:610` (`editor: cleanstartLexicalEditor()`). Applies to every `richText` field with no `editor:` set. |
| `faqAnswerLexicalEditor()` | `apps/cms/src/payload/lib/lexical/faq-answer-editor.ts:24-50` | `faqs[].answer` only (`apps/cms/src/payload/fields/faqs.ts:41-44`). `faqsField` is used in Blogs.ts:71, Guides.ts:70, KnowledgeBase.ts:90. |

**Fields that use the default editor:**
- `body` on Blogs.ts:69, News.ts:128, Resources.ts:94, Events.ts:70, KnowledgeBase.ts:88, Webinars.ts:85, Guides.ts:68, Legal.ts:100, Jobs.ts:216, CaseStudies.ts:127
- `bioLong` on Authors.ts:68
- `postSubmit.body` on Forms.ts:217
- Page-builder blocks: `RichText.body` (blocks/RichText.ts:8-11) and `FormBlock` postSubmit body (blocks/FormBlock.ts:41)

Paths are under `apps/cms/src/payload/collections/` unless noted.

### 1a. `cleanstartLexicalEditor` features (editor-config.ts)

- `ParagraphFeature()` (:42)
- `HeadingFeature({ enabledHeadingSizes: ['h1','h2','h3','h4'] })` (:43)
- Text formats (:45-51): Bold, Italic, Underline, Strikethrough, Subscript, Superscript, InlineCode. The bits are 1/2/8/4/32/64/16.
- `BlockquoteFeature`, `UnorderedListFeature`, `OrderedListFeature`, `ChecklistFeature`, `HorizontalRuleFeature` (:53-57)
- `EXPERIMENTAL_TableFeature()` (:58). Payload mounts Lexical's TablePlugin with `hasCellMerge:true, hasHorizontalScroll:true, hasCellBackgroundColor:false` (`richtext-lexical/dist/features/experimental_table/client/plugins/TablePlugin/index.js:137-140`). A cell resizer plugin is also present.
- `cleanstartTablePopoverFeature()` (:59)
- `AlignFeature()`, `IndentFeature()` (:60-61)
- `LinkFeature({ fields: [{ name:'rel', type:'select', defaultValue:'follow', options: follow|nofollow|sponsored|ugc }] })` (:63-77)
  - The base fields come from Payload (`link/server/baseFields.js`): `text` (drawer only, not persisted), `linkType` radio `custom|internal`, `url`, `doc` (relationship), `newTab`.
  - `doc` relationTo = every non-hidden collection with `admin.enableRichTextLink` (Payload default true). No `enabledCollections` is set.
- `cleanstartLinkPopoverFeature()` (:78)
- `RelationshipFeature()` (:79). No collection restriction.
- `cleanstartEmbedFeature()` (:80), `cleanstartAddMenuFeature()` (:81)
- `BlocksFeature({ blocks: [CodeBlock, InlineCtaBlock] })` (:87). No inline blocks.
- `cleanstartCodeBlockFeature()` (:93)
- `UploadFeature` (:101-149). `collections.media.fields` is the per-placement data:
  - `alt` (text)
  - `caption` (text)
  - `alignment` (select left|center|right|full, default center)
  - `size` (select small|medium|large|full, default large)
  - `decorative` (checkbox)
- `cleanstartInlineImageFeature()` (:156)
- `FixedToolbarFeature()`, `InlineToolbarFeature()` (:161-162)
- `RichPasteFeature()` (:164), `cleanstartSlashMenuFeature()` (:169)
- **Not registered:** `cleanstartBlockHandleFeature` is defined in `lib/lexical/block-handle-feature.ts:11` but never added to any editor (grep finds no use). BlockHandlePlugin is dead code.

### 1b. `faqAnswerLexicalEditor` features (faq-answer-editor.ts:26-49)

- Paragraph, Bold, Italic, UnorderedList, OrderedList
- LinkFeature with the same `rel` field
- cleanstartLinkPopoverFeature, FixedToolbarFeature
- Nothing else: no headings, tables, uploads, blocks, embed, code, quote, or underline/strike/sub/sup/inline code.
- **Contract:** FAQ answers may only contain root, paragraph, text (bits 1 and 2), linebreak, list (bullet/number), listitem, and link/autolink.

## 2. Custom features, plugins and nodes

Each server stub is a `createServerFeature` that points at a ClientFeature. **Only Embed registers a new node.** Everything else layers UI onto stock nodes.

| Feature (server → client) | Node it adds | Behaviour |
|---|---|---|
| `cleanstartEmbed` `lib/lexical/embed-feature.ts:20-27` → `admin/components/Embed/CleanstartEmbedFeatureClient.ts:28-37` | **`embed`** (EmbedNode) | Toolbar button `cs-embed` plus EmbedPlugin. Inserts or edits embeds through EmbedDialog. |
| `cleanstartLinkPopover` `lib/lexical/link-popover-feature.ts` → `admin/components/CleanstartLinkPopoverFeatureClient.ts:70-87` | none (stock `link`) | Mounts LinkPopoverPlugin (floatingAnchorElem), StockToolbarSuppressorPlugin and ToolbarTipsPlugin. Adds toolbar item `cs-link`. |
| `cleanstartTablePopover` `lib/lexical/table-popover-feature.ts` → `CleanstartTablePopoverFeatureClient.ts:23-34` | none (stock table) | `TableGridPickerPlugin.tsx:87-96` dispatches `INSERT_TABLE_COMMAND {rows, columns, includeHeaders:{columns:false, rows:true}}`, so the first row gets headerState 1. |
| `cleanstartAddMenu` → `AddMenu/CleanstartAddMenuFeatureClient.ts` | none | "Insert" dropdown (`AddMenuToolbarButton.tsx:113-210`): H2, H3, Quote, bullet list, numbered list, Divider, Table, Image, Embed, Code block, CTA card. |
| `cleanstartCodeBlock` → `CodeBlockButton/CleanstartCodeBlockFeatureClient.ts` | none | `<>` button dispatches `INSERT_BLOCK_COMMAND {blockName:'', blockType:'codeBlock'}` (`CodeBlockToolbarButton.tsx:42-44`). Also mounts InlineCodeEscapePlugin. |
| `cleanstartInlineImage` → `InlineImage/CleanstartInlineImageFeatureClient.ts` | none (stock `upload`) | Handles paste/drop of image files: uploads to `/api/media` and inserts an `upload` node (`InlineImagePlugin.tsx:131-142`). Also provides a Device/Browse/URL dialog. |
| `cleanstartSlashMenu` → `CleanstartSlashMenuFeatureClient.ts` | none | `/` at the start of a paragraph (`SlashMenuPlugin.tsx` items ~143-240): H2, H3, Quote, bullet list, numbered list, HR, Image, Embed, Code block, CTA card (`blockType:'inlineCta'`). |
| `richPaste` `lib/lexical/rich-paste-feature.ts` → `RichPasteFeatureClient.ts` | none | See RichPastePlugin below. |
| `cleanstartBlockHandle` → `CleanstartBlockHandleFeatureClient.ts` | none | **Not registered** (see 1a). |

**Plugins:**
- **StockToolbarSuppressorPlugin** (`StockToolbarSuppressorPlugin.tsx:5-9, 46-62`): a MutationObserver hides stock buttons `link` and `table` and the stock `add` group. The `add` group holds the Table, Relationship, HR and Upload drawers.
- **ToolbarTipsPlugin**: adds titles and aria-labels only. No data impact.
- **InlineCodeEscapePlugin** (`CodeBlockButton/InlineCodeEscapePlugin.tsx`): pressing Space at the end of an inline-code run inserts a plain space and exits the mark.
- **RichPastePlugin** (`RichPastePlugin.tsx`):
  - Runs only on rich `text/html` (`looksLikeRichDoc`).
  - Normalizes the HTML (`lib/normalize-rich-html.ts`: Word/Docs class or style to h2/h3/strong/em/u; strips style/script/o:p) and then calls `$generateNodesFromDOM`.
  - Converts `<pre>` to an `INSERT_BLOCK_COMMAND` codeBlock.
  - Sends inline `<img>` through `ingestMediaFromUrl`, then swaps the placeholder paragraph for an `upload` node with `fields {alt, caption:'', alignment:'center', size:'large', decorative:false}` (:106-118).
  - Skips form controls inside decorators.

### EmbedNode JSON (`admin/components/Embed/EmbedNode.ts:21-40, 147-162`)

`DecoratorBlockNode`, `getType()==='embed'`:

```json
{ "type":"embed","version":1,"format":"",
  "mode":"iframe|script","url":"","embedUrl":"","provider":"youtube|vimeo|loom|calendly|tidycal|typeform|tally|figma|wistia|mux|descript|arcade|spotify|soundcloud|google-maps|generic",
  "rawHtml":"","title":"","aspectRatio":"16-9|4-3|1-1|9-16|auto","caption":"","styleSlug":"" }
```

- `styleSlug` is optional on import (`?? ''`). Valid slugs are `EMBED_STYLE_PRESETS` in `packages/types/src/index.ts:39-97` (callout-brand/info/warning/success/alert, myth-reality, stat-highlight, pull-quote, dark-panel, …).
- An iframe-mode insert always has `rawHtml:''` and `styleSlug:''` (`EmbedDialog.tsx:191-200`).
- Script mode needs `rawHtml` and `title` (:203-222).
- Migrated embeds come from `apps/cms/scripts/migrate-feature-grid-embeds.ts:53-64` and `migrate-layout-embeds.ts:46`: `mode:'script', provider:'generic', aspectRatio:'auto'`, no `styleSlug`.

## 3. Blocks

**Inside rich text** (BlocksFeature, editor-config.ts:87). Serialized as `{type:'block', version:2, format:'', fields:{id:<ObjectID hex>, blockName:'', blockType, ...}}`. See Payload `blocks/server/nodes/BlocksNode.js:66-72`; the client sets `id` at `blocks/client/nodes/BlocksNode.js:49`.

- `codeBlock` (`blocks/CodeBlock.ts`):
  - `language` select, required, default `bash`. Options: bash, dockerfile, yaml, json, typescript, javascript, python, go, rust, sql, hcl, text.
  - `content` textarea, required.
  - `showLineNumbers` checkbox, default true.
  - `highlightLines` text.
- `inlineCta` (`blocks/InlineCtaBlock.ts`):
  - `heading`, `buttonLabel`, `buttonUrl` (all text, required)
  - `variant` select `soft|solid`, required, default `soft`
- Server validation: an unknown `blockType` fails with "Block X not found". Required sub-fields are validated (`blocks/server/validate.js`).

**The 21 files in `apps/cms/src/payload/blocks/`:**
- 19 are blocks. `cta-button.ts` is a group-field helper; `index.ts` is the roster.
- **Layout (page builder):** `pageBuilderBlocks = [Section(nestable), ...nestable]` (`blocks/index.ts:27-52`). It is used only by `Pages.layout` (`collections/Pages.ts:153-155`) and nested inside Section (`blocks/Section.ts:56-57`). Nestable blocks: Hero, CTA, RichText, FormBlock, FeatureGrid, LogoCloud, IntegrationLogos, Testimonial, Stats, MetricsBar, FAQ, Gallery, Embed (slug `embed`, a layout block, not the Lexical node), CodeBlock, Pricing, JobsList, Table (slug `table`).
- **Rich-text blocks:** CodeBlock (shared by both rosters) and InlineCtaBlock (rich text only).
- No `apps/web` consumer of `Pages.layout` or `Forms.postSubmit.body` was found (grep for `.layout` / `api/pages` / `api/forms` in apps/web/src returned nothing).

## 4. Links

**Stored shape (what the editor writes today):**
- The popover always saves this (`LinkPopoverPlugin.tsx:592-610`):
  `fields = { doc:null, linkType:'custom', newTab, rel, url: toStoredUrl(input) }`
- `toStoredUrl` (`admin/components/internal-routes.ts:55-69`) prefixes `/path`, `#x` and `?q` with `SITE_ORIGIN` (env `NEXT_PUBLIC_SITE_ORIGIN`, default `https://www.cleanstart.com`, :31-41). Absolute or scheme URLs pass through.
- On read, `fromStoredUrl` (:83-96) strips the same host (www-insensitive) back to a path and shows it under the "Internal" radio. The doc picker resolves to a path through `ROUTES` (:18-29). **No `linkType:'internal'`/`doc` link is ever created.**
- Payload `LinkNode.exportJSON` (`link/nodes/LinkNode.js:77-96`) deletes `doc` when custom and deletes `url` when internal. It emits `{type:'link', version:3, format, indent, direction, children, fields, id?}`.
  - `$createLinkNode` assigns an ObjectID `id` (:195-202).
  - Imported nodes without `id` keep none (`updateFromJSON` → `setID(undefined)`, :172-173).
- `autolink` is emitted as `{type:'autolink', version:2, children, direction, fields, format, indent}` (`AutoLinkNode.js:32-42`).
- **Server hooks on `url`** (`link/server/baseFields.js:56-90`):
  - beforeChange: if `!validateUrl(value)`, the value is replaced with `encodeURIComponent(value)`.
  - validate: no spaces allowed (`validateUrlMinimal`).
  - **A custom editor must emit URLs that pass `validateUrl` (`lexical/utils/url.js:45+`) or they get mangled.**
- Default popover values: internal → `rel:'follow'`, `newTab:false`; external → `rel:'nofollow'`, `newTab:true` (`LinkPopover.tsx:96-114`).
- Migrated links (`lib/webflow-import/html-to-lexical.ts:60-73, 346-353`): `version:3`, `fields{url, newTab, linkType:'custom', rel:'follow'}`, **no id**, and often a **bare path url** (e.g. `/attack-surface-reduction` in the sample).

**What the architecture doc says** (`docs/architecture/cleanstart-cms-architecture.html`):
- `#link-handling` at :2607. It specifies typed targets `{kind:'doc'|'url'|'anchor'|'mailto'|'tel'|'media'}` (:2622, :2628), `[[` typeahead (:2655), convert-on-paste (:2656), chip badges, and doc-links rendered as text when unpublished.
  - Render rules: external links always get `noopener noreferrer`; off-site links default to `target=_blank`; editors can override.
  - **None of the `kind` model, `[[`, or convert-on-paste exists in code.** grep for `[[` / "Convert to internal" in apps/cms/src finds nothing. Treat the doc as aspirational.
- `#table-handling` at :2493. It claims tables are in "every rich-text editor … FAQ answers" (:2510). **This is false: the FAQ editor has no table feature.** The `hasCellMerge` claim matches Payload. The claim of a shared `<Table>` component does not match `renderLexical`, which emits its own `<table class="article-table">`.

**What the renderer actually does** (`apps/web/src/lib/renderLexical.tsx:40-90, 162-200`):
- The href is `node.url ?? node.fields.url`, after stripping invisible characters.
- Paths and same-host URLs become internal `<Link>`, same tab, and **stored `newTab` is ignored**.
- Other http(s) URLs get `_blank` plus `noopener noreferrer`. mailto/tel open with no target.
- `rel` keeps the stored value unless it is `follow`.
- **`linkType:'internal'` with only `doc` renders `href="#"`**, because the renderer does no doc resolution.

## 5. Upload and relationship nodes

- **Upload** (`upload/server/nodes/UploadNode.js:80-86, 103`): `{type:'upload', version:3, format:'', id:<ObjectID>, relationTo:'media', value:<media id>, fields:{alt, caption, alignment, size, decorative}}`.
  - On Postgres `value` must be a **number** (`InlineImage/upload-media-file.ts:28-38`; `isValidID` check in `upload/server/validate.js`).
  - `fields` are validated against the UploadFeature schema, so select values must be valid options.
  - Migrated uploads (`html-to-lexical.ts:189-200, 568-578`) have **no `id`** and `fields{alt?, alignment:'center', size:'large'}`.
- **Population:** the afterRead hook (`upload/server/index.js:182-218`) replaces `value` with the full Media doc when `currentDepth <= depth` (`populateGraphQL/populate.js:15`). No `maxDepth` is set and Media has no `defaultPopulate` (grep is empty), so the whole doc is returned.
  - Web fetches the blog detail at `depth=1` (`apps/web/src/lib/blog.ts:363-373`).
  - A custom admin that reads at depth ≥ 1 must write `value` back as the **id**. Payload tolerates `value.id` but don't rely on it.
- **Relationship:** `{type:'relationship', version:2, format, relationTo, value}` (`relationship/server/nodes/RelationshipNode.js:84-90`). Populated the same way. Its UI is hidden (the stock `add` group is suppressed). **The renderer drops it** (default case, no children).

## 6. apps/web renderer: node types handled

`apps/web/src/lib/renderLexical.tsx:153-410` (`RenderLexical` at :467):

| type | Handling |
|---|---|
| `text` | Format bits 1/2/4/8/16/32/64 become strong/em/s/u/code/sub/sup. `style` is ignored. |
| `linebreak` | `<br>` |
| `link`, `autolink` | See §4. |
| `paragraph` | `<p>`. **An empty paragraph renders `<br>`.** `format` (align) and `indent` are ignored. |
| `heading` | h1 is demoted to h2. `id = slugifyText(text)` with no de-duplication. |
| `list` | `bullet`/`check` → `<ul>`, `number` → `<ol start>`. **The checklist `checked` value is ignored.** |
| `listitem` | `<li>`. Nested lists are rendered through children. |
| `quote` | `<blockquote>` |
| `code` | Shiki-highlighted via `_lines`/`_content` from `lib/highlightLexical.ts:61-83`. The editor cannot create this (no CodeFeature); it is legacy/import-only. |
| `block` | Only `codeBlock` and `inlineCta`. Any other blockType renders null. |
| `horizontalrule` | `<hr>` |
| `table` / `tablerow` / `tablecell` | `<table><tbody>`. headerState 2 → `th.article-th-col`; 1 or 3 → `th.article-th-row`; colSpan and rowSpan honored. **`width`, `colWidths`, `backgroundColor` and `verticalAlign` are ignored.** |
| `upload` | Needs a populated `value.url`. Uses `value.alt`, width and height. **`fields.alt/caption/alignment/size/decorative` are all ignored.** |
| `embed` | Renders sanitized `rawHtml` only, which strips script/iframe/object/embed tags, `on*` handlers and `javascript:` URLs (:432-437). Adds the `styleSlug` class if whitelisted. **iframe mode (`rawHtml:''`) renders nothing. Script-mode scripts are stripped, so EmbedNode.ts's comment that "scripts execute on live site" is false.** |
| anything else (`relationship`, `tab`, `inlineBlock`, …) | Children are rendered if present, otherwise null. |

**Call sites:**
- Blog, guide, news and resource bodies via `highlightLexical`.
- Webinar, event, legal, KB, careers, case-study and author `bioLong` via `RenderLexical`.
- FAQ answers with `wrapperClassName="faq-answer-body"`.
- `lexicalToPlainText` for FAQ JSON-LD and blog CTA matching.

The web types are in `apps/web/src/lib/blog.ts:61-187`.

**Safe emit set (default editor):**
- root, paragraph, text, linebreak, heading(h2-h4; h1 is demoted)
- list(bullet/number), listitem, quote, horizontalrule
- table, tablerow, tablecell
- link, autolink
- block(codeBlock|inlineCta)
- upload (as an id)
- embed (script mode with `rawHtml`)

**Emittable but broken on the site:**
- checklist, align, indent
- relationship
- iframe embeds
- internal-doc links

## 7. Server-side Lexical processing

There is **no HTML conversion** anywhere (no `convertLexicalToHTML` or headless-editor use in apps/cms/src, apps/web/src, scripts or migrations).

- **Payload validation:** per node type, through feature validations (`richtext-lexical/dist/validate/index.js`, `validateNodes.js`). Unknown types are not rejected.
- **`normalizeLexicalHook`** (`hooks/normalize-lexical.ts`, `lib/lexical-normalize.ts`): beforeChange hook that merges adjacent `list` siblings with the same `listType` and `start`. It does not change `listitem.value`.
  - Wired on Blogs:326, News:246, Guides:253, KnowledgeBase:205, Resources:194, Events:336, Webinars:314, Jobs:316, CaseStudies:244, Legal:124, Authors:223 (`bioLong`).
  - **Your editor's saved JSON can therefore differ from what it sent.**
- **`bodyStatsHook`** (`hooks/body-stats.ts:53-91`, using `lib/lexical-extract.ts:94-159`):
  - Writes `wordCount`, `readingMinutes` (220 wpm) and `tableOfContents[{level, text, anchor}]`.
  - Collects h2-h6 headings outside tables. Anchors use the `@cleanstart/ui` slugify plus `-2`, `-3` de-duplication.
  - Skips code, code-highlight, block, inline-block, horizontalrule, linebreak and tab for word counts.
  - TOC depth comes from `tocLevelsField`. Wired on Blogs:330, News:248, Guides:257, KnowledgeBase:209.
  - The web TOC re-slugifies the heading text itself (`GuideDetailContent.tsx:106`) and ignores the stored anchor.
- **Blog CTA matching:** web `lib/blog-cta/resolve.ts:149-157` uses `tableOfContents[].text` as headings and `lexicalToPlainText(body)`. The CMS sidebar calls the web route through `endpoints/blog-cta-suggestion.ts`.
- **BodyAuditField** (`admin/components/BodyAuditField.tsx`, using `lib/lexical-audit.ts`):
  - Counts links and alt coverage. A link is internal if `linkType==='internal'`, `doc` is set, or `url` starts with `/`. So absolute-origin URLs saved by the popover count as **external**.
  - Images are `upload`, `image` or `inline-image`; alt comes from `altText`/`alt`/`fields.alt`.
  - Also uses readability and `seo/featured-snippet.ts:68-101` (question headings followed by an answer node).
- **Plain-text extraction:**
  - `lib/lexical/to-plain-text.ts` is used for FAQ JSON-LD (`jsonld/faq-page.ts:25`) and CSV export (`export/serialize-field.ts:57,85`).
  - `lib/search/index-schema.ts:25-60` builds search text (body or bioLong).
  - `jsonld/dispatch.ts:401-416` collects description text.
  - `lexical-extract.collectPlainText` feeds readability and KeywordTargetField.
- **Broken links:** `lib/broken-links/extract.ts:49-67` checks external `link`/`autolink` URLs with no `doc` and `linkType != internal`.
- **Migrations and converters:**
  - `lib/webflow-import/html-to-lexical.ts` (shapes at :45-220): text, linebreak, link v3, paragraph with `textFormat:0, textStyle:''`, heading h1-h4 (h5/h6 clamped to h4, :581-584), quote, list with `tag`/`start:1`, listitem, horizontalrule, table/row/cell (`th` → headerState 2 under thead, otherwise 1, :589-603), block codeBlock with `showLineNumbers:false`, upload.
  - `cta-cards.ts:140-157` builds inlineCta blocks.
  - `apps/cms/scripts/migrate-*-embeds.ts` builds embeds.
  - `fix-kb-internal-links` and `unlink-*` migrations rewrite strings.
  - `20260821_120000_faq_answer_richtext.ts` converts FAQ answers in SQL, producing paragraphs with possibly **empty text nodes**. Lexical drops those on the first editor save.
  - `FaqBulkPaste.tsx:48-89` builds paragraph/text answers.
  - `scripts/seed-knowledge-base.ts` reuses `htmlToLexical`.

## 8. Sample: migrated blog body

Source: `migrations/webflow-export/transformed/blogs.jsonl` (59 blogs), entry `busybox-container-security-risk`.

- **Node types in that blog:** root 1, paragraph 49, text 75, link 2, heading 6 (h2 and others), list 9, listitem 12, table 1, tablerow 5, tablecell 15, horizontalrule 1.
- **Across all 59 blogs:** paragraph 2387, text 4779, heading h2 173 / h3 316 / h4 115, list bullet 660 / number 46, listitem 1010, link 89, linebreak 46, table 13, tablerow 77, tablecell 216, quote 10, horizontalrule 14, block:codeBlock 3.
- **Exact key sets observed:**
  - text: `type, text, format, style, mode, detail, version`
  - paragraph: `type, version, format, indent, direction, textFormat, textStyle, children`
  - link: `type, version(3), format, indent, direction, fields{url, newTab, linkType, rel}, children` (no id)
  - list: `+listType, tag, start`
  - listitem: `+value`
  - tablecell: `headerState, colSpan, rowSpan, …`
- **Caveat:** this file is a pre-import snapshot. The live DB also contains `embed`, `upload` and `inlineCta` nodes added later by scripts, so query the DB for a complete type census.

## Core JSON shapes from Lexical 0.41 (verified)

- `TextNode`: `{detail, format, mode, style, text, type, version:1}` (Lexical.dev.js:4965-4976).
- `ElementNode`: `{children, direction, format, indent, type, version}`. It adds `textFormat`/`textStyle` only when there are no text children (:9572-9590).
- `ParagraphNode`: always includes `textFormat` and `textStyle` (:9989-10003).
- `TableNode`: adds `colWidths` plus optional frozen/striping fields.
- `TableCellNode`: `{backgroundColor, colSpan, headerState, rowSpan, width, verticalAlign?}`.
- `TableRowNode`: `height?` (`@lexical/table/LexicalTable.dev.js:138-150, 388-396, 3668-3676`).
- Header-state constants: `NO_STATUS 0, ROW 1, COLUMN 2, BOTH 3`.

To stay byte-compatible, the custom editor must register the same node classes with the same versions. Use Payload's LinkNode/AutoLinkNode/UploadNode/RelationshipNode/BlockNode serializations, or exact clones of them, rather than `@lexical/link` (which serializes differently).

---
Not verified: live-DB node census, `h5`/`h6` behaviour via paste through HeadingFeature, and whether any stored `linkType:'internal'` links exist.