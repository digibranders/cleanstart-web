/**
 * Academy lesson videos. The Academy hosts one MP4 per lesson in a public
 * Google Cloud Storage bucket, keyed by the article's path. Only 24 of the 245
 * articles (all in the Understand section) currently have a video; the rest
 * have none. The set below is the authoritative bucket listing as of the
 * import — articles whose path is here get a `videoUrl` on import/backfill.
 */

const VIDEO_BUCKET_BASE = 'https://storage.googleapis.com/cleanstart-academy-videos';

/** Article paths (`section/subcategory/slug`) that have a lesson video. */
export const VIDEO_PATHS: ReadonlySet<string> = new Set([
  '01-understand/fundamentals/ai-ml-container-stack-explained',
  '01-understand/fundamentals/container-image-fundamentals',
  '01-understand/fundamentals/container-image-layers-deep-dive',
  '01-understand/fundamentals/container-images-in-cicd',
  '01-understand/fundamentals/container-orchestration-kubernetes',
  '01-understand/fundamentals/container-registries-compared',
  '01-understand/fundamentals/container-runtimes-explained',
  '01-understand/fundamentals/container-scope-vs-kernel-scope',
  '01-understand/fundamentals/container-security-best-practices',
  '01-understand/fundamentals/containers-vs-virtual-machines',
  '01-understand/fundamentals/docker-and-oci-specification',
  '01-understand/fundamentals/how-containers-interact-with-the-kernel',
  '01-understand/fundamentals/images-and-containers',
  '01-understand/fundamentals/kubernetes-fundamentals',
  '01-understand/fundamentals/kubernetes-manifests-and-deployments',
  '01-understand/fundamentals/libraries-and-packages-relationship',
  '01-understand/fundamentals/linux-packages-explained',
  '01-understand/fundamentals/machine-speed-vs-human-speed',
  '01-understand/fundamentals/prebuild-stage-security',
  '01-understand/fundamentals/standard-vs-distroless-images',
  '01-understand/learning-paths/fips-federal-compliance',
  '01-understand/learning-paths/from-vulnerable-to-verified',
  '01-understand/security-fundamentals/the-illusion-of-the-single-artifact',
  '01-understand/security-fundamentals/the-layered-security-problem',
]);

/** Public MP4 URL for an article path, or undefined when the lesson has no video. */
export const videoUrlForPath = (path: string): string | undefined =>
  VIDEO_PATHS.has(path) ? `${VIDEO_BUCKET_BASE}/${path}.mp4` : undefined;
