ALTER TABLE "partners" DROP CONSTRAINT IF EXISTS "partners_category_chk";--> statement-breakpoint
ALTER TABLE "documents" DROP CONSTRAINT IF EXISTS "documents_categories_chk";--> statement-breakpoint
UPDATE "partners" SET "category" = 'channel' WHERE "category" = 'integrator';--> statement-breakpoint
UPDATE "applications" SET "category" = 'channel' WHERE "category" = 'integrator';--> statement-breakpoint
UPDATE "documents" SET "audience_categories" = ARRAY(SELECT DISTINCT CASE WHEN c = 'integrator' THEN 'channel' ELSE c END FROM unnest("audience_categories") AS c ORDER BY 1) WHERE 'integrator' = ANY("audience_categories");--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'partners_category_chk') THEN
    ALTER TABLE "partners" ADD CONSTRAINT "partners_category_chk" CHECK ("partners"."category" in ('distributor', 'channel'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'documents_categories_chk') THEN
    ALTER TABLE "documents" ADD CONSTRAINT "documents_categories_chk" CHECK ("documents"."audience_categories" <@ array['distributor', 'channel']::text[]);
  END IF;
END $$;
