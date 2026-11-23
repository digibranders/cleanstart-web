-- A saved dashboard arrangement per person and dashboard: card order, hidden cards and chosen widths, as one small JSON document.
-- Own rows only (see rls.sql). Safe to run again.
CREATE TABLE IF NOT EXISTS "dashboard_layouts" (
  "user_id" uuid NOT NULL,
  "dashboard" text NOT NULL,
  "layout" jsonb NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "dashboard_layouts_user_id_dashboard_pk" PRIMARY KEY ("user_id", "dashboard"),
  CONSTRAINT "dashboard_layouts_dashboard_chk" CHECK ("dashboard" in ('staff-overview', 'partner-overview'))
);--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'dashboard_layouts_user_id_users_id_fk') THEN
    ALTER TABLE "dashboard_layouts" ADD CONSTRAINT "dashboard_layouts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id");
  END IF;
END $$;
