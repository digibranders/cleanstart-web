import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres';

/**
 * Fix broken internal links in Knowledge Hub article bodies.
 *
 * Article rich text linked sibling articles with the legacy path scheme
 * `/tracks/knowledge_base/articles/<section>/<subcategory>/<slug>`, which never
 * matched the live flat route `/knowledge-hub/<slug>` and returned 404 (surfaced
 * by the SEO crawl: 147 broken links across 41 articles, 50 distinct targets).
 *
 * Each legacy URL maps 1:1 to an existing published article, so the fix is a
 * deterministic string rewrite applied to the Lexical `body` of every current
 * doc (`knowledge_base.body`) and every version snapshot
 * (`_knowledge_base_v.version_body`). The seed source
 * (`scripts/data/academy-kb.json`) was corrected in the same change so future
 * re-seeds stay in sync.
 *
 * Idempotent: once rewritten, the legacy substrings are gone and re-running is a
 * no-op. The URL substrings contain no JSON metacharacters, so the
 * text-replace-then-recast to jsonb is safe.
 */
const LINK_REWRITES: ReadonlyArray<readonly [legacy: string, fixed: string]> = [
  [
    '/tracks/knowledge_base/articles/01-understand/fundamentals/ai-ml-container-stack-explained',
    '/knowledge-hub/ai-ml-container-stack-explained',
  ],
  [
    '/tracks/knowledge_base/articles/01-understand/fundamentals/container-image-fundamentals',
    '/knowledge-hub/container-image-fundamentals',
  ],
  [
    '/tracks/knowledge_base/articles/01-understand/fundamentals/container-image-layers-deep-dive',
    '/knowledge-hub/container-image-layers-deep-dive',
  ],
  [
    '/tracks/knowledge_base/articles/01-understand/fundamentals/container-images-in-cicd',
    '/knowledge-hub/container-images-in-cicd',
  ],
  [
    '/tracks/knowledge_base/articles/01-understand/fundamentals/container-orchestration-kubernetes',
    '/knowledge-hub/container-orchestration-kubernetes',
  ],
  [
    '/tracks/knowledge_base/articles/01-understand/fundamentals/container-registries-compared',
    '/knowledge-hub/container-registries-compared',
  ],
  [
    '/tracks/knowledge_base/articles/01-understand/fundamentals/container-scope-vs-kernel-scope',
    '/knowledge-hub/container-scope-vs-kernel-scope',
  ],
  [
    '/tracks/knowledge_base/articles/01-understand/fundamentals/container-security-best-practices',
    '/knowledge-hub/container-security-best-practices',
  ],
  [
    '/tracks/knowledge_base/articles/01-understand/fundamentals/development-images-vs-application-images',
    '/knowledge-hub/development-images-vs-application-images',
  ],
  [
    '/tracks/knowledge_base/articles/01-understand/fundamentals/docker-and-oci-specification',
    '/knowledge-hub/docker-and-oci-specification',
  ],
  [
    '/tracks/knowledge_base/articles/01-understand/fundamentals/helm-fundamentals',
    '/knowledge-hub/helm-fundamentals',
  ],
  [
    '/tracks/knowledge_base/articles/01-understand/fundamentals/how-containers-interact-with-the-kernel',
    '/knowledge-hub/how-containers-interact-with-the-kernel',
  ],
  [
    '/tracks/knowledge_base/articles/01-understand/fundamentals/how-enterprises-patch-containers',
    '/knowledge-hub/how-enterprises-patch-containers',
  ],
  [
    '/tracks/knowledge_base/articles/01-understand/fundamentals/kubernetes-manifests-and-deployments',
    '/knowledge-hub/kubernetes-manifests-and-deployments',
  ],
  [
    '/tracks/knowledge_base/articles/01-understand/fundamentals/machine-speed-vs-human-speed',
    '/knowledge-hub/machine-speed-vs-human-speed',
  ],
  [
    '/tracks/knowledge_base/articles/01-understand/fundamentals/prebuild-stage-security',
    '/knowledge-hub/prebuild-stage-security',
  ],
  [
    '/tracks/knowledge_base/articles/01-understand/fundamentals/standard-vs-distroless-images',
    '/knowledge-hub/standard-vs-distroless-images',
  ],
  [
    '/tracks/knowledge_base/articles/01-understand/security-fundamentals/library-cve-maintainer-dependency',
    '/knowledge-hub/library-cve-maintainer-dependency',
  ],
  [
    '/tracks/knowledge_base/articles/01-understand/security-fundamentals/the-layered-security-problem',
    '/knowledge-hub/the-layered-security-problem',
  ],
  [
    '/tracks/knowledge_base/articles/01-understand/security-fundamentals/what-are-reproducible-builds',
    '/knowledge-hub/what-are-reproducible-builds',
  ],
  [
    '/tracks/knowledge_base/articles/01-understand/security-fundamentals/what-are-transitive-dependencies',
    '/knowledge-hub/what-are-transitive-dependencies',
  ],
  [
    '/tracks/knowledge_base/articles/01-understand/security-fundamentals/what-is-a-container-image',
    '/knowledge-hub/what-is-a-container-image',
  ],
  [
    '/tracks/knowledge_base/articles/01-understand/security-fundamentals/what-is-a-container-registry',
    '/knowledge-hub/what-is-a-container-registry',
  ],
  [
    '/tracks/knowledge_base/articles/01-understand/security-fundamentals/what-is-a-cve',
    '/knowledge-hub/what-is-a-cve',
  ],
  [
    '/tracks/knowledge_base/articles/01-understand/security-fundamentals/what-is-a-package-manager',
    '/knowledge-hub/what-is-a-package-manager',
  ],
  [
    '/tracks/knowledge_base/articles/01-understand/security-fundamentals/what-is-a-software-library',
    '/knowledge-hub/what-is-a-software-library',
  ],
  [
    '/tracks/knowledge_base/articles/01-understand/security-fundamentals/what-is-apk-package-manager',
    '/knowledge-hub/what-is-apk-package-manager',
  ],
  [
    '/tracks/knowledge_base/articles/01-understand/security-fundamentals/what-is-compliance-as-code',
    '/knowledge-hub/what-is-compliance-as-code',
  ],
  [
    '/tracks/knowledge_base/articles/01-understand/security-fundamentals/what-is-cosign-and-image-signing',
    '/knowledge-hub/what-is-cosign-and-image-signing',
  ],
  [
    '/tracks/knowledge_base/articles/01-understand/security-fundamentals/what-is-distroless',
    '/knowledge-hub/what-is-distroless',
  ],
  [
    '/tracks/knowledge_base/articles/01-understand/security-fundamentals/what-is-hipaa',
    '/knowledge-hub/what-is-hipaa',
  ],
  [
    '/tracks/knowledge_base/articles/01-understand/security-fundamentals/what-is-iso27001',
    '/knowledge-hub/what-is-iso27001',
  ],
  [
    '/tracks/knowledge_base/articles/01-understand/security-fundamentals/what-is-opa',
    '/knowledge-hub/what-is-opa',
  ],
  [
    '/tracks/knowledge_base/articles/01-understand/security-fundamentals/what-is-pci-dss',
    '/knowledge-hub/what-is-pci-dss',
  ],
  [
    '/tracks/knowledge_base/articles/01-understand/security-fundamentals/what-is-sbom',
    '/knowledge-hub/what-is-sbom',
  ],
  [
    '/tracks/knowledge_base/articles/01-understand/security-fundamentals/what-is-slsa',
    '/knowledge-hub/what-is-slsa',
  ],
  [
    '/tracks/knowledge_base/articles/01-understand/security-fundamentals/what-is-soc2',
    '/knowledge-hub/what-is-soc2',
  ],
  [
    '/tracks/knowledge_base/articles/01-understand/security-fundamentals/what-is-supply-chain-security',
    '/knowledge-hub/what-is-supply-chain-security',
  ],
  [
    '/tracks/knowledge_base/articles/02-explore/architecture/glibc-vs-musl',
    '/knowledge-hub/glibc-vs-musl',
  ],
  [
    '/tracks/knowledge_base/articles/02-explore/architecture/verified-source-philosophy',
    '/knowledge-hub/verified-source-philosophy',
  ],
  [
    '/tracks/knowledge_base/articles/02-explore/deep-dives/build-stage-security',
    '/knowledge-hub/build-stage-security',
  ],
  [
    '/tracks/knowledge_base/articles/02-explore/deep-dives/compliance-architecture',
    '/knowledge-hub/compliance-architecture',
  ],
  [
    '/tracks/knowledge_base/articles/02-explore/deep-dives/strip-down-vs-source-built',
    '/knowledge-hub/strip-down-vs-source-built',
  ],
  [
    '/tracks/knowledge_base/articles/02-explore/deep-dives/the-continuous-trust-loop',
    '/knowledge-hub/the-continuous-trust-loop',
  ],
  [
    '/tracks/knowledge_base/articles/02-explore/deep-dives/vulnerability-across-all-layers',
    '/knowledge-hub/vulnerability-across-all-layers',
  ],
  [
    '/tracks/knowledge_base/articles/03-learn/why-cleanstart/executive-summary-one-pager',
    '/knowledge-hub/executive-summary-one-pager',
  ],
  [
    '/tracks/knowledge_base/articles/03-learn/why-cleanstart/how-cleanstart-is-different',
    '/knowledge-hub/how-cleanstart-is-different',
  ],
  [
    '/tracks/knowledge_base/articles/05-deploy/getting-started/end-to-end-secure-deployment',
    '/knowledge-hub/end-to-end-secure-deployment',
  ],
  [
    '/tracks/knowledge_base/articles/05-deploy/migration/dockerfile-to-yaml-migration',
    '/knowledge-hub/dockerfile-to-yaml-migration',
  ],
  [
    '/tracks/knowledge_base/articles/07-secure/hardening/runtime-stage-security',
    '/knowledge-hub/runtime-stage-security',
  ],
];

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const [legacy, fixed] of LINK_REWRITES) {
    const pattern = `%${legacy}%`;
    await db.execute(sql`
      UPDATE "knowledge_base"
      SET "body" = REPLACE("body"::text, ${legacy}, ${fixed})::jsonb
      WHERE "body"::text LIKE ${pattern};
    `);
    await db.execute(sql`
      UPDATE "_knowledge_base_v"
      SET "version_body" = REPLACE("version_body"::text, ${legacy}, ${fixed})::jsonb
      WHERE "version_body"::text LIKE ${pattern};
    `);
  }
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // No-op: the legacy /tracks/knowledge_base/articles/... URLs were broken 404s,
  // so there is nothing meaningful to restore. The corrected /knowledge-hub/<slug>
  // targets may also be referenced by content authored after this migration, so a
  // blind reverse-rewrite could corrupt valid links. Reversing is intentionally
  // not supported.
}
