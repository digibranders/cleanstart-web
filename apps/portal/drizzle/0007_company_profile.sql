ALTER TABLE "partners" ADD COLUMN IF NOT EXISTS "legal_name" text;--> statement-breakpoint
ALTER TABLE "partners" ADD COLUMN IF NOT EXISTS "tax_id" text;--> statement-breakpoint
ALTER TABLE "partners" ADD COLUMN IF NOT EXISTS "hq_country" text;--> statement-breakpoint
ALTER TABLE "partners" ADD COLUMN IF NOT EXISTS "headcount_band" text;--> statement-breakpoint
ALTER TABLE "partners" ADD COLUMN IF NOT EXISTS "billing_contact_name" text;--> statement-breakpoint
ALTER TABLE "partners" ADD COLUMN IF NOT EXISTS "billing_contact_email" text;--> statement-breakpoint
ALTER TABLE "partners" ADD COLUMN IF NOT EXISTS "support_contact_name" text;--> statement-breakpoint
ALTER TABLE "partners" ADD COLUMN IF NOT EXISTS "support_contact_email" text;--> statement-breakpoint
ALTER TABLE "partners" ADD COLUMN IF NOT EXISTS "logo_key" text;--> statement-breakpoint
ALTER TABLE "partners" DROP CONSTRAINT IF EXISTS "partners_headcount_chk";--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'partners_headcount_chk') THEN
    ALTER TABLE "partners" ADD CONSTRAINT "partners_headcount_chk" CHECK ("partners"."headcount_band" is null or "partners"."headcount_band" in ('1-10', '11-50', '51-200', '201-1000', '1000+'));
  END IF;
END $$;
