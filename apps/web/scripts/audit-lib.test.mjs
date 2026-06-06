import { test } from "node:test";
import assert from "node:assert/strict";
import { toPublicPath, classifyUsage, extractDynamicPrefixes } from "./audit-lib.mjs";

test("toPublicPath maps a public-relative file path to its served URL", () => {
  assert.equal(toPublicPath("images/about/founders-photo.png"), "/images/about/founders-photo.png");
});

test("extractDynamicPrefixes captures a template-literal image path prefix", () => {
  const src = "const s = `/images/logos/${name}.svg`;";
  assert.ok(extractDynamicPrefixes(src).includes("/images/logos/"));
});

test("extractDynamicPrefixes captures a concatenation-built path prefix", () => {
  const src = 'const s = "/images/flags/" + code + ".png";';
  assert.ok(extractDynamicPrefixes(src).includes("/images/flags/"));
});

const corpus = [
  'src={"/images/about/founders-photo.png"}',
  "background: url(/images/hero/grid.svg)",
].join("\n");

test("classifyUsage flags a full-path hit as used", () => {
  assert.equal(classifyUsage("/images/about/founders-photo.png", "founders-photo.png", corpus, []).status, "used");
});

test("classifyUsage flags an unreferenced file as orphan", () => {
  assert.equal(classifyUsage("/images/about/ghost.png", "ghost.png", corpus, []).status, "orphan");
});

test("classifyUsage flags a dynamic-prefix match as dynamic-unsure, not orphan", () => {
  assert.equal(classifyUsage("/images/flags/in.png", "in.png", corpus, ["/images/flags/"]).status, "dynamic-unsure");
});

test("classifyUsage flags basename-only hits as used-weak", () => {
  const c = "const icon = 'founders-photo.png'";
  assert.equal(classifyUsage("/images/about/founders-photo.png", "founders-photo.png", c, []).status, "used-weak");
});
