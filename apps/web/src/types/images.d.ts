/**
 * Standalone module declarations for static image imports.
 *
 * `next-env.d.ts` already pulls in `<reference types="next/image-types/global" />`,
 * but that file also tries to `import "./.next/dev/types/routes.d.ts"` — a
 * dev-only artefact that doesn't exist in CI (`next build` writes a different
 * path; `tsc --noEmit` from a clean checkout writes neither). When that import
 * fails to resolve, `next-env.d.ts` itself becomes unparseable and the image
 * type triples are lost, breaking every `import poster from './x.jpg'`.
 *
 * Declaring the image modules here keeps `*.jpg / *.png / *.webp / *.svg`
 * imports type-safe regardless of whether `next-env.d.ts` resolves cleanly.
 */

declare module "*.jpg" {
  const src: import("next/image").StaticImageData;
  export default src;
}

declare module "*.jpeg" {
  const src: import("next/image").StaticImageData;
  export default src;
}

declare module "*.png" {
  const src: import("next/image").StaticImageData;
  export default src;
}

declare module "*.webp" {
  const src: import("next/image").StaticImageData;
  export default src;
}

declare module "*.avif" {
  const src: import("next/image").StaticImageData;
  export default src;
}

declare module "*.gif" {
  const src: import("next/image").StaticImageData;
  export default src;
}

declare module "*.svg" {
  const src: import("next/image").StaticImageData;
  export default src;
}
