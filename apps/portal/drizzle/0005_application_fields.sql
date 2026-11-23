ALTER TABLE "applications" ADD COLUMN IF NOT EXISTS "vendors" text[];--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN IF NOT EXISTS "products" text[];--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN IF NOT EXISTS "company_size" text;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN IF NOT EXISTS "years_in_business" text;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN IF NOT EXISTS "verticals" text[];--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN IF NOT EXISTS "country" text;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN IF NOT EXISTS "referral_source" text;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN IF NOT EXISTS "consent_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN IF NOT EXISTS "invite_reminder_sent_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "applications" DROP CONSTRAINT IF EXISTS "applications_status_chk";--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'applications_status_chk') THEN
    ALTER TABLE "applications" ADD CONSTRAINT "applications_status_chk" CHECK ("applications"."status" in ('new', 'info_requested', 'approved', 'declined'));
  END IF;
END $$;--> statement-breakpoint
DROP INDEX IF EXISTS "applications_open_portal_email_key";--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "applications_open_portal_email_key" ON "applications" USING btree (lower("email")) WHERE "applications"."status" in ('new', 'info_requested') and "applications"."source" = 'portal';--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "application_notes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "application_id" uuid NOT NULL REFERENCES "applications"("id") ON DELETE CASCADE,
  "author_id" uuid REFERENCES "users"("id"),
  "kind" text DEFAULT 'internal' NOT NULL,
  "note" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "application_notes_kind_chk" CHECK ("kind" in ('internal', 'info_request', 'applicant_reply'))
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "application_notes_application_idx" ON "application_notes" USING btree ("application_id", "created_at");--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "application_tokens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "application_id" uuid NOT NULL REFERENCES "applications"("id") ON DELETE CASCADE,
  "kind" text NOT NULL,
  "token_hash" text NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "used_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "application_tokens_kind_chk" CHECK ("kind" in ('status', 'reply'))
);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "application_tokens_token_hash_key" ON "application_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "application_tokens_application_idx" ON "application_tokens" USING btree ("application_id", "kind");
