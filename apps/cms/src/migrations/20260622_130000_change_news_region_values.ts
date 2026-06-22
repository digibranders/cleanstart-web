import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Replace the placeholder `news.region` enum + data with the real regions.
 *
 * `20260608_140513_add_news_region` seeded `region` as a 3-value enum
 * (`asia-pacific`, `europe-middle-east`, `usa-north-america`) and the rows
 * were filled round-robin (placeholder, never accurate — see the original
 * `backfill-news-region.ts`). The real newsroom data (supplied as a
 * spreadsheet) uses only two regions, so the enum collapses to
 * `north-america` + `apac` and every row is remapped to its real region.
 *
 * The placeholder values are uncorrelated with the truth, so the remap is
 * keyed per-item by `slug` (the import slug is deterministic and identical
 * across local/prod). The 33 `VALUES` rows below are the spreadsheet's
 * Region column joined to each article by URL.
 *
 * Self-contained on purpose: the enum value-set change is DDL (a select
 * column can't hold the new values until the type is recreated) and the
 * data remap is coupled to it, so both run in one transaction. This keeps
 * prod safe regardless of any separate script timing — the `NOT IN` guard
 * nulls any stray value so the cast back to the new enum can never fail.
 * Re-runnable: `up()` always rebuilds the enum and remaps by slug.
 *
 * Note: raw-SQL writes bypass the `news` afterChange hooks, so this does not
 * fire Meilisearch re-sync or the web ISR revalidate ping. The /news region
 * filter reads live from Postgres via REST, so filtering is correct
 * immediately; cached listing HTML self-heals on the 1h ISR fallback (or a
 * manual revalidate / next publish).
 */

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "news" ALTER COLUMN "region" TYPE text USING "region"::text;
    ALTER TABLE "_news_v" ALTER COLUMN "version_region" TYPE text USING "version_region"::text;

    UPDATE "news" AS n SET "region" = m.region
    FROM (VALUES
        ('ai-driven-code-and-the-expanding-challenge-of-release-trust', 'north-america'),
        ('ai-that-fixes-flaws-before-they-ship', 'north-america'),
        ('beyond-zero-trust-redefining-software-security-in-the-age-of-compromised-code', 'apac'),
        ('cleanstart-achieves-350-hardened-vulnerability-free-container-images-accelerating-u-s-expansion', 'apac'),
        ('cleanstart-announces-strategic-partnership-with-sysdig-to-deliver-continuous-software-supply-chain-verification-from', 'north-america'),
        ('cleanstart-expands-docker-hub-community-with-free-daily-updated-images', 'north-america'),
        ('cleanstart-expands-docker-hub-community-with-free-daily-updated-images-to-support-secure-development', 'north-america'),
        ('cleanstart-expands-docker-hub-offerings-with-daily-updated-secure-images-for-developers', 'apac'),
        ('cleanstart-expands-vulnerability-free-container-image-library', 'apac'),
        ('cleanstart-launches-busybox-free-container-foundation-for-secure-deterministic-production', 'north-america'),
        ('cleanstart-launches-cleansight-to-give-enterprises-complete-visibility-into-container-risk', 'apac'),
        ('cleanstart-launches-industrys-most-comprehensive-sbom-analyzer-to-strengthen-container-security', 'north-america'),
        ('cleanstart-wins-2025-cybersecurity-excellence-award', 'north-america'),
        ('cleanstart-wins-three-gold-awards-at-the-2026-cybersecurity-excellence-awards', 'north-america'),
        ('ecaps-to-distribute-cleanstart-products-to-strengthen-software-supply-chain-security', 'apac'),
        ('enisa-warns-of-escalating-ot-threats', 'north-america'),
        ('hardened-containers-look-to-eliminate-common-source-of-vulnerabilities', 'north-america'),
        ('inside-cleanstarts-mission-to-make-software-safer-from-the-ground-up', 'apac'),
        ('kolaborasi-baru-untuk-perkuat-keamanan-perangkat-lunak-di-indonesia-dan-asean', 'apac'),
        ('openssf-welcomes-new-members-and-presents-golden-egg-award-kqrhu', 'north-america'),
        ('recognition-meets-real-world-detection', 'north-america'),
        ('sboms-in-2026-some-love-some-hate-much-ambivalence', 'north-america'),
        ('triam-security-rebrands-as-cleanstart-to-focus-on-software-supply-chain', 'apac'),
        ('triam-security-rebrands-as-cleanstart-to-reflect-product-led-focus-on-securing-the-software-supply-chain', 'apac'),
        ('triam-security-rebrands-as-cleanstart-to-reflect-product-led-focus-on-securing-the-software-supply-chain-2', 'apac'),
        ('triam-security-rebrands-as-cleanstart-to-reflect-product-led-focus-on-securing-the-software-supply-chain-3', 'north-america'),
        ('triam-securitys-cleanstart-wins-2025-cybersecurity-excellence-award', 'north-america'),
        ('where-ai-fits-in-cybersecurity', 'apac'),
        ('why-container-images-have-become-a-trust-boundary', 'north-america'),
        ('why-containers-drive-supply-chain-breaches', 'north-america'),
        ('why-containers-drive-supply-chain-breaches-2', 'north-america'),
        ('why-software-supply-chain-security-is-the-next-big-cyber-threat', 'apac'),
        ('zero-common-vulnerabilities-and-exposures-is-secure-by-default-the-future-of-cybersecurity', 'apac')
    ) AS m(slug, region)
    WHERE n."slug" = m.slug;

    UPDATE "_news_v" AS v SET "version_region" = n."region"
    FROM "news" AS n
    WHERE v."parent_id" = n."id";

    UPDATE "news" SET "region" = NULL
    WHERE "region" IS NOT NULL AND "region" NOT IN ('north-america', 'apac');
    UPDATE "_news_v" SET "version_region" = NULL
    WHERE "version_region" IS NOT NULL AND "version_region" NOT IN ('north-america', 'apac');

    DROP TYPE "public"."enum_news_region";
    DROP TYPE "public"."enum__news_v_version_region";
    CREATE TYPE "public"."enum_news_region" AS ENUM('north-america', 'apac');
    CREATE TYPE "public"."enum__news_v_version_region" AS ENUM('north-america', 'apac');

    ALTER TABLE "news" ALTER COLUMN "region" TYPE "public"."enum_news_region" USING "region"::"public"."enum_news_region";
    ALTER TABLE "_news_v" ALTER COLUMN "version_region" TYPE "public"."enum__news_v_version_region" USING "version_region"::"public"."enum__news_v_version_region";`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "news" ALTER COLUMN "region" TYPE text USING "region"::text;
    ALTER TABLE "_news_v" ALTER COLUMN "version_region" TYPE text USING "version_region"::text;

    UPDATE "news" SET "region" = CASE "region"
      WHEN 'north-america' THEN 'usa-north-america'
      WHEN 'apac' THEN 'asia-pacific'
      ELSE NULL END;
    UPDATE "_news_v" SET "version_region" = CASE "version_region"
      WHEN 'north-america' THEN 'usa-north-america'
      WHEN 'apac' THEN 'asia-pacific'
      ELSE NULL END;

    DROP TYPE "public"."enum_news_region";
    DROP TYPE "public"."enum__news_v_version_region";
    CREATE TYPE "public"."enum_news_region" AS ENUM('asia-pacific', 'europe-middle-east', 'usa-north-america');
    CREATE TYPE "public"."enum__news_v_version_region" AS ENUM('asia-pacific', 'europe-middle-east', 'usa-north-america');

    ALTER TABLE "news" ALTER COLUMN "region" TYPE "public"."enum_news_region" USING "region"::"public"."enum_news_region";
    ALTER TABLE "_news_v" ALTER COLUMN "version_region" TYPE "public"."enum__news_v_version_region" USING "version_region"::"public"."enum__news_v_version_region";`)
}
