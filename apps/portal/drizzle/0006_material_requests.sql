CREATE TABLE IF NOT EXISTS "material_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "partner_id" uuid NOT NULL REFERENCES "partners"("id"),
  "requested_by" uuid NOT NULL REFERENCES "users"("id"),
  "subject" text NOT NULL,
  "details" text NOT NULL,
  "product" text NOT NULL,
  "status" text DEFAULT 'open' NOT NULL,
  "response_note" text,
  "document_id" uuid REFERENCES "documents"("id"),
  "assigned_to" uuid REFERENCES "users"("id"),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "closed_at" timestamp with time zone,
  CONSTRAINT "material_requests_status_chk" CHECK ("status" in ('open', 'in_progress', 'done', 'declined')),
  CONSTRAINT "material_requests_product_chk" CHECK ("product" in ('images', 'libraries', 'cleansight', 'all'))
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "material_requests_partner_idx" ON "material_requests" USING btree ("partner_id", "created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "material_requests_status_idx" ON "material_requests" USING btree ("status", "created_at");--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "change_note" text;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'published' NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "document_versions" ADD COLUMN IF NOT EXISTS "change_note" text;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'documents_status_chk') THEN
    ALTER TABLE "documents" ADD CONSTRAINT "documents_status_chk" CHECK ("status" in ('draft', 'published'));
  END IF;
END $$;--> statement-breakpoint
ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "notifications_kind_chk";--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notifications_kind_chk') THEN
    ALTER TABLE "notifications" ADD CONSTRAINT "notifications_kind_chk" CHECK ("notifications"."kind" in ('registration_submitted', 'registration_accepted', 'registration_rejected', 'registration_resubmitted', 'registration_stage', 'registration_message', 'registration_expiring', 'registration_expired', 'extension_requested', 'extension_decided', 'document_new', 'access_requested', 'application_new', 'team_joined', 'team_removed', 'role_changed', 'material_request_update'));
  END IF;
END $$;
