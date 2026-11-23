-- A staff member can cover several regions (M3b). One row per (staff user, region key); the pair is unique.
-- 'All regions' keeps its old representation: staff_scopes.region = 'all' and no rows here. For a limited staff member
-- staff_scopes.region keeps one of the covered keys (the first by list order) as a plain fallback, and these rows are
-- the truth. Regions are never deleted, so the foreign key never blocks anything.
CREATE TABLE IF NOT EXISTS "staff_regions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "region_key" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "staff_regions_user_region_key" UNIQUE ("user_id", "region_key")
);--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'staff_regions_user_id_users_id_fk') THEN
    ALTER TABLE "staff_regions" ADD CONSTRAINT "staff_regions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'staff_regions_region_key_fk') THEN
    ALTER TABLE "staff_regions" ADD CONSTRAINT "staff_regions_region_key_fk" FOREIGN KEY ("region_key") REFERENCES "regions"("key");
  END IF;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "staff_regions_region_idx" ON "staff_regions" ("region_key");--> statement-breakpoint
-- Backfill: a single key becomes one row; 'all' stays 'all' with no rows. Safe to run again.
-- staff_scopes has forced row level security and the owner role is not exempt, so the backfill reads it as the system actor.
SELECT set_config('app.kind', 'system', true);--> statement-breakpoint
INSERT INTO "staff_regions" ("user_id", "region_key")
SELECT s."user_id", s."region" FROM "staff_scopes" s
WHERE s."region" <> 'all' AND EXISTS (SELECT 1 FROM "regions" r WHERE r."key" = s."region")
ON CONFLICT ("user_id", "region_key") DO NOTHING;
