CREATE SEQUENCE IF NOT EXISTS "public"."registration_reference_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
ALTER TABLE "registrations" ADD COLUMN IF NOT EXISTS "reference" text;--> statement-breakpoint
ALTER TABLE "registrations" ADD COLUMN IF NOT EXISTS "deal_value" numeric(14, 2);--> statement-breakpoint
ALTER TABLE "registrations" ADD COLUMN IF NOT EXISTS "currency" text DEFAULT 'USD' NOT NULL;--> statement-breakpoint
ALTER TABLE "registrations" ADD COLUMN IF NOT EXISTS "customer_country" text;--> statement-breakpoint
ALTER TABLE "registrations" ADD COLUMN IF NOT EXISTS "customer_industry" text;--> statement-breakpoint
ALTER TABLE "registrations" ADD COLUMN IF NOT EXISTS "use_case" text;--> statement-breakpoint
ALTER TABLE "registrations" ADD COLUMN IF NOT EXISTS "competitor" text;--> statement-breakpoint
ALTER TABLE "registrations" ADD COLUMN IF NOT EXISTS "seats" integer;--> statement-breakpoint
ALTER TABLE "registrations" ADD COLUMN IF NOT EXISTS "sales_stage" text;--> statement-breakpoint
ALTER TABLE "registrations" ADD COLUMN IF NOT EXISTS "decision_date" date;--> statement-breakpoint
UPDATE "registrations" AS r SET "reference" = 'REG-' || to_char(o."created_at", 'YYMM') || '-' || lpad(o."n"::text, 4, '0')
FROM (SELECT "id", "created_at", nextval('registration_reference_seq') AS "n" FROM (SELECT "id", "created_at" FROM "registrations" WHERE "reference" IS NULL ORDER BY "created_at", "id") AS q) AS o
WHERE r."id" = o."id";--> statement-breakpoint
ALTER TABLE "registrations" ALTER COLUMN "reference" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "registrations_reference_key" ON "registrations" USING btree ("reference");--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'registrations_currency_chk') THEN
    ALTER TABLE "registrations" ADD CONSTRAINT "registrations_currency_chk" CHECK ("registrations"."currency" in ('USD', 'EUR', 'GBP', 'INR', 'AED', 'SAR'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'registrations_deal_value_chk') THEN
    ALTER TABLE "registrations" ADD CONSTRAINT "registrations_deal_value_chk" CHECK ("registrations"."deal_value" is null or "registrations"."deal_value" >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'registrations_seats_chk') THEN
    ALTER TABLE "registrations" ADD CONSTRAINT "registrations_seats_chk" CHECK ("registrations"."seats" is null or "registrations"."seats" >= 0);
  END IF;
END $$;
