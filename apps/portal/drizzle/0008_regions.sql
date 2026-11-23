-- Regions become data (M3). Staff add, rename, reorder and deactivate them on /admin/settings/regions.
--
-- Legacy mapping: the old fixed lists were partners/applications 'india' | 'middle_east' | 'elsewhere', deals 'india' | 'middle_east',
-- staff 'india' | 'middle_east' | 'all'. 'india' and 'middle_east' keep their keys. 'all' stays a staff scope sentinel, not a region.
-- 'elsewhere' has no honest target among India, Middle East, EU and US, so it is kept as an INACTIVE row: existing partners and
-- applications stay valid, and it is not offered for new records. Staff can move those partners to a real region one by one.
-- partners.region, applications.region and registrations.region become foreign keys to regions.key. staff_scopes.region and
-- invites.staff_region stay validated text ('all' or a regions.key, checked by the staff actions) because 'all' is not a row.
CREATE TABLE IF NOT EXISTS "regions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "key" text NOT NULL,
  "name" text NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "regions_key_key" UNIQUE ("key"),
  CONSTRAINT "regions_key_chk" CHECK ("key" ~ '^[a-z][a-z0-9_]{1,31}$' and "key" <> 'all')
);--> statement-breakpoint
INSERT INTO "regions" ("key", "name", "sort_order", "active") VALUES
  ('india', 'India', 10, true),
  ('middle_east', 'Middle East', 20, true),
  ('eu', 'EU', 30, true),
  ('us', 'US', 40, true),
  ('elsewhere', 'Elsewhere', 900, false)
ON CONFLICT ("key") DO NOTHING;--> statement-breakpoint
ALTER TABLE "partners" DROP CONSTRAINT IF EXISTS "partners_region_chk";--> statement-breakpoint
ALTER TABLE "registrations" DROP CONSTRAINT IF EXISTS "registrations_region_chk";--> statement-breakpoint
ALTER TABLE "staff_scopes" DROP CONSTRAINT IF EXISTS "staff_scopes_region_chk";--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'partners_region_fk') THEN
    ALTER TABLE "partners" ADD CONSTRAINT "partners_region_fk" FOREIGN KEY ("region") REFERENCES "regions"("key");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'applications_region_fk') THEN
    ALTER TABLE "applications" ADD CONSTRAINT "applications_region_fk" FOREIGN KEY ("region") REFERENCES "regions"("key");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'registrations_region_fk') THEN
    ALTER TABLE "registrations" ADD CONSTRAINT "registrations_region_fk" FOREIGN KEY ("region") REFERENCES "regions"("key");
  END IF;
END $$;
