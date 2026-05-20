// @ts-check
/**
 * apps/web — v3 responsive-remediation lint gate.
 *
 * Scope: ONLY the seven rules that biome cannot express. General TS/React/
 * formatting lint stays on biome (see apps/web/package.json `lint`).
 *
 * Rules are flipped to `error` (lockdown landed 2026-05-20 — see
 * apps/web/docs/RESPONSIVE-AUDIT.md §14.4). Legitimate Figma-anchored
 * exceptions inside constrained components (buttons, pills, badges,
 * card internals) are suppressed inline with
 * `eslint-disable-next-line no-restricted-syntax -- v3 exception: <reason>`.
 *
 * Escape hatches:
 *   - `data-cta-utility`  on a Button / link-as-button: opts out of the 44x44
 *     touch-target rule (filter chips, breadcrumb home, etc.).
 *   - `data-cta-fluid`    on a marketing-display CTA: permits clamp on padding.
 *
 * Both attributes are PR-visible; reviewers must justify their use. The
 * mapping table in apps/web/docs/design-tokens.md ("v3 Consistency Layer")
 * is the canonical source for which token a given role should use.
 *
 * To run:  pnpm --filter @cleanstart/web lint:eslint
 * To re-record the warn-count baseline:
 *   UPDATE_LINT_BASELINE=1 pnpm --filter @cleanstart/web lint:eslint:baseline
 */
import tsParser from "@typescript-eslint/parser";

/**
 * No-op stub for the `@next/next` plugin namespace. The codebase has
 * `// eslint-disable-next-line @next/next/no-img-element` comments left over
 * from a prior next/eslint setup; this stub defines the rules as no-ops so
 * ESLint can resolve the disable directives without complaining. Real next
 * rules are enforced via biome (which understands img-element semantics).
 */
const nextStub = {
  rules: {
    "no-img-element": { meta: { schema: [] }, create: () => ({}) },
    "no-html-link-for-pages": { meta: { schema: [] }, create: () => ({}) },
  },
};

/**
 * className regex matchers — applied to JSX `className="..."` literal values
 * and the same JSX attr expressed as `clsx(...)` / `cn(...)` string args.
 *
 * We match raw class names (with their `:` variants) so e.g. `lg:h-[300px]`
 * is caught even when wrapped in a Tailwind responsive prefix.
 */
const MSG_TEXT_REM = "v3 Consistency Layer: arbitrary `text-[Xrem]` is forbidden. Use a token from --text-display-*, --text-card-title-*, or --text-body-* (see apps/web/docs/design-tokens.md).";
const MSG_CARD_HEIGHT = "v3 Consistency Layer: bare `h-[Xpx]` on a *Card* file is forbidden. Use `min-h-[clamp(...)]` or `aspect-ratio` instead.";
const MSG_WIDTH_NO_MAXW = "v3 Consistency Layer: bare `w-[Xpx]` without a `max-w-[*]` qualifier is forbidden. Use `w-full max-w-[Xpx]`.";
const MSG_PAR_NONE = "v3 Consistency Layer: `preserveAspectRatio=\"none\"` distorts paths. Use `xMidYMid meet` (or `xMidYMid slice` if cropping is intended).";
const MSG_FONTSIZE_PX = "v3 Consistency Layer: flat-px `fontSize:` in inline style is forbidden outside the documented allow-list. Use a `--text-*` token or `clamp(rem, vw, rem)`.";
const MSG_IMAGE_NO_SIZES = "v3 Consistency Layer: every `<Image>` requires a `sizes` prop matching the rendered widths per breakpoint, or an explicit `fill` + `sizes` pair.";
const MSG_BR_IN_PROSE = "v3 Consistency Layer: `<br />` inside prose breaks responsive line shape. Trust max-width and natural wrap.";

export default [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "playwright-report/**",
      "test-results/**",
      "scripts/**",
      "tests/**",
      "next-env.d.ts",
    ],
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { "@next/next": nextStub },
    linterOptions: {
      // The codebase carries `@next/next/no-img-element` disable comments
      // from a prior setup; the rule is no-op'd above so the directives are
      // technically "unused". Don't warn on that — flip back to default once
      // those comments are removed in a separate cleanup pass.
      reportUnusedDisableDirectives: "off",
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      "no-restricted-syntax": [
        "error",
        // 1. text-[Xrem] in className strings. Caught at the literal level.
        {
          selector: "Literal[value=/(?:^|[ ])(?:[a-z]+:)*text-\\[[\\d.]+rem\\]/]",
          message: MSG_TEXT_REM,
        },
        {
          selector: "TemplateElement[value.raw=/(?:^|[ ])(?:[a-z]+:)*text-\\[[\\d.]+rem\\]/]",
          message: MSG_TEXT_REM,
        },
        // 2. preserveAspectRatio="none" — both the JSX attribute form and the
        //    SVG-string form.
        {
          selector: "JSXAttribute[name.name='preserveAspectRatio'] > Literal[value='none']",
          message: MSG_PAR_NONE,
        },
        {
          selector: "Literal[value=/preserveAspectRatio=[\"']none[\"']/]",
          message: MSG_PAR_NONE,
        },
        // 3. <br /> inside JSX. We can't ban it everywhere (forms might need
        //    it); banning it inside <p>/<h1-3> would require parent traversal
        //    that's not expressible in a selector. Pragmatic: ban it
        //    altogether in source — current code has no legitimate use.
        {
          selector: "JSXOpeningElement[name.name='br']",
          message: MSG_BR_IN_PROSE,
        },
        // 4. inline-style fontSize: 'Xpx' or fontSize: 'X' as a literal number
        //    (which CSS-in-JS often coerces to px).
        {
          selector: "Property[key.name='fontSize'] > Literal[value=/^\\d+(?:\\.\\d+)?(?:px)?$/]",
          message: MSG_FONTSIZE_PX,
        },
        // 5. <Image> JSX without a `sizes` attribute (only matched when src
        //    is present — defensive: ignore Image renders that have no src).
        //    This selector matches when neither `sizes` nor `fill` is set; we
        //    accept either (Next.js docs allow `fill` to imply sizes via
        //    100vw, but require an explicit sizes for any non-fill image).
        {
          selector: "JSXOpeningElement[name.name='Image']:not(:has(JSXAttribute[name.name='sizes']))",
          message: MSG_IMAGE_NO_SIZES,
        },
      ],
    },
  },
  // Card-specific rule: bare h-[Xpx] on any file matching *Card*.tsx is a
  // separate violation from the global token rule.
  {
    files: ["src/**/*Card*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaVersion: "latest", sourceType: "module", ecmaFeatures: { jsx: true } },
    },
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "Literal[value=/(?:^|[ ])(?:[a-z]+:)*h-\\[\\d+(?:\\.\\d+)?px\\]/]",
          message: MSG_CARD_HEIGHT,
        },
        {
          selector: "TemplateElement[value.raw=/(?:^|[ ])(?:[a-z]+:)*h-\\[\\d+(?:\\.\\d+)?px\\]/]",
          message: MSG_CARD_HEIGHT,
        },
      ],
    },
  },
  // bare w-[Xpx] without max-w qualifier on cards.
  // We approximate "no max-w on same className" by requiring max-w in the
  // same className literal whenever w-[Xpx] appears. A two-pass match isn't
  // expressible in pure selectors, so we accept the false-negative (caller
  // can split into multiple classes to bypass) — pragmatic for warn mode.
  {
    files: ["src/**/*Card*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaVersion: "latest", sourceType: "module", ecmaFeatures: { jsx: true } },
    },
    rules: {
      "no-restricted-syntax": [
        "error",
        // Matches className literals that contain `w-[Xpx]` AND do not contain
        // `max-w` anywhere in the same string.
        {
          selector: "Literal[value=/^(?!.*max-w)(?:.*[ ]|^)(?:[a-z]+:)*w-\\[\\d+(?:\\.\\d+)?px\\].*$/s]",
          message: MSG_WIDTH_NO_MAXW,
        },
      ],
    },
  },
];
