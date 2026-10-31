import { test } from "node:test";
import assert from "node:assert/strict";
import { healthUrl, waitForCms } from "./wait-for-cms.mjs";

const respond = (status) => async () => ({ status });

function harness(responses) {
  let clock = 0;
  let calls = 0;
  const sleeps = [];
  return {
    sleeps,
    get calls() {
      return calls;
    },
    options: {
      cmsUrl: "https://cms.example.com",
      timeoutMs: 20_000,
      intervalMs: 5_000,
      now: () => clock,
      sleep: async (ms) => {
        sleeps.push(ms);
        clock += ms;
      },
      log: () => {},
      fetchImpl: async (...args) => {
        const next = responses[Math.min(calls, responses.length - 1)];
        calls += 1;
        return next(...args);
      },
    },
  };
}

test("returns true at once when the first probe is 200", async () => {
  const h = harness([respond(200)]);
  assert.equal(await waitForCms(h.options), true);
  assert.equal(h.calls, 1);
  assert.deepEqual(h.sleeps, []);
});

test("keeps probing through 502s and returns true once the CMS answers 200", async () => {
  const h = harness([respond(502), respond(502), respond(200)]);
  assert.equal(await waitForCms(h.options), true);
  assert.equal(h.calls, 3);
  assert.deepEqual(h.sleeps, [5_000, 5_000]);
});

test("treats a rejected fetch as not ready and recovers", async () => {
  const h = harness([
    async () => {
      throw new TypeError("fetch failed");
    },
    respond(200),
  ]);
  assert.equal(await waitForCms(h.options), true);
  assert.equal(h.calls, 2);
});

test("gives up with false once the timeout is spent, so the build fails on its own terms", async () => {
  const h = harness([respond(502)]);
  assert.equal(await waitForCms(h.options), false);
  assert.ok(h.sleeps.reduce((a, b) => a + b, 0) <= 20_000);
});

test("a non-200 that is not a 5xx still counts as not ready", async () => {
  const h = harness([respond(404), respond(200)]);
  assert.equal(await waitForCms(h.options), true);
  assert.equal(h.calls, 2);
});

test("healthUrl drops a trailing slash and adds a cache-buster", () => {
  assert.equal(healthUrl("https://cms.example.com/", 42), "https://cms.example.com/api/health?_=42");
  assert.equal(healthUrl("https://cms.example.com", 7), "https://cms.example.com/api/health?_=7");
});
