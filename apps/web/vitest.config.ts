import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  esbuild: {
    // Enable JSX transform for .tsx files imported by tests (e.g. glyphs.tsx).
    // Uses the React 19 automatic JSX runtime — no explicit React import needed.
    jsx: "automatic",
    jsxImportSource: "react",
  },
  test: {
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    environment: "node",
    globals: false,
    passWithNoTests: false,
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
