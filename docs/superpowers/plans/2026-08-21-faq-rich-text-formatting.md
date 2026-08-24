# FAQ Answer Rich-Text Formatting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let editors format FAQ answers (bold, italic, links, bullet/numbered lists, soft line breaks) in the Blogs, Guides, and Knowledge Base collections, instead of the current plain-text `textarea`.

**Architecture:** Convert `faqs[].answer` from `type: 'textarea'` to `type: 'richText'` with a new, deliberately minimal Lexical editor config (no headings/tables/embeds/uploads — Schema.org's `FAQPage.acceptedAnswer.text` wants simple content). This is a real column-type change (Postgres `varchar` → `jsonb`), so it needs a migration plus a one-off backfill of existing answers, not just a config edit. Every consumer of `answer` as a plain string — JSON-LD, the admin row-label preview, bulk-paste, and the three FAQ display components — must be updated to handle Lexical JSON instead. Knowledge Base FAQs are currently not wired to the web at all (confirmed: `getKnowledgeArticle` doesn't select `faqs`, no display component exists), so that collection gets net-new FAQ rendering, not just a formatting upgrade.

**Tech Stack:** Payload CMS 3.81 (`@payloadcms/richtext-lexical`), Postgres (`@payloadcms/db-postgres`), Next.js 16 / React 19 (apps/web), Vitest.

**Scope confirmed with the requester:** all three collections (Blogs, Guides, Knowledge Base). Feature set: bold, italic, links, bullet lists, numbered lists, soft line breaks (Shift+Enter). No headings, tables, embeds, uploads, code blocks, or blockquotes.

---

## File structure

| File | Responsibility |
|---|---|
| `apps/cms/src/payload/lib/lexical/to-plain-text.ts` | **New.** Shared Lexical→plain-text serializer (list-item aware). Used by JSON-LD, `FaqRowLabel`, and reused by the existing CSV/XLSX exporter. |
| `apps/cms/src/payload/lib/lexical/faq-answer-editor.ts` | **New.** The constrained Lexical editor config (bold/italic/link/lists/soft-break only). |
| `apps/cms/src/payload/fields/faqs.ts` | **New.** Shared `faqsField()` factory — the `faqs` array field (question + richText answer), replacing the three duplicated inline definitions. |
| `apps/cms/src/payload/collections/Blogs.ts` | Modify — swap inline `faqs` field for `faqsField()`. |
| `apps/cms/src/payload/collections/Guides.ts` | Modify — same swap. |
| `apps/cms/src/payload/collections/KnowledgeBase.ts` | Modify — same swap. |
| `apps/cms/src/payload/admin/components/FaqBulkPaste.tsx` | Modify — build Lexical JSON for pasted answers instead of a joined string. |
| `apps/cms/src/payload/admin/components/FaqRowLabel.tsx` | Modify — "answered" check reads Lexical JSON via the shared serializer. |
| `apps/cms/src/payload/lib/jsonld/faq-page.ts` | Modify — accept a Lexical value for `answer`, serialize to plain text before `acceptedAnswer.text`. |
| `apps/cms/src/payload/lib/jsonld/faq-page.test.ts` | Modify — fixtures use Lexical JSON. |
| `apps/cms/src/payload/lib/jsonld/dispatch.test.ts` | Modify — one FAQ fixture updated. |
| `apps/cms/src/payload/lib/export/serialize-field.ts` | Modify — delegate its inline `lexicalToPlainText` to the new shared module (dedupe). |
| `apps/cms/src/migrations/20260821_120000_faq_answer_richtext.ts` | **New.** Column-type migration for `blogs_faqs`, `guides_faqs`, `knowledge_base_faqs`. |
| `apps/cms/src/migrations/index.ts` | Modify — register the new migration. |
| `apps/cms/scripts/backfill-faq-answer-lexical.ts` | **New.** One-off content backfill (wrapped-string jsonb → real paragraph-node Lexical docs). |
| `apps/web/src/lib/renderLexical.tsx` | Modify — `RenderLexical` gains a `wrapperClassName` prop (default unchanged: `"article-body"`). |
| `apps/web/src/app/globals.css` | Modify — new `.faq-answer-body` rule block. |
| `apps/web/src/lib/blog.ts` | Modify — `BlogFaqItem.answer: string` → `LexicalRoot`. |
| `apps/web/src/lib/guides.ts` | Modify — `GuideFaqItem.answer: string` → `LexicalRoot`. |
| `apps/web/src/lib/knowledge-hub.ts` | Modify — add `faqs` to `KhArticle` + the detail-fetch `select[]`. |
| `apps/web/src/components/sections/blog/BlogDetailFAQ.tsx` | Modify — render via `RenderLexical`. |
| `apps/web/src/components/sections/guide/GuideDetailFAQ.tsx` | Modify — same. |
| `apps/web/src/components/sections/knowledge-hub/KnowledgeHubArticleFAQ.tsx` | **New.** KB has no FAQ display today — new component mirroring the Blog/Guide one. |
| `apps/web/src/components/sections/knowledge-hub/KnowledgeHubArticle.tsx` | Modify — mount the new FAQ component. |

---

### Task 1: Shared Lexical → plain-text serializer

**Files:**
- Create: `apps/cms/src/payload/lib/lexical/to-plain-text.ts`
- Test: `apps/cms/src/payload/lib/lexical/to-plain-text.test.ts`
- Modify: `apps/cms/src/payload/lib/export/serialize-field.ts`

The existing `lexicalToPlainText`/`lexicalNodeToText` in `serialize-field.ts:50-66` joins every text node with a single space, which runs list items together (`"Item oneItem two"` → after the join it becomes `"Item one Item two"`, no boundary). FAQ answers need list-item boundaries preserved for a readable `acceptedAnswer.text`. Extract a shared version that inserts a separator between block-level children (paragraphs, list items) and reuse it from both call sites.

- [ ] **Step 1: Write the failing test**

```typescript
// apps/cms/src/payload/lib/lexical/to-plain-text.test.ts
import { describe, expect, it } from 'vitest';

import { lexicalToPlainText } from './to-plain-text';

const textNode = (text: string) => ({
  type: 'text',
  text,
  format: 0,
  detail: 0,
  mode: 'normal',
  style: '',
  version: 1,
});

const paragraph = (...children: unknown[]) => ({
  type: 'paragraph',
  children,
  direction: null,
  format: '',
  indent: 0,
  version: 1,
});

const listItem = (...children: unknown[]) => ({
  type: 'listitem',
  value: 1,
  children,
  direction: null,
  format: '',
  indent: 0,
  version: 1,
});

const list = (...children: unknown[]) => ({
  type: 'list',
  listType: 'bullet',
  start: 1,
  tag: 'ul',
  children,
  direction: null,
  format: '',
  indent: 0,
  version: 1,
});

const root = (...children: unknown[]) => ({
  root: {
    type: 'root',
    children,
    direction: null,
    format: '',
    indent: 0,
    version: 1,
  },
});

describe('lexicalToPlainText', () => {
  it('returns empty string for null/empty content', () => {
    expect(lexicalToPlainText(null)).toBe('');
    expect(lexicalToPlainText(undefined)).toBe('');
    expect(lexicalToPlainText(root())).toBe('');
  });

  it('joins two paragraphs with a period-space boundary', () => {
    const value = root(paragraph(textNode('First para')), paragraph(textNode('Second para')));
    expect(lexicalToPlainText(value)).toBe('First para. Second para.');
  });

  it('does not double up an existing terminal punctuation mark', () => {
    const value = root(paragraph(textNode('Already ends with a question?')));
    expect(lexicalToPlainText(value)).toBe('Already ends with a question?');
  });

  it('separates list items so they do not run together', () => {
    const value = root(
      paragraph(textNode('Steps:')),
      list(listItem(textNode('Step one')), listItem(textNode('Step two'))),
    );
    expect(lexicalToPlainText(value)).toBe('Steps: Step one. Step two.');
  });

  it('preserves bold/italic text as plain text (formatting is dropped, content is not)', () => {
    const value = root(paragraph(textNode('Bold word'), textNode(' and normal word')));
    expect(lexicalToPlainText(value)).toBe('Bold word and normal word.');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @cleanstart/cms exec vitest run src/payload/lib/lexical/to-plain-text.test.ts`
Expected: FAIL — `Cannot find module './to-plain-text'`

- [ ] **Step 3: Write the implementation**

```typescript
// apps/cms/src/payload/lib/lexical/to-plain-text.ts
/**
 * Flattens a Lexical richText value into plain text. Shared by the JSON-LD
 * FAQPage builder (`acceptedAnswer.text` must be a plain string), the FAQ
 * admin row-label "answered" check, and the CSV/XLSX field exporter.
 *
 * Block-level nodes (paragraph, list item) are joined with `. ` so content
 * that reads as separate lines in the editor doesn't run together as one
 * sentence — a bare space-join makes "Step one" + "Step two" read as
 * "Step oneStep two". A trailing `.`/`?`/`!`/`:` on a block is left as-is
 * rather than doubled.
 */
type LexicalNodeLike = {
  type?: string;
  text?: string;
  children?: unknown[];
};

const BLOCK_TYPES = new Set(['paragraph', 'listitem', 'heading', 'quote']);
const TERMINAL_PUNCTUATION = /[.!?:]\s*$/;

const inlineText = (node: unknown): string => {
  if (node == null || typeof node !== 'object') return '';
  const n = node as LexicalNodeLike;
  if (n.type === 'text' && typeof n.text === 'string') return n.text;
  if (n.type === 'linebreak') return ' ';
  if (Array.isArray(n.children)) return n.children.map(inlineText).join('');
  return '';
};

const blockTexts = (nodes: unknown[]): string[] => {
  const out: string[] = [];
  for (const node of nodes) {
    if (node == null || typeof node !== 'object') continue;
    const n = node as LexicalNodeLike;
    if (n.type === 'list' && Array.isArray(n.children)) {
      out.push(...blockTexts(n.children));
      continue;
    }
    if (n.type && BLOCK_TYPES.has(n.type)) {
      const text = inlineText(n).trim();
      if (text.length > 0) out.push(text);
      continue;
    }
    // Unknown/unsupported node type (shouldn't occur given the constrained
    // FAQ editor, but degrade gracefully rather than dropping content).
    const fallback = inlineText(n).trim();
    if (fallback.length > 0) out.push(fallback);
  }
  return out;
};

export const lexicalToPlainText = (value: unknown): string => {
  const root = (value as { root?: { children?: unknown[] } } | null)?.root;
  if (!root || !Array.isArray(root.children)) return '';
  return blockTexts(root.children)
    .map((block) => (TERMINAL_PUNCTUATION.test(block) ? block : `${block}.`))
    .join(' ')
    .trim();
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @cleanstart/cms exec vitest run src/payload/lib/lexical/to-plain-text.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Delegate `serialize-field.ts` to the shared function**

```typescript
// apps/cms/src/payload/lib/export/serialize-field.ts
// Replace the local `lexicalNodeToText` + `lexicalToPlainText` (lines 50-66)
// with an import from the new shared module:
```

Remove lines 50–66 (`lexicalNodeToText` and the local `lexicalToPlainText`) and add near the top of the file:

```typescript
import { lexicalToPlainText } from '../lexical/to-plain-text';
```

The rest of `serialize-field.ts` is unchanged — `serializeFieldValue`'s `if (fieldType === 'richText')` branch already calls `lexicalToPlainText(value)`.

- [ ] **Step 6: Run the CMS test suite to confirm no export regressions**

Run: `pnpm --filter @cleanstart/cms test`
Expected: PASS — existing export-serialization tests still pass against the new (slightly richer) plain-text output. If any export snapshot test asserts the old space-joined format for a multi-paragraph richText field, update that expected string to the new period-joined format.

- [ ] **Step 7: Commit**

```bash
git add apps/cms/src/payload/lib/lexical/to-plain-text.ts apps/cms/src/payload/lib/lexical/to-plain-text.test.ts apps/cms/src/payload/lib/export/serialize-field.ts
git commit -m "refactor(cms): extract shared Lexical-to-plain-text serializer"
```

---

### Task 2: Minimal FAQ-answer Lexical editor

**Files:**
- Create: `apps/cms/src/payload/lib/lexical/faq-answer-editor.ts`

The only editor config in the repo today is `cleanstartLexicalEditor()` ([editor-config.ts:39-172](apps/cms/src/payload/lib/lexical/editor-config.ts)) — the full kitchen sink. FAQ answers need a much smaller feature set, reusing the same `LinkFeature` `rel` options for consistency.

- [ ] **Step 1: Write the editor config**

```typescript
// apps/cms/src/payload/lib/lexical/faq-answer-editor.ts
import {
  BoldFeature,
  FixedToolbarFeature,
  ItalicFeature,
  LinkFeature,
  OrderedListFeature,
  ParagraphFeature,
  UnorderedListFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical';

/**
 * Constrained editor for FAQ answers (Blogs / Guides / Knowledge Base
 * `faqs[].answer`). Deliberately smaller than `cleanstartLexicalEditor()`
 * (../editor-config.ts) — no headings, tables, embeds, uploads, or code
 * blocks. Schema.org's FAQPage `acceptedAnswer.text` is meant to stay
 * simple, and JSON-LD flattens this to plain text anyway (see
 * `lib/jsonld/faq-page.ts`), so any richer structure would be silently
 * discarded there.
 *
 * `LinkFeature`'s `rel` field mirrors `cleanstartLexicalEditor()`'s so
 * link-rel handling stays consistent across both editors.
 */
export const faqAnswerLexicalEditor = () =>
  lexicalEditor({
    features: () => [
      ParagraphFeature(),
      BoldFeature(),
      ItalicFeature(),
      UnorderedListFeature(),
      OrderedListFeature(),
      LinkFeature({
        fields: [
          {
            name: 'rel',
            type: 'select',
            defaultValue: 'follow',
            options: [
              { label: 'follow', value: 'follow' },
              { label: 'nofollow', value: 'nofollow' },
              { label: 'sponsored', value: 'sponsored' },
              { label: 'ugc', value: 'ugc' },
            ],
          },
        ],
      }),
      FixedToolbarFeature(),
    ],
  });
```

Soft line breaks (Shift+Enter) don't need a separate feature — `linebreak` node support is baked into Lexical's core, not gated behind a Payload feature flag. It works as soon as `lexicalEditor(...)` is the field's editor.

- [ ] **Step 2: Commit**

```bash
git add apps/cms/src/payload/lib/lexical/faq-answer-editor.ts
git commit -m "feat(cms): add constrained Lexical editor for FAQ answers"
```

---

### Task 3: Shared `faqsField` factory, wired into all three collections

**Files:**
- Create: `apps/cms/src/payload/fields/faqs.ts`
- Modify: `apps/cms/src/payload/collections/Blogs.ts:66-98`
- Modify: `apps/cms/src/payload/collections/Guides.ts:66-95`
- Modify: `apps/cms/src/payload/collections/KnowledgeBase.ts:86-112`

The `faqsBulkPaste` UI field + `faqs` array field are byte-identical across all three collections (three callers — matches this repo's own "extract at the third caller" convention). Extract both into one shared field module.

- [ ] **Step 1: Write the shared field**

```typescript
// apps/cms/src/payload/fields/faqs.ts
import type { Field } from 'payload';

import { faqAnswerLexicalEditor } from '../lib/lexical/faq-answer-editor';

/**
 * Shared `faqsBulkPaste` (UI-only paste helper) + `faqs` array field used
 * identically by Blogs, Guides, and Knowledge Base. `answer` is richText
 * (see `faqAnswerLexicalEditor`) — bold/italic/links/lists/soft breaks
 * only. JSON-LD flattens it to plain text for `acceptedAnswer.text` (see
 * `lib/jsonld/faq-page.ts`).
 */
export const faqsBulkPasteField: Field = {
  name: 'faqsBulkPaste',
  type: 'ui',
  admin: {
    components: {
      Field: {
        path: '@/payload/admin/components/FaqBulkPaste.tsx#FaqBulkPaste',
        clientProps: { targetField: 'faqs' },
      },
    },
  },
};

export const faqsField: Field = {
  name: 'faqs',
  type: 'array',
  labels: { singular: 'FAQ', plural: 'FAQs' },
  admin: {
    // Start collapsed — a formatted, potentially multi-paragraph answer
    // makes an expanded 5-FAQ list dominate the form; the row summary
    // already shows the question text, so collapsed is the better default.
    initCollapsed: true,
    components: {
      RowLabel: '@/payload/admin/components/FaqRowLabel.tsx#FaqRowLabel',
    },
  },
  fields: [
    { name: 'question', type: 'text', required: true },
    { name: 'answer', type: 'richText', required: true, editor: faqAnswerLexicalEditor() },
  ],
};
```

- [ ] **Step 2: Wire into Blogs.ts**

In `apps/cms/src/payload/collections/Blogs.ts`, replace lines 67–98:

```typescript
    {
      name: 'faqsBulkPaste',
      type: 'ui',
      admin: {
        components: {
          Field: {
            path: '@/payload/admin/components/FaqBulkPaste.tsx#FaqBulkPaste',
            clientProps: { targetField: 'faqs' },
          },
        },
      },
    },
    {
      name: 'faqs',
      type: 'array',
      labels: { singular: 'FAQ', plural: 'FAQs' },
      admin: {
        // Start collapsed — long answer paragraphs make an expanded
        // 5-FAQ list dominate the form; the row summary already shows
        // the question text, so collapsed is the better default.
        initCollapsed: true,
        components: {
          RowLabel: '@/payload/admin/components/FaqRowLabel.tsx#FaqRowLabel',
        },
      },
      fields: [
        { name: 'question', type: 'text', required: true },
        // Plain-text answer — matches Schema.org `acceptedAnswer.text`
        // and keeps each FAQ row compact. Multiple paragraphs via
        // line breaks.
        { name: 'answer', type: 'textarea', required: true },
      ],
    },
```

with:

```typescript
    faqsBulkPasteField,
    faqsField,
```

and add the import near the top of the file (alongside the other `../fields/*` imports):

```typescript
import { faqsBulkPasteField, faqsField } from '../fields/faqs';
```

- [ ] **Step 3: Wire into Guides.ts**

Same replacement in `apps/cms/src/payload/collections/Guides.ts:66-95`, plus the same import line.

- [ ] **Step 4: Wire into KnowledgeBase.ts**

Same replacement in `apps/cms/src/payload/collections/KnowledgeBase.ts:86-112`, plus the same import line.

- [ ] **Step 5: Typecheck**

Run: `pnpm --filter @cleanstart/cms typecheck`
Expected: PASS. (The admin UI and DB migration for this field-type change happen in later tasks — typecheck only validates the Payload config shape compiles.)

- [ ] **Step 6: Commit**

```bash
git add apps/cms/src/payload/fields/faqs.ts apps/cms/src/payload/collections/Blogs.ts apps/cms/src/payload/collections/Guides.ts apps/cms/src/payload/collections/KnowledgeBase.ts
git commit -m "feat(cms): convert FAQ answer to a constrained richText field"
```

---

### Task 4: `FaqBulkPaste` builds Lexical JSON

**Files:**
- Modify: `apps/cms/src/payload/admin/components/FaqBulkPaste.tsx:30-39,120-130`

`buildSubFieldState` (lines 30–39) currently joins pasted paragraphs into a plain string. It must build a minimal Lexical doc instead — one paragraph node per pasted paragraph, no formatting (bulk-paste never carries bold/italic/links; editors can add those afterward).

- [ ] **Step 1: Add a plain-paragraphs → Lexical-JSON helper and use it**

Replace `buildSubFieldState` (lines 30–39):

```typescript
const paragraphsToLexical = (paragraphs: string[]): Record<string, unknown> => ({
  root: {
    type: 'root',
    children: paragraphs
      .filter((p) => p.trim().length > 0)
      .map((text) => ({
        type: 'paragraph',
        children: [
          {
            type: 'text',
            text,
            format: 0,
            detail: 0,
            mode: 'normal',
            style: '',
            version: 1,
          },
        ],
        direction: null,
        format: '',
        indent: 0,
        version: 1,
      })),
    direction: null,
    format: '',
    indent: 0,
    version: 1,
  },
});

const buildSubFieldState = (
  question: string,
  answerParagraphs: string[],
): Record<string, { initialValue: unknown; value: unknown; valid: true }> => {
  const answerLexical = paragraphsToLexical(answerParagraphs);
  return {
    question: { initialValue: question, value: question, valid: true },
    answer: { initialValue: answerLexical, value: answerLexical, valid: true },
  };
};
```

- [ ] **Step 2: Update the single-row (non-bulk) paste path**

At line ~120 (`handlePaste`), `firstAnswer` is built as a joined string and dispatched directly:

```typescript
const firstAnswer = firstPair.answerParagraphs.join('\n\n');
dispatchFields({
  type: 'UPDATE',
  path: `${arrayPath}.${startIndex}.answer`,
  value: firstAnswer,
});
```

Replace with:

```typescript
const firstAnswer = paragraphsToLexical(firstPair.answerParagraphs);
dispatchFields({
  type: 'UPDATE',
  path: `${arrayPath}.${startIndex}.answer`,
  value: firstAnswer,
});
```

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter @cleanstart/cms typecheck`
Expected: PASS

- [ ] **Step 4: Manual verification (after Task 9's migration is applied to your local dev DB)**

In `pnpm --filter @cleanstart/cms dev`, open a Blog with the `faqsBulkPaste` field, paste a multi-Q&A block (`1. Question one?\nAnswer para one.\n\n2. Question two?\nAnswer para two.`), confirm two FAQ rows appear with the answer rendered in the Lexical editor (not literal `\n` characters).

- [ ] **Step 5: Commit**

```bash
git add apps/cms/src/payload/admin/components/FaqBulkPaste.tsx
git commit -m "fix(cms): FAQ bulk-paste builds Lexical JSON for the new richText answer"
```

---

### Task 5: `FaqRowLabel` reads the Lexical answer

**Files:**
- Modify: `apps/cms/src/payload/admin/components/FaqRowLabel.tsx`

`answered` (line 27) does `(data?.answer ?? '').trim() !== ''`, which breaks once `answer` is an object. Use the shared plain-text serializer (Task 1) to check for real content — it's already a small, dependency-free module, safe to import from a `'use client'` component.

- [ ] **Step 1: Update the type and the `answered` check**

```typescript
// apps/cms/src/payload/admin/components/FaqRowLabel.tsx
'use client';

import { useRowLabel } from '@payloadcms/ui';
import type { ReactElement } from 'react';

import { lexicalToPlainText } from '../../lib/lexical/to-plain-text';

type FaqRowData = {
  question?: string | null;
  answer?: unknown;
};

const truncate = (input: string, max: number): string =>
  input.length > max ? `${input.slice(0, max - 1).trimEnd()}…` : input;

export const FaqRowLabel = (): ReactElement => {
  const { data, rowNumber } = useRowLabel<FaqRowData>();
  const number = (rowNumber ?? 0) + 1;
  const question = (data?.question ?? '').trim();
  const answered = lexicalToPlainText(data?.answer).length > 0;
  const numLabel = String(number).padStart(2, '0');

  if (!question) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, opacity: 0.6 }}>{numLabel}</span>
        <span style={{ opacity: 0.6 }}>Empty FAQ</span>
      </span>
    );
  }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, opacity: 0.6 }}>{numLabel}</span>
      <span>{truncate(question, 100)}</span>
      <span
        aria-label={answered ? 'Answer filled' : 'Answer empty'}
        title={answered ? 'Answer filled' : 'Answer empty'}
        style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          padding: '2px 6px',
          borderRadius: 999,
          color: answered ? 'var(--cs-cyan-500, #06c7f2)' : 'var(--theme-text-disabled)',
          background: answered
            ? 'var(--cs-tint-brand-soft, rgba(6,199,242,0.08))'
            : 'var(--theme-elevation-150, rgba(0,0,0,0.04))',
        }}
      >
        {answered ? '· answered' : '· empty'}
      </span>
    </span>
  );
};
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter @cleanstart/cms typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/cms/src/payload/admin/components/FaqRowLabel.tsx
git commit -m "fix(cms): FAQ row-label answered-check reads Lexical JSON"
```

---

### Task 6: JSON-LD `FAQPage` accepts richText answers

**Files:**
- Modify: `apps/cms/src/payload/lib/jsonld/faq-page.ts`
- Modify: `apps/cms/src/payload/lib/jsonld/faq-page.test.ts`
- Modify: `apps/cms/src/payload/lib/jsonld/dispatch.test.ts:52-68`

`buildFaqPageBlob` requires `answer: string` and assigns it straight to `acceptedAnswer.text` ([faq-page.ts:19-30](apps/cms/src/payload/lib/jsonld/faq-page.ts)). It must accept the Lexical value and flatten it via the Task 1 serializer.

- [ ] **Step 1: Update `faq-page.ts`**

```typescript
// apps/cms/src/payload/lib/jsonld/faq-page.ts
import { lexicalToPlainText } from '../lexical/to-plain-text';
import type { JsonLdBlob } from './types';

export interface FaqEntry {
  readonly question?: string | null;
  readonly answer?: unknown;
}

/**
 * Build a FAQPage blob from a `faqs[]` array. Returns null when no
 * complete (question + answer) entries exist — emitting an empty
 * mainEntity[] is a Schema.org validator error.
 *
 * `answer` is Lexical richText JSON (bold/italic/links/lists) — flattened
 * to plain text via `lexicalToPlainText` since `acceptedAnswer.text` must
 * be a plain string per Schema.org.
 */
export const buildFaqPageBlob = (
  pageId: string,
  faqs: readonly FaqEntry[] | null | undefined,
): JsonLdBlob | null => {
  const entries = (faqs ?? [])
    .map((f) => ({
      question: typeof f.question === 'string' ? f.question : '',
      answerText: lexicalToPlainText(f.answer),
    }))
    .filter((f) => f.question.length > 0 && f.answerText.length > 0)
    .map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.answerText,
      },
    }));

  if (entries.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${pageId}#faq`,
    mainEntity: entries,
  };
};
```

- [ ] **Step 2: Update `faq-page.test.ts` fixtures**

```typescript
// apps/cms/src/payload/lib/jsonld/faq-page.test.ts
import { describe, expect, it } from 'vitest';

import { buildFaqPageBlob } from './faq-page';

const PAGE_ID = 'https://cleanstart.com/blogs/example';

const lexicalAnswer = (text: string) => ({
  root: {
    type: 'root',
    children: [
      {
        type: 'paragraph',
        children: [{ type: 'text', text, format: 0, detail: 0, mode: 'normal', style: '', version: 1 }],
        direction: null,
        format: '',
        indent: 0,
        version: 1,
      },
    ],
    direction: null,
    format: '',
    indent: 0,
    version: 1,
  },
});

describe('buildFaqPageBlob', () => {
  it('returns null for missing / empty / partial entries', () => {
    expect(buildFaqPageBlob(PAGE_ID, null)).toBeNull();
    expect(buildFaqPageBlob(PAGE_ID, [])).toBeNull();
    expect(buildFaqPageBlob(PAGE_ID, [{ question: 'Q', answer: lexicalAnswer('') }])).toBeNull();
    expect(buildFaqPageBlob(PAGE_ID, [{ question: '', answer: lexicalAnswer('A') }])).toBeNull();
    expect(buildFaqPageBlob(PAGE_ID, [{ question: null, answer: lexicalAnswer('A') }])).toBeNull();
  });

  it('drops partial rows but keeps complete ones', () => {
    const blob = buildFaqPageBlob(PAGE_ID, [
      { question: 'Q1', answer: lexicalAnswer('A1') },
      { question: '', answer: lexicalAnswer('A2') },
      { question: 'Q3', answer: lexicalAnswer('A3') },
    ]);
    expect(blob).not.toBeNull();
    expect((blob as unknown as { mainEntity: unknown[] }).mainEntity).toHaveLength(2);
  });

  it('emits a well-formed FAQPage with @id at #faq, flattening richText to plain text', () => {
    expect(
      buildFaqPageBlob(PAGE_ID, [{ question: 'Why?', answer: lexicalAnswer('Because.') }]),
    ).toEqual({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      '@id': `${PAGE_ID}#faq`,
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Why?',
          acceptedAnswer: { '@type': 'Answer', text: 'Because.' },
        },
      ],
    });
  });
});
```

- [ ] **Step 3: Update `dispatch.test.ts` fixture**

In `apps/cms/src/payload/lib/jsonld/dispatch.test.ts:57`, replace:

```typescript
faqs: [{ question: 'Why?', answer: 'Because.' }],
```

with:

```typescript
faqs: [{ question: 'Why?', answer: lexicalAnswer('Because.') }],
```

and add the same `lexicalAnswer` helper used in Step 2 near the top of `dispatch.test.ts` (or import it — simplest is to inline the same small helper function in this file too, since it's an 8-line fixture builder, not shared production code).

- [ ] **Step 4: Run the CMS test suite**

Run: `pnpm --filter @cleanstart/cms test`
Expected: PASS — `faq-page.test.ts` and `dispatch.test.ts` both green.

- [ ] **Step 5: Commit**

```bash
git add apps/cms/src/payload/lib/jsonld/faq-page.ts apps/cms/src/payload/lib/jsonld/faq-page.test.ts apps/cms/src/payload/lib/jsonld/dispatch.test.ts
git commit -m "fix(cms): FAQPage JSON-LD flattens richText answers to plain text"
```

---

### Task 7: Database migration (`answer` column → `jsonb`)

**Files:**
- Create: `apps/cms/src/migrations/20260821_120000_faq_answer_richtext.ts`
- Modify: `apps/cms/src/migrations/index.ts`

Confirmed via direct inspection of the prod DB: `blogs_faqs.answer`, `guides_faqs.answer`, `knowledge_base_faqs.answer` are all `character varying`. Postgres cannot auto-cast an arbitrary string to the Lexical `{root:{...}}` shape — `to_jsonb(answer)` merely wraps the raw string as a JSON *string* value (e.g. `"Some answer text"`), not a real Lexical document. That's fine as an intermediate state: `RenderLexical` on the web guards on `content?.root?.children?.length` and safely renders nothing (not a crash) for a bare-string jsonb value, and Task 8's backfill script converts every row to a proper Lexical doc immediately after this migration runs.

- [ ] **Step 1: Generate the migration scaffold (interactive — needs a TTY)**

Run (in an interactive terminal, not headless):

```bash
pnpm --filter @cleanstart/cms migrate:create faq_answer_richtext
```

This produces a timestamped file in `apps/cms/src/migrations/` plus an updated `.json` schema snapshot. **Do not trust its auto-generated SQL for this change** — Payload's schema differ typically emits a `DROP COLUMN` + `ADD COLUMN` pair for a field-type change, which would silently delete every existing FAQ answer. Discard the generated `up()`/`down()` bodies and replace them with Step 2's hand-written SQL, keeping the generated filename/timestamp and the `.json` snapshot as-is (the snapshot only needs to reflect the *final* schema shape, which the hand-written SQL still produces).

- [ ] **Step 2: Replace the migration body with a safe cast**

```typescript
// apps/cms/src/migrations/20260821_120000_faq_answer_richtext.ts
import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

const TABLES = ['blogs_faqs', 'guides_faqs', 'knowledge_base_faqs'] as const

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const table of TABLES) {
    // `to_jsonb(answer)` wraps the existing plain string as a bare JSON
    // string value (not a real Lexical `{root:{...}}` doc) — safe,
    // lossless, and exactly what apps/cms/scripts/backfill-faq-answer-lexical.ts
    // expects to find and convert immediately after this migration runs.
    await db.execute(sql.raw(`
      ALTER TABLE "${table}"
      ALTER COLUMN "answer" TYPE jsonb
      USING to_jsonb("answer");
    `))
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const table of TABLES) {
    // Reverse cast: a jsonb *string* value round-trips cleanly back to
    // varchar via `#>> '{}'`. A real Lexical doc (post-backfill) would
    // NOT round-trip meaningfully — this down() is only safe to run
    // before apps/cms/scripts/backfill-faq-answer-lexical.ts has been
    // executed against the target database.
    await db.execute(sql.raw(`
      ALTER TABLE "${table}"
      ALTER COLUMN "answer" TYPE character varying
      USING ("answer" #>> '{}');
    `))
  }
}
```

- [ ] **Step 3: Register it in `index.ts`**

`migrate:create` normally does this automatically — confirm the generated entry looks like:

```typescript
{
  up: migration_20260821_120000_faq_answer_richtext.up,
  down: migration_20260821_120000_faq_answer_richtext.down,
  name: '20260821_120000_faq_answer_richtext',
},
```

appended to the `migrations` array in `apps/cms/src/migrations/index.ts`, with the matching `import * as migration_20260821_120000_faq_answer_richtext from './20260821_120000_faq_answer_richtext'` added near the top alongside the other migration imports.

- [ ] **Step 4: Apply it to your local dev database**

Run: `pnpm --filter @cleanstart/cms migrate`
Expected: the new migration runs, `\d blogs_faqs` (via `psql`) shows `answer` as `jsonb`.

- [ ] **Step 5: Sanity-check existing local FAQ data survived as wrapped strings**

Run: `psql <local-db> -c "SELECT id, answer FROM blogs_faqs LIMIT 3;"`
Expected: each `answer` is a JSON string literal like `"Some existing answer text"` — not `null`, not a real Lexical doc yet (that's Task 8).

- [ ] **Step 6: Commit**

```bash
git add apps/cms/src/migrations/20260821_120000_faq_answer_richtext.ts apps/cms/src/migrations/20260821_120000_faq_answer_richtext.json apps/cms/src/migrations/index.ts
git commit -m "feat(cms): migrate FAQ answer columns from varchar to jsonb"
```

---

### Task 8: Regenerate types, full CMS verification

**Files:**
- Modify: `apps/cms/payload-types.ts` (generated — do not hand-edit)

- [ ] **Step 1: Regenerate types**

Run: `pnpm --filter @cleanstart/cms generate:types`
Expected: `Blog['faqs'][number]['answer']`, `Guide['faqs'][number]['answer']`, and the Knowledge Base equivalent all change from `string` to Payload's generated `SerializedEditorState` (Lexical) type in `apps/cms/payload-types.ts`.

- [ ] **Step 2: Full CMS checks**

Run, in order, fixing anything that fails before moving on:

```bash
pnpm --filter @cleanstart/cms lint
pnpm --filter @cleanstart/cms typecheck
pnpm --filter @cleanstart/cms test
pnpm --filter @cleanstart/cms build
```

Expected: all four pass. The build step also re-runs `generate:importmap`, which should pick up no changes (no new admin components were added, only edited).

- [ ] **Step 3: Commit**

```bash
git add apps/cms/payload-types.ts
git commit -m "chore(cms): regenerate payload-types.ts for FAQ richText answer"
```

---

### Task 9: Content backfill — convert wrapped strings to real Lexical docs

**Files:**
- Create: `apps/cms/scripts/backfill-faq-answer-lexical.ts`

Existing FAQ answers now sit in the DB as bare JSON strings (`"Some\n\nmulti-paragraph answer"`), not real Lexical documents — the admin editor and `RenderLexical` on the web both expect the full `{root:{children:[...]}}` shape. This script finds every FAQ row across the three collections whose `answer` is still a plain string and rewrites it as a real Lexical doc, splitting on the same `\n`/`\n\n` boundaries the old plain-text renderers used (`BlogDetailFAQ.tsx:104`, `GuideDetailFAQ.tsx:106`) so converted content reads identically to before.

- [ ] **Step 1: Write the script**

```typescript
#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/**
 * One-time backfill: converts `faqs[].answer` from a bare JSON string
 * (the intermediate state left by migration 20260821_120000_faq_answer_
 * richtext.ts's `to_jsonb(answer)` cast) into a real Lexical richText
 * document, so the admin editor and the web `RenderLexical` component
 * both see valid content instead of an unparseable string.
 *
 * Splits on blank lines into paragraphs (mirrors the old plain-text
 * renderers' `.split("\n")` behavior) — converted answers render
 * identically to how they looked before this migration.
 *
 * Idempotent: skips any row whose `answer` is already a real Lexical
 * doc (has a `root.children` array) rather than a bare string.
 *
 * Usage:
 *   DRY_RUN=1 pnpm exec tsx scripts/backfill-faq-answer-lexical.ts
 *   pnpm exec tsx scripts/backfill-faq-answer-lexical.ts
 */
import { getPayload } from 'payload';

import payloadConfig from '../src/payload.config.ts';

const COLLECTIONS = ['blogs', 'guides', 'knowledgeBase'] as const;
const DRY_RUN = process.env.DRY_RUN === '1';

type FaqRow = { id?: string; question?: string; answer?: unknown };

const isBareString = (value: unknown): value is string => typeof value === 'string';

const isAlreadyLexical = (value: unknown): boolean =>
  typeof value === 'object' &&
  value !== null &&
  Array.isArray((value as { root?: { children?: unknown } }).root?.children);

const textNode = (text: string) => ({
  type: 'text',
  text,
  format: 0,
  detail: 0,
  mode: 'normal',
  style: '',
  version: 1,
});

const paragraphNode = (text: string) => ({
  type: 'paragraph',
  children: [textNode(text)],
  direction: null,
  format: '',
  indent: 0,
  version: 1,
});

const stringToLexical = (raw: string) => {
  const paragraphs = raw.split('\n').filter((line) => line.trim().length > 0);
  return {
    root: {
      type: 'root',
      children:
        paragraphs.length > 0 ? paragraphs.map(paragraphNode) : [paragraphNode(raw.trim())],
      direction: null,
      format: '',
      indent: 0,
      version: 1,
    },
  };
};

const run = async (): Promise<void> => {
  const payload = await getPayload({ config: payloadConfig });
  let totalConverted = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const collection of COLLECTIONS) {
    const result = await payload.find({
      collection,
      limit: 1000,
      pagination: false,
      depth: 0,
      overrideAccess: true,
    });

    for (const doc of result.docs) {
      const typed = doc as { id: string | number; faqs?: FaqRow[] | null };
      const faqs = typed.faqs;
      if (!Array.isArray(faqs) || faqs.length === 0) continue;

      let touched = false;
      const nextFaqs = faqs.map((row) => {
        if (!isBareString(row.answer)) {
          if (!isAlreadyLexical(row.answer)) {
            // eslint-disable-next-line no-console -- script output
            console.warn(
              `  ? ${collection}#${String(typed.id)}: unexpected answer shape, left untouched`,
            );
          }
          return row;
        }
        touched = true;
        return { ...row, answer: stringToLexical(row.answer) };
      });

      if (!touched) {
        totalSkipped += 1;
        continue;
      }

      // eslint-disable-next-line no-console -- script output
      console.log(`  ${DRY_RUN ? '[dry run] would convert' : 'converting'} ${collection}#${String(typed.id)} (${nextFaqs.filter((r) => r !== faqs.find((f) => f === r)).length} of ${nextFaqs.length} rows)`);

      if (DRY_RUN) {
        totalConverted += 1;
        continue;
      }

      try {
        await payload.update({
          collection,
          id: typed.id,
          data: { faqs: nextFaqs } as Record<string, unknown>,
          overrideAccess: true,
        });
        totalConverted += 1;
      } catch (err) {
        totalErrors += 1;
        const message = err instanceof Error ? err.message : String(err);
        // eslint-disable-next-line no-console -- script output
        console.error(`  ! ${collection}#${String(typed.id)}: ${message}`);
      }
    }
  }

  // eslint-disable-next-line no-console -- script output
  console.log(
    `\nDone. Converted ${totalConverted} docs. Skipped (already Lexical / no FAQs) ${totalSkipped}. Errors: ${totalErrors}.`,
  );
  process.exit(totalErrors > 0 ? 1 : 0);
};

run().catch((err: unknown) => {
  const message = err instanceof Error ? err.stack ?? err.message : String(err);
  // eslint-disable-next-line no-console -- script output
  console.error(message);
  process.exit(1);
});
```

- [ ] **Step 2: Dry-run against local dev DB**

Run: `DRY_RUN=1 pnpm --filter @cleanstart/cms exec tsx scripts/backfill-faq-answer-lexical.ts`
Expected: lists every Blog/Guide/KB doc with FAQs, marked `[dry run] would convert`, zero errors.

- [ ] **Step 3: Run for real against local dev DB**

Run: `pnpm --filter @cleanstart/cms exec tsx scripts/backfill-faq-answer-lexical.ts`
Expected: `Converted N docs. ... Errors: 0.`

- [ ] **Step 4: Verify in the admin UI**

Run `pnpm --filter @cleanstart/cms dev`, open a Blog post that had FAQs before this change, confirm the answer renders as real paragraphs in the Lexical editor (not a raw JSON string), and that adding bold/italic/a link/a bullet list and saving works.

- [ ] **Step 5: Commit**

```bash
git add apps/cms/scripts/backfill-faq-answer-lexical.ts
git commit -m "feat(cms): backfill script to convert legacy FAQ answers to Lexical docs"
```

---

### Task 10: Web — `RenderLexical` wrapper class + FAQ-answer styling

**Files:**
- Modify: `apps/web/src/lib/renderLexical.tsx:459-470`
- Modify: `apps/web/src/app/globals.css` (new block after line 3971)

`RenderLexical` hardcodes the `article-body` wrapper class, whose CSS (`globals.css:3843-3971`) is sized for full article prose (larger body text, different color/weight than the compact FAQ-answer look the accordion currently uses). Add an optional `wrapperClassName` so FAQ answers get their own, smaller-scoped styling while reusing the exact same node-rendering logic (bold/italic/link/list — the only node types the constrained editor can ever produce).

- [ ] **Step 1: Add the prop**

```typescript
// apps/web/src/lib/renderLexical.tsx
interface RenderLexicalProps {
  content: LexicalRoot | null | undefined;
  className?: string;
  /** Defaults to "article-body" (full-article prose styling). Pass
   * "faq-answer-body" for the compact FAQ-answer look. */
  wrapperClassName?: string;
}

export function RenderLexical({
  content,
  className = "",
  wrapperClassName = "article-body",
}: RenderLexicalProps): React.ReactElement | null {
  if (!content?.root?.children?.length) return null;

  return (
    <div className={`${wrapperClassName} ${className}`}>
      {renderNodes(content.root.children, "root")}
    </div>
  );
}
```

- [ ] **Step 2: Add the FAQ-answer CSS block**

Append after the existing `.article-body .article-li` rule (`globals.css:3968-3971`):

```css
/* FAQ answers (Blogs / Guides / Knowledge Base `faqs[].answer`) — reuses
   the same article-{paragraph,ul,ol,li} classes RenderLexical emits, but
   scoped smaller/lighter to match the accordion's existing compact look
   (was previously hardcoded inline in BlogDetailFAQ.tsx / GuideDetailFAQ.tsx). */
.faq-answer-body {
  font-family: var(--font-sora), ui-sans-serif, system-ui, sans-serif;
}

.faq-answer-body .article-paragraph {
  font-size: var(--fs-body-sm);
  font-weight: 400;
  line-height: 1.65;
  letter-spacing: -0.01em;
  color: rgba(17, 17, 17, 0.65);
  margin-bottom: 12px;
}

.faq-answer-body .article-paragraph:last-child {
  margin-bottom: 0;
}

.faq-answer-body .article-paragraph strong,
.faq-answer-body .article-paragraph b,
.faq-answer-body .article-li strong,
.faq-answer-body .article-li b {
  font-weight: 700;
}

.faq-answer-body .article-ul,
.faq-answer-body .article-ol {
  font-size: var(--fs-body-sm);
  line-height: 1.65;
  letter-spacing: -0.01em;
  color: rgba(17, 17, 17, 0.65);
  padding-left: 1.25em;
  margin-bottom: 12px;
}

.faq-answer-body .article-ul {
  list-style-type: disc;
}

.faq-answer-body .article-ol {
  list-style-type: decimal;
}

.faq-answer-body .article-li {
  margin-bottom: 0.25em;
  line-height: 1.5;
}

.faq-answer-body .article-li:last-child {
  margin-bottom: 0;
}
```

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter @cleanstart/web typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/lib/renderLexical.tsx apps/web/src/app/globals.css
git commit -m "feat(web): add a compact wrapper style for FAQ-answer richText"
```

---

### Task 11: Web — Blog and Guide FAQ types + rendering

**Files:**
- Modify: `apps/web/src/lib/blog.ts:230-234`
- Modify: `apps/web/src/lib/guides.ts:13-17`
- Modify: `apps/web/src/components/sections/blog/BlogDetailFAQ.tsx:1-10,103-119`
- Modify: `apps/web/src/components/sections/guide/GuideDetailFAQ.tsx:1-10,105-121`

- [ ] **Step 1: Update `BlogFaqItem` in `blog.ts`**

Replace lines 230–234:

```typescript
export type BlogFaqItem = {
  id?: string;
  question: string;
  answer: string;
};
```

with:

```typescript
export type BlogFaqItem = {
  id?: string;
  question: string;
  answer: LexicalRoot;
};
```

- [ ] **Step 2: Update `GuideFaqItem` in `guides.ts`**

Replace lines 13–17:

```typescript
export type GuideFaqItem = {
  id?: string;
  question: string;
  answer: string;
};
```

with:

```typescript
export type GuideFaqItem = {
  id?: string;
  question: string;
  answer: LexicalRoot;
};
```

(`LexicalRoot` is already imported into `guides.ts` at line 2.)

- [ ] **Step 3: Update `BlogDetailFAQ.tsx` rendering**

Add the import:

```typescript
import { RenderLexical } from "@/lib/renderLexical";
```

Replace lines 103–119:

```typescript
                      <div style={{ padding: "0 24px 20px" }}>
                        {item.answer.split("\n").map((para, j) =>
                          para.trim() ? (
                            <p
                              key={j}
                              className="font-normal leading-[1.65] tracking-[-0.01em]"
                              style={{
                                fontSize: "var(--fs-body-sm)",
                                color: "rgba(17,17,17,0.65)",
                                marginBottom: j < item.answer.split("\n").filter(Boolean).length - 1 ? "12px" : "0",
                              }}
                            >
                              {para}
                            </p>
                          ) : null
                        )}
                      </div>
```

with:

```typescript
                      <div style={{ padding: "0 24px 20px" }}>
                        <RenderLexical content={item.answer} wrapperClassName="faq-answer-body" />
                      </div>
```

- [ ] **Step 4: Update `GuideDetailFAQ.tsx` rendering**

Same change: add the `RenderLexical` import, replace lines 105–121 (the identical block) with:

```typescript
                      <div style={{ padding: "0 24px 20px" }}>
                        <RenderLexical content={item.answer} wrapperClassName="faq-answer-body" />
                      </div>
```

- [ ] **Step 5: Typecheck**

Run: `pnpm --filter @cleanstart/web typecheck`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/lib/blog.ts apps/web/src/lib/guides.ts apps/web/src/components/sections/blog/BlogDetailFAQ.tsx apps/web/src/components/sections/guide/GuideDetailFAQ.tsx
git commit -m "feat(web): render Blog/Guide FAQ answers as formatted richText"
```

---

### Task 12: Web — wire Knowledge Base FAQs (net-new)

**Files:**
- Modify: `apps/web/src/lib/knowledge-hub.ts:165-186`
- Create: `apps/web/src/components/sections/knowledge-hub/KnowledgeHubArticleFAQ.tsx`
- Modify: `apps/web/src/components/sections/knowledge-hub/KnowledgeHubArticle.tsx`

Knowledge Base FAQs exist in the CMS schema and already feed the `FAQPage` JSON-LD (`dispatchArticleLike` handles `'knowledgeBase'` — [dispatch.ts:224-270](apps/cms/src/payload/lib/jsonld/dispatch.ts)), but `getKnowledgeArticle`'s `select[]` list doesn't include `faqs`, and no display component exists — so today, formatting KB FAQ answers wouldn't be visible anywhere on the site. This task wires the display for the first time, mirroring the existing Blog/Guide accordion.

- [ ] **Step 1: Add `faqs` to `KhArticle` and the detail-fetch `select[]`**

In `apps/web/src/lib/knowledge-hub.ts`, add a type import at the top:

```typescript
import type { BlogFaqItem, LexicalRoot, TocEntry } from '@/lib/blog';
```

Add a `KhFaqItem` alias and extend `KhArticle` (lines 165–176):

```typescript
export type KhFaqItem = BlogFaqItem;

export interface KhArticle {
  slug: string;
  title: string;
  abstract?: string | null;
  videoUrl?: string | null;
  category?: { name: string } | null;
  body?: LexicalRoot | null;
  tableOfContents?: TocEntry[] | null;
  seo?: CmsSeo | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
  faqs?: KhFaqItem[] | null;
}
```

Add `&select[faqs]=true` to the fetch URL in `getKnowledgeArticle` (line 181):

```typescript
    `/api/knowledgeBase?${PUBLISHED}&depth=1&limit=1&where[slug][equals]=${encodeURIComponent(slug)}&select[title]=true&select[slug]=true&select[abstract]=true&select[videoUrl]=true&select[body]=true&select[tableOfContents]=true&select[category]=true&select[seo]=true&select[publishedAt]=true&select[updatedAt]=true&select[faqs]=true`,
```

- [ ] **Step 2: Create the FAQ display component**

```tsx
// apps/web/src/components/sections/knowledge-hub/KnowledgeHubArticleFAQ.tsx
"use client";

import type React from "react";
import { useState } from "react";
import type { KhFaqItem } from "@/lib/knowledge-hub";
import { RenderLexical } from "@/lib/renderLexical";
import { Reveal } from "@/components/ui/Reveal";

interface KnowledgeHubArticleFAQProps {
  faqs: KhFaqItem[];
}

/** Mirrors BlogDetailFAQ.tsx / GuideDetailFAQ.tsx — same accordion pattern,
 * same APG heading-wraps-trigger structure, same faq-answer-body styling. */
export function KnowledgeHubArticleFAQ({
  faqs,
}: KnowledgeHubArticleFAQProps): React.ReactElement | null {
  const [openId, setOpenId] = useState<string | null>(null);

  if (!faqs.length) return null;

  return (
    <section className="relative w-full bg-white" data-section="KnowledgeHubArticleFAQ">
      <div className="relative mx-auto max-w-[1120px] px-6 pb-20">
        <div className="min-w-0 flex-1" style={{ maxWidth: "680px" }}>
          <Reveal header>
            <h2
              className="font-display font-semibold leading-[1.1] tracking-[-0.04em]"
              style={{ fontSize: "var(--fs-h3)", color: "#111111", marginBottom: "24px" }}
            >
              Frequently Asked Questions
            </h2>
          </Reveal>

          <div
            className="rounded-[24px]"
            style={{ border: "1px solid rgba(17,17,17,0.08)", overflow: "hidden" }}
          >
            {faqs.map((item, i) => {
              const id = item.id ?? String(i);
              const isOpen = openId === id;
              const answerId = `kh-faq-answer-${id}`;
              const questionId = `kh-faq-question-${id}`;
              return (
                <div
                  key={id}
                  style={{
                    borderBottom: i < faqs.length - 1 ? "1px solid rgba(17,17,17,0.08)" : "none",
                  }}
                >
                  <h3 className="m-0">
                    <button
                      type="button"
                      id={questionId}
                      onClick={() => setOpenId(isOpen ? null : id)}
                      aria-expanded={isOpen}
                      aria-controls={answerId}
                      className="group flex w-full items-start justify-between gap-6 text-left cursor-pointer"
                      style={{ padding: "20px 24px" }}
                    >
                      <span
                        className="flex-1 font-display font-semibold leading-[1.4] tracking-[-0.02em] transition-colors duration-200 group-hover:text-[#3960f9]"
                        style={{ fontSize: "var(--fs-body)", color: "#111111" }}
                      >
                        {item.question}
                      </span>
                      <span
                        aria-hidden
                        className="relative mt-0.5 flex shrink-0 items-center justify-center"
                        style={{
                          width: "24px",
                          height: "24px",
                          transition: "transform 300ms cubic-bezier(0.22, 1, 0.36, 1)",
                          transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <rect x="2" y="7" width="12" height="2" rx="1" fill="#111111" />
                          <rect x="7" y="2" width="2" height="12" rx="1" fill="#111111" />
                        </svg>
                      </span>
                    </button>
                  </h3>

                  <section
                    id={answerId}
                    aria-labelledby={questionId}
                    aria-hidden={!isOpen}
                    style={{
                      maxHeight: isOpen ? "800px" : "0px",
                      opacity: isOpen ? 1 : 0,
                      overflow: "hidden",
                      transition:
                        "max-height 280ms cubic-bezier(0.22, 1, 0.36, 1), opacity 200ms ease-out",
                    }}
                  >
                    <div style={{ padding: "0 24px 20px" }}>
                      <RenderLexical content={item.answer} wrapperClassName="faq-answer-body" />
                    </div>
                  </section>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Mount it in `KnowledgeHubArticle.tsx`**

Add the import and render the FAQ section after the article body (after the existing `<div className="article-body mt-12">...</div>` block):

```typescript
import { KnowledgeHubArticleFAQ } from './KnowledgeHubArticleFAQ';
```

```tsx
      <div className="article-body mt-12">
        <RenderLexical content={article.body} />
      </div>

      {article.faqs && article.faqs.length > 0 && (
        <KnowledgeHubArticleFAQ faqs={article.faqs} />
      )}
```

- [ ] **Step 4: Optionally wire KB FAQs into the page's JSON-LD**

`apps/web/src/app/knowledge-hub/[slug]/page.tsx` builds its own `articleSchema(...)` graph client-side (separate from the CMS's server-side JSON-LD dispatch at publish time — confirm which one is actually live for `/knowledge-hub/*` before touching this; if the CMS-side `dispatchArticleLike` output is what actually ships for KB pages, no web-side change is needed here and this step is a no-op). Flag for the implementer to verify during Task 14's manual QA rather than guess blind.

- [ ] **Step 5: Typecheck**

Run: `pnpm --filter @cleanstart/web typecheck`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/lib/knowledge-hub.ts apps/web/src/components/sections/knowledge-hub/KnowledgeHubArticleFAQ.tsx apps/web/src/components/sections/knowledge-hub/KnowledgeHubArticle.tsx
git commit -m "feat(web): render Knowledge Base FAQs (previously not wired to the site at all)"
```

---

### Task 13: Full verification + deploy sequencing

**Files:** none (verification only)

- [ ] **Step 1: Full CMS checks**

```bash
pnpm --filter @cleanstart/cms lint
pnpm --filter @cleanstart/cms typecheck
pnpm --filter @cleanstart/cms test
pnpm --filter @cleanstart/cms build
```

- [ ] **Step 2: Full web checks**

```bash
pnpm --filter @cleanstart/web lint
pnpm --filter @cleanstart/web typecheck
```

For the production build, follow the `web-build-needs-prod-cms` project convention (a dev-mode CMS stalls under full-build prerender load):

```bash
pnpm --filter @cleanstart/cms build
cd apps/cms && NODE_OPTIONS=--no-deprecation pnpm exec next start --port 3100 &
sleep 6
NEXT_PUBLIC_CMS_URL=http://localhost:3100 pnpm --filter @cleanstart/web build
kill %1
```

- [ ] **Step 3: Manual admin QA**

In `pnpm --filter @cleanstart/cms dev`, on a Blog, a Guide, and a Knowledge Base article:
- Open an existing FAQ (post-backfill) — confirm the answer text matches what it looked like before this change.
- Add bold, italic, a link, a bullet list, and a numbered list to an answer; save; reload; confirm formatting persisted.
- Confirm `faqsBulkPaste` still splits a pasted multi-Q&A block into rows with readable (not raw-JSON) answers.

- [ ] **Step 4: Manual web QA**

Run both dev servers (`pnpm --filter @cleanstart/cms dev`, `pnpm --filter @cleanstart/web dev`), visit the Blog/Guide/KB pages edited in Step 3:
- Confirm the FAQ accordion renders bold/italic/links/lists correctly, matching the `faq-answer-body` compact style (not the larger article-body prose size).
- Click every internal/external link inside an FAQ answer — confirm internal links navigate client-side (no full reload) and external links open in a new tab.

- [ ] **Step 5: Verify JSON-LD**

For one Blog, one Guide, and one KB article with FAQs, view page source (or use `curl`) and confirm the `FAQPage` JSON-LD block's `acceptedAnswer.text` is clean plain text (no stray `{"type":"paragraph"...}` JSON, no run-together list items). Cross-check with Google's [Rich Results Test](https://search.google.com/test/rich-results) against the live/preview URL.

- [ ] **Step 6: Deploy sequencing**

This ships a real schema migration plus a one-off content backfill, so deploy in this order:
1. Merge and deploy `apps/cms` first. The Dockerfile's `pnpm migrate && pnpm start` runs Task 7's migration automatically on container boot — existing FAQ answers become bare-string jsonb at that moment (still safely rendered as empty by `RenderLexical`, not broken).
2. Immediately after the CMS container is up, run Task 9's backfill script against prod via the documented SSH mechanism (`ssh cleanstart-cms` → `docker cp` the script into `cleanstart-cms-1` → `docker exec ... /app/node_modules/.bin/tsx scripts/backfill-faq-answer-lexical.ts` with `DRY_RUN=1` first, then for real) so the window between "migration applied" and "content backfilled" is minutes, not the next deploy cycle.
3. Deploy `apps/web` (Vercel, from `main`) — no ordering constraint relative to step 2 beyond "ideally after," since `RenderLexical` degrades safely either way.
4. Clean up the staged backfill script from the container (`docker exec cleanstart-cms-1 rm -f /app/apps/cms/scripts/backfill-faq-answer-lexical.ts`) — container script copies vanish on the next deploy anyway, but no reason to leave it.

---

## Self-review notes

- **Spec coverage:** bold/italic (editor config, Task 2) ✓, links (Task 2, `LinkFeature`) ✓, bullets + numbered lists (Task 2) ✓, soft line breaks (Task 2 — native Lexical `linebreak`, no extra feature needed) ✓, all three collections (Tasks 3, 11, 12) ✓, JSON-LD stays valid plain text (Task 6) ✓, existing content preserved (Tasks 7–9) ✓.
- **Known scope boundary, called out explicitly:** Task 12 is net-new functionality (KB FAQs were never rendered on the web before this plan), not a pure reformatting change — flagged in that task's intro rather than silently bundled in.
- **Open question left for the implementer, not guessed:** Task 12 Step 4 (whether `/knowledge-hub/[slug]/page.tsx`'s client-side `articleSchema()` call or the CMS's server-side `dispatchArticleLike` is the JSON-LD that actually ships for KB pages) — verify during Task 13's manual QA rather than assume.
