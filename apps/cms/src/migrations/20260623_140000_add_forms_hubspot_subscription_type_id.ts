import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

// hubspotSubscriptionTypeId on the forms collection: the HubSpot marketing
// subscription type a form opts the contact into. forms has versions:{drafts}
// so the _forms_v table gets the version_-prefixed column too.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "forms" ADD COLUMN "hubspot_subscription_type_id" varchar;
  ALTER TABLE "_forms_v" ADD COLUMN "version_hubspot_subscription_type_id" varchar;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "forms" DROP COLUMN "hubspot_subscription_type_id";
  ALTER TABLE "_forms_v" DROP COLUMN "version_hubspot_subscription_type_id";`)
}
