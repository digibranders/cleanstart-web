import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRules, lintRule, lintCorpus } from './lint-rules.mjs';

const VALID = `## Rules

### CRAWL-01 — Robots allows indexable paths

- **Severity:** P0
- **Applies:** Always
- **Rule:** Production robots.txt must not disallow any indexable path.
- **Why:** A disallowed path cannot be crawled, so its content never enters the index.
- **Acceptance:**
  - No Disallow rule matches an indexable URL
- **Verify:** \`curl -s https://example.com/robots.txt\`
- **Reference:** \`apps/web/src/lib/seo/robots.ts:12\`
- **Source:** [Tier 1] https://developers.google.com/search/docs/crawling-indexing/robots/intro
- **Tools:** Screaming Frog \`Blocked by robots.txt\`
- **Anti-patterns:** Shipping a staging robots.txt to production.
- **CleanStart:** Pass
`;

test('parseRules extracts one rule with its fields', () => {
  const rules = parseRules(VALID, '01-crawl.md');
  assert.equal(rules.length, 1);
  assert.equal(rules[0].heading, 'CRAWL-01 — Robots allows indexable paths');
  assert.equal(rules[0].fields.Severity, 'P0');
  assert.equal(rules[0].fields.CleanStart, 'Pass');
});

test('parseRules folds continuation lines into the field', () => {
  const rules = parseRules(VALID, '01-crawl.md');
  assert.match(rules[0].fields.Acceptance, /No Disallow rule matches an indexable URL/);
});

test('lintRule accepts a well-formed rule', () => {
  assert.deepEqual(lintRule(parseRules(VALID, 'f.md')[0]), []);
});

test('lintRule rejects a malformed heading', () => {
  const bad = parseRules(VALID.replace('CRAWL-01 — Robots', 'Robots'), 'f.md')[0];
  assert.match(lintRule(bad).join(), /heading must be/);
});

test('lintRule rejects a missing hard-required field', () => {
  const bad = parseRules(VALID.replace(/- \*\*Verify:\*\*.*\n/, ''), 'f.md')[0];
  assert.match(lintRule(bad).join(), /missing required field Verify/);
});

test('lintRule rejects an invalid severity', () => {
  const bad = parseRules(VALID.replace('P0', 'High'), 'f.md')[0];
  assert.match(lintRule(bad).join(), /severity/i);
});

test('lintRule rejects an untiered source', () => {
  const bad = parseRules(VALID.replace('[Tier 1] ', ''), 'f.md')[0];
  assert.match(lintRule(bad).join(), /Tier 1.*Tier 2.*Convention/);
});

test('lintRule accepts an explicit Convention label instead of a tier', () => {
  const ok = parseRules(
    VALID.replace(
      '[Tier 1] https://developers.google.com/search/docs/crawling-indexing/robots/intro',
      'Convention — not vendor-confirmed',
    ),
    'f.md',
  )[0];
  assert.deepEqual(lintRule(ok), []);
});

test('lintRule rejects an out-of-vocabulary verdict', () => {
  const bad = parseRules(
    VALID.replace('**CleanStart:** Pass', '**CleanStart:** Mostly fine'),
    'f.md',
  )[0];
  assert.match(lintRule(bad).join(), /verdict/i);
});

test('lintRule accepts an Unverified verdict carrying a reason', () => {
  const ok = parseRules(
    VALID.replace('**CleanStart:** Pass', '**CleanStart:** Unverified — GSC access pending'),
    'f.md',
  )[0];
  assert.deepEqual(lintRule(ok), []);
});

test('lintCorpus rejects a duplicate rule ID across files', () => {
  const rules = [...parseRules(VALID, 'a.md'), ...parseRules(VALID, 'b.md')];
  assert.match(lintCorpus(rules).join(), /duplicate rule ID CRAWL-01/);
});

test('parseRules ignores rule headings inside fenced code blocks', () => {
  // 00-index.md documents the rule format by example; the example must not lint as a real rule.
  const doc = ['## Format', '', '```markdown', VALID, '```', ''].join('\n');
  assert.deepEqual(parseRules(doc, '00-index.md'), []);
});
