ALTER TABLE "invites" ADD COLUMN IF NOT EXISTS "name" text;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "email_change_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "partner_id" uuid NOT NULL REFERENCES "partners"("id"),
  "user_id" uuid NOT NULL REFERENCES "users"("id"),
  "new_email" text NOT NULL,
  "token_hash" text NOT NULL,
  "requested_by" uuid REFERENCES "users"("id"),
  "expires_at" timestamp with time zone NOT NULL,
  "used_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "email_change_requests_email_lower" CHECK ("new_email" = lower("new_email"))
);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "email_change_requests_token_hash_key" ON "email_change_requests" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_change_requests_user_idx" ON "email_change_requests" USING btree ("user_id");
