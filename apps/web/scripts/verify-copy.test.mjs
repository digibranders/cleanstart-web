import { test } from "node:test";
import assert from "node:assert/strict";
import { findDashes } from "./verify-copy.mjs";

test("flags em-dashes and en-dashes in text nodes", () => {
  assert.equal(findDashes("<p>Fast — and safe</p>").length, 1);
  assert.equal(findDashes("<p>2–4 years</p>").length, 1);
});

test("flags dashes in copy-bearing attributes", () => {
  assert.equal(findDashes('<img alt="Hero — image"><meta name="description" content="A – B">').length, 2);
});

test("flags numeric dash entities", () => {
  assert.equal(findDashes("<p>A &#8212; B</p>").length, 1);
});

test("ignores scripts, styles, comments and hyphens", () => {
  const html = '<style>a{content:"—"}</style><script>var x="—"</script><!-- — --><p>well-known</p>';
  assert.deepEqual(findDashes(html), []);
});
