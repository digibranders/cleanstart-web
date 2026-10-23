# Studio rich-text editor

The editor is the riskiest part of Studio. It writes the JSON that `apps/web` renders on every content page. This spec fixes the JSON contract first and the UI second. Evidence for every shape below is in `research/lexical-contract.md` (file and line references there).

Versions: `lexical` and every `@lexical/*` package at 0.41.0; `@payloadcms/richtext-lexical` 3.84.1 (the server validator and hooks Studio must satisfy). Studio adds no new Lexical version.

## 1. The gate

Phase 3 is done only when all of these pass in CI:

1. **Round trip.** For every fixture document: `parseEditorState(json)` then `editorState.toJSON()` deep-equals the input after the documented normalisations in §6. Fixtures: all 59 blogs in `migrations/webflow-export/transformed/blogs.jsonl`, plus hand-built fixtures for `embed` (iframe and script modes), `upload` (with and without `id`), `block` (codeBlock and inlineCta), tables with header states 1, 2 and 3, merged cells, nested lists, checklists, every text format bit, `linebreak`, `autolink`.
2. **Server acceptance.** Every fixture saved through `payload.update` as an editor user succeeds (Payload's lexical validation and the `normalizeLexicalHook` run).
3. **Renderer coverage.** A test walks every node the editor can insert and asserts its type is in the set `apps/web/src/lib/renderLexical.tsx` draws (§3, "renders" column). Nothing the editor offers renders as nothing on the site, with one listed exception: `embed` in iframe mode (§4.4), which the test skips by name and which the embed dialog warns about.
4. **Production census.** The read-only census from Phase 0 lists every node type and key set in production. Every type in it loads in Studio without error.
5. **Visual diff.** Three real posts (one blog, one guide, one knowledge-base article) are opened, edited in one paragraph, saved, and rendered by `apps/web`. A pixel diff of the rendered pages shows change only in the edited paragraph.

## 2. Editor configurations

Studio defines two configs in `apps/cms/src/studio/editor/configs.ts`. They mirror the Payload configs one to one. The Payload configs stay in place because Payload's server validation reads them.

### 2.1 Default (`cleanstartLexicalEditor`, `lib/lexical/editor-config.ts:39-172`)

Used by: `body` on blogs, news, resources, events, knowledgeBase, webinars, guides, legalDocuments, jobs, case-studies; `bioLong` on authors; `postSubmit.body` on forms; the `RichText.body` and `FormBlock` post-submit body page-builder blocks.

Features (these mirror the Payload config, which Payload's server validation reads; how Studio presents them is §5): paragraph; headings h1 to h4; bold, italic, underline, strikethrough, subscript, superscript, inline code; quote; bullet, numbered and check lists; horizontal rule; tables (cell merge on, horizontal scroll on, cell background off); align; indent; links with a `rel` select (follow, nofollow, sponsored, ugc); relationship (load and keep only, see §3); embed; code block and inline CTA blocks; upload with per-placement fields (alt, caption, alignment, size, decorative); fixed toolbar; inline toolbar; rich paste; slash menu; insert menu; block drag handle and add-block button (Payload shows both by default: `LexicalEditor.js:126-128`).

### 2.2 FAQ answer (`faqAnswerLexicalEditor`, `lib/lexical/faq-answer-editor.ts:24-50`)

Used by: `faqs[].answer` on blogs, guides, knowledgeBase (and the FAQ page-builder block).

Features: paragraph; bold; italic; bullet and numbered lists; links with `rel`; fixed toolbar. Nothing else. The toolbar shows only these, and paste strips everything else down to paragraphs, lists, links, bold and italic.

## 3. Node contract

Every node Studio registers, with the exact JSON it must emit. "Insert" says whether Studio offers it in the UI. "Renders" says whether `apps/web` draws it.

| Type | Version | Class in Studio | Insert | Renders | Exact JSON keys |
|---|---|---|---|---|---|
| `root` | 1 | Lexical core | n/a | yes | `children, direction, format, indent, type, version` |
| `paragraph` | 1 | Lexical core `ParagraphNode` | yes | yes | `children, direction, format, indent, type, version, textFormat, textStyle` |
| `text` | 1 | Lexical core | yes | yes | `detail, format, mode, style, text, type, version` |
| `linebreak` | 1 | Lexical core | Shift+Enter | yes | `type, version` |
| `tab` | 1 | Lexical core | no | children only | `detail, format, mode, style, text, type, version` |
| `heading` | 1 | `@lexical/rich-text` `HeadingNode` | h2, h3, h4 (h1 accepted on load, not offered) | yes (h1 demoted to h2) | element keys + `tag` |
| `quote` | 1 | `@lexical/rich-text` `QuoteNode` | yes | yes | element keys |
| `list` | 1 | `@lexical/list` `ListNode` | bullet, number, check | yes (check renders as bullet) | element keys + `listType, start, tag` |
| `listitem` | 1 | `@lexical/list` `ListItemNode` | yes | yes | element keys + `value` (+ `checked` for check lists) |
| `horizontalrule` | 1 | Studio `HorizontalRuleNode` matching Payload's | yes | yes | `type, version` |
| `table` | 1 | `@lexical/table` `TableNode` | yes | yes | element keys + `colWidths` (+ optional frozen and striping keys as Lexical emits) |
| `tablerow` | 1 | `@lexical/table` `TableRowNode` | yes | yes | element keys (+ `height` when set) |
| `tablecell` | 1 | `@lexical/table` `TableCellNode` | yes | yes | element keys + `backgroundColor, colSpan, headerState, rowSpan, width` (+ `verticalAlign` when set) |
| `link` | 3 | Studio `LinkNode` cloned from Payload's | yes | yes | `children, direction, format, indent, type, version, fields` (+ `id` when created in Studio) |
| `autolink` | 2 | Studio `AutoLinkNode` cloned from Payload's | automatic | yes | `children, direction, fields, format, indent, type, version` |
| `upload` | 3 | Studio `UploadNode` cloned from Payload's | yes | yes (needs depth ≥ 1 when read) | `type, version, format, id, relationTo, value, fields` |
| `relationship` | 2 | Studio `RelationshipNode` cloned from Payload's | **no** (Payload hides it today) | **no** | `type, version, format, relationTo, value` |
| `block` | 2 | Studio `BlockNode` cloned from Payload's | codeBlock, inlineCta | yes for these two | `type, version, format, fields: { id, blockName, blockType, ... }` |
| `embed` | 1 | Studio `EmbedNode` sharing the shape of `admin/components/Embed/EmbedNode.ts` | yes | script mode only (see §4.4) | `type, version, format, mode, url, embedUrl, provider, rawHtml, title, aspectRatio, caption, styleSlug` |

Rules:

- **Ids.** New `link`, `upload` and `block` nodes get an id from `bson-objectid` (`new ObjectID().toHexString()`, the same library and version Payload uses, 2.0.4). Nodes loaded without an id (all migrated content) keep no id. Never add ids to existing nodes.
- **Unknown types.** If the census finds a type not in this table (for example legacy `code`), Studio registers a read-only node for it that round-trips its JSON unchanged and renders a "This block can't be edited in Studio" placeholder. It never drops data.
- **No `@lexical/link`.** Its nodes serialize differently from Payload's. Studio clones Payload's `LinkNode` and `AutoLinkNode` serialization (`richtext-lexical/dist/features/link/nodes/LinkNode.js:77-96`).

## 4. Payload-specific shapes

### 4.1 Links

- Stored `fields`: `{ linkType: 'custom', url, newTab, rel }`. Studio never creates `linkType: 'internal'` links, because `apps/web` renders them as `href="#"` (`renderLexical.tsx`). Internal targets are stored as absolute URLs, as today.
- `url` is built with `toStoredUrl` and read with `fromStoredUrl` from `admin/components/internal-routes.ts` (shared, §B of `03`). Paths, `#anchors` and `?queries` are prefixed with the site origin.
- Every `url` Studio writes must pass Payload's `validateUrl` (`richtext-lexical/dist/lexical/utils/url.js`), or the server's beforeChange hook percent-encodes it. Studio runs the same check in the link popover and refuses to save an invalid URL, with an inline error.
- Defaults: internal targets get `rel: 'follow'`, `newTab: false`; external targets get `rel: 'nofollow'`, `newTab: true` (`LinkPopover.tsx:96-114`).
- `link` export deletes `doc` when `linkType` is custom (Payload behaviour); Studio does the same.

### 4.2 Uploads

- `value` is saved as the numeric media id (Postgres). When a document is loaded at depth 1, `value` is the populated media object; the serializer writes `value.id` back.
- `fields` must contain only valid options: `alignment` ∈ left, center, right, full (default center); `size` ∈ small, medium, large, full (default large); `alt` text; `caption` text; `decorative` boolean.
- Paste and drop upload through `media/uploader.ts` (XHR `POST /api/media`), then insert an upload node with `fields { alt, caption: '', alignment: 'center', size: 'large', decorative: false }`, matching `RichPastePlugin.tsx:106-118`.

### 4.3 Blocks inside rich text

- `codeBlock`: `language` (bash, dockerfile, yaml, json, typescript, javascript, python, go, rust, sql, hcl, text; default bash, required), `content` (required), `showLineNumbers` (default true), `highlightLines` (text).
- `inlineCta`: `heading`, `buttonLabel`, `buttonUrl` (all required), `variant` (soft or solid, default soft).
- Block fields render inside the node with the Studio form engine (same field renderers as documents). Server validation rejects unknown `blockType` and missing required fields; Studio validates the same on the client before save.

### 4.4 Embeds

- Shape from `EmbedNode.ts:21-40`. `styleSlug` must be one of `EMBED_STYLE_PRESETS` (`packages/types/src/index.ts:39-97`) or empty.
- `apps/web` renders only sanitized `rawHtml` (script mode); iframe-mode embeds (`rawHtml: ''`) render nothing today, and scripts are stripped. Studio keeps offering both modes for parity, and the embed dialog shows a warning on iframe mode: "Iframe embeds don't show on the live site yet." Fixing the renderer is a separate follow-up.

### 4.5 Server normalisation Studio must accept

- `normalizeLexicalHook` merges adjacent lists with the same `listType` and `start` on save (`hooks/normalize-lexical.ts`). After a save, the editor takes the stored value from the response only if the user has not typed since the save started; otherwise the user's newer state is kept and the form stays dirty (`09` §3.3). The editor is never re-mounted on save.
- `bodyStatsHook` writes `wordCount`, `readingMinutes` and `tableOfContents`. These are read-only in Studio.

## 5. Editor UI

All UI uses the design system. Components live in `apps/cms/src/studio/editor/`.

| Part | Behaviour | Replaces |
|---|---|---|
| Formatting bubble | There is no fixed toolbar (direction B). On a non-empty text selection a bubble appears above the selection (below it when there is no room above; it never covers the selection), in `--primary` with `--on-primary` icons, `--radius-md`. Groups: Text style menu (Paragraph, H2, H3, H4, Quote); Bold, Italic, Underline; More formats menu (Strikethrough, Subscript, Superscript, Inline code); Link; List menu (Bullet, Numbered, Check); Align menu (Left, Centre, Right, Justify); Indent, Outdent. Every button has a tooltip with its shortcut. With the caret inside a table, the bubble adds the cell menu. Keyboard: ⌥F10 moves focus into the bubble; Esc returns focus to the text. | Payload fixed and inline toolbars, `ToolbarTipsPlugin`, `StockToolbarSuppressorPlugin` |
| Slash menu | `/` at the start of an empty paragraph: H2, H3, Quote, Bullet list, Numbered list, Divider, Table, Image, Embed, Code block, CTA card. Filter by typing, arrows, Enter. | `SlashMenuPlugin` |
| Insert menu | Same items as the slash menu, opened from the block handle's "+". | `AddMenuToolbarButton` |
| Block handle | Drag handle and "+" to the left of the hovered or caret block (also shown for the caret block, so keyboard users see it). Drag to reorder; "+" opens the insert menu at that position. Keyboard: ⌥⇧↑ and ⌥⇧↓ move the current block. | Payload `DraggableBlockPlugin`, `AddBlockHandlePlugin` |
| Link popover | ⌘K inside the editor (⌘K elsewhere opens the palette). Tabs Internal and External (URL). Internal search calls the server action `searchLinkTargets({ q })` (in `src/studio/server/actions/editor.ts`), which runs `find` as the user on each routed collection's `useAsTitle` with `like`, published documents only, 5 per collection, and returns title, collection label and stored URL; UI in `editor/link/InternalSearch.tsx`. Replaces the per-collection REST fetches in `LinkInternalSearch.tsx`. Options: open in new tab, rel. Shows the stored URL. Edit and remove from a hover card on existing links. | `LinkPopover`, `LinkPopoverPlugin`, `LinkInternalSearch` |
| Table | Insert with a rows × columns grid picker (mouse and arrow keys, Enter inserts; first row is a header row, `headerState` 1). Cell menu: insert row above or below, insert column left or right, delete row, delete column, merge cells, unmerge, toggle header row, toggle header column, delete table. | `TableGridPicker*`, Payload table plugins |
| Image | Insert dialog (Library, Upload, From URL via S-22). Selected image shows a hover bar: Settings (alt, caption, alignment, size, decorative, plus the media record's alt, credit, folder, rename, focal point), Preview, Replace, Remove. | `InlineImage*` |
| Embed | Dialog: URL (provider detected by `embed-providers.ts`), mode, title, aspect ratio, caption, style preset; script mode shows a code field for `rawHtml`. Node renders a preview card with Edit and Remove. | `Embed*` |
| Code block | Inline block card with language select, code area (mono), line numbers toggle, highlight lines. Inline code exits on Space at the end of the run. | `CodeBlockButton/*` |
| CTA card | Inline block card with heading, button label, URL, variant. | `InlineCtaBlock` admin |
| Rich paste | HTML from Word, Google Docs, Notion and Webflow: normalised by the shared `lib/normalize-rich-html.ts`, `<pre>` becomes a code block, images are ingested through `/api/media-ingest-url` and become upload nodes, form controls are skipped. Plain text pastes as paragraphs. | `RichPastePlugin` |
| Focus mode | ⌘⇧F: hides the sidebar, header actions and inspector and widens the writing column from 680px to 720px. Save status stays visible top right and ⌘S still saves. Esc exits. | `EditorFullscreenToggle` |
| Word count | Live word count and reading time in the document header meta (client-side estimate; the server value is authoritative after save). | `DocHeader` meta |

Keyboard (in addition to Lexical defaults): ⌘B bold · ⌘I italic · ⌘U underline · ⌘E inline code · ⌘K link · ⌘⌥2 to ⌘⌥4 headings H2 to H4 · ⌘⌥0 paragraph · ⌘⌥1 does nothing (H1 is never offered) · ⌘⇧7 numbered list · ⌘⇧8 bullet list · ⌘⇧9 check list · ⌘⇧> quote · Tab and Shift+Tab indent in lists and move between table cells. Outside lists and tables, Tab moves focus out of the editor to the next field (no tab character is inserted), so the editor is never a keyboard trap. Every binding is registered in `shortcuts.ts` (`09` §12).

## 6. Allowed differences in the round-trip test

Only these, each with a test that proves the difference is harmless to the renderer:

1. Empty text nodes in migrated FAQ answers (from `20260821_120000_faq_answer_richtext.ts`) are dropped by Lexical on load. The renderer outputs nothing for them either.
2. Key order inside objects (comparison is structural, not textual).

Any other difference fails the gate and is fixed in the node class, not in the test.

## 7. Phase 0 census (read-only, needs approval)

A script run inside the production CMS container (`ssh cleanstart-cms`, `/app/node_modules/.bin/tsx`, see `docs/operations`) that:

1. Reads every rich-text field of every collection through the Local API at depth 0, in pages of 100.
2. Counts node types, `version` values, key sets per type, `linkType` values, `headerState` values, block types, embed modes and presence of ids.
3. Prints the counts only. No content leaves the server and nothing is written.

The output is saved as `docs/studio/research/richtext-census.md` (created by Task 0.9; it does not exist until then) and becomes fixture input for §1.
