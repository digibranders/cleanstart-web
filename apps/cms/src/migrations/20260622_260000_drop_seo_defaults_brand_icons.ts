import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

// Remove the dead brandIcons group from the seoDefaults global. Favicons +
// theme-color are managed in apps/web code (Next.js app/ icon convention files
// + a hardcoded theme-color), so the CMS fields were never consumed.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "seo_defaults" DROP COLUMN "brand_icons_favicon32_id";
  ALTER TABLE "seo_defaults" DROP COLUMN "brand_icons_icon192_id";
  ALTER TABLE "seo_defaults" DROP COLUMN "brand_icons_icon512_id";
  ALTER TABLE "seo_defaults" DROP COLUMN "brand_icons_apple_touch_icon_id";
  ALTER TABLE "seo_defaults" DROP COLUMN "brand_icons_safari_pinned_tab_svg_id";
  ALTER TABLE "seo_defaults" DROP COLUMN "brand_icons_theme_color";
  ALTER TABLE "_seo_defaults_v" DROP COLUMN "version_brand_icons_favicon32_id";
  ALTER TABLE "_seo_defaults_v" DROP COLUMN "version_brand_icons_icon192_id";
  ALTER TABLE "_seo_defaults_v" DROP COLUMN "version_brand_icons_icon512_id";
  ALTER TABLE "_seo_defaults_v" DROP COLUMN "version_brand_icons_apple_touch_icon_id";
  ALTER TABLE "_seo_defaults_v" DROP COLUMN "version_brand_icons_safari_pinned_tab_svg_id";
  ALTER TABLE "_seo_defaults_v" DROP COLUMN "version_brand_icons_theme_color";`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "seo_defaults" ADD COLUMN "brand_icons_favicon32_id" integer;
  ALTER TABLE "seo_defaults" ADD COLUMN "brand_icons_icon192_id" integer;
  ALTER TABLE "seo_defaults" ADD COLUMN "brand_icons_icon512_id" integer;
  ALTER TABLE "seo_defaults" ADD COLUMN "brand_icons_apple_touch_icon_id" integer;
  ALTER TABLE "seo_defaults" ADD COLUMN "brand_icons_safari_pinned_tab_svg_id" integer;
  ALTER TABLE "seo_defaults" ADD COLUMN "brand_icons_theme_color" varchar;
  ALTER TABLE "_seo_defaults_v" ADD COLUMN "version_brand_icons_favicon32_id" integer;
  ALTER TABLE "_seo_defaults_v" ADD COLUMN "version_brand_icons_icon192_id" integer;
  ALTER TABLE "_seo_defaults_v" ADD COLUMN "version_brand_icons_icon512_id" integer;
  ALTER TABLE "_seo_defaults_v" ADD COLUMN "version_brand_icons_apple_touch_icon_id" integer;
  ALTER TABLE "_seo_defaults_v" ADD COLUMN "version_brand_icons_safari_pinned_tab_svg_id" integer;
  ALTER TABLE "_seo_defaults_v" ADD COLUMN "version_brand_icons_theme_color" varchar;
  ALTER TABLE "seo_defaults" ADD CONSTRAINT "seo_defaults_brand_icons_favicon32_id_media_id_fk" FOREIGN KEY ("brand_icons_favicon32_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "seo_defaults" ADD CONSTRAINT "seo_defaults_brand_icons_icon192_id_media_id_fk" FOREIGN KEY ("brand_icons_icon192_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "seo_defaults" ADD CONSTRAINT "seo_defaults_brand_icons_icon512_id_media_id_fk" FOREIGN KEY ("brand_icons_icon512_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "seo_defaults" ADD CONSTRAINT "seo_defaults_brand_icons_apple_touch_icon_id_media_id_fk" FOREIGN KEY ("brand_icons_apple_touch_icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "seo_defaults" ADD CONSTRAINT "seo_defaults_brand_icons_safari_pinned_tab_svg_id_media_id_fk" FOREIGN KEY ("brand_icons_safari_pinned_tab_svg_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_seo_defaults_v" ADD CONSTRAINT "_seo_defaults_v_version_brand_icons_favicon32_id_media_id_fk" FOREIGN KEY ("version_brand_icons_favicon32_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_seo_defaults_v" ADD CONSTRAINT "_seo_defaults_v_version_brand_icons_icon192_id_media_id_fk" FOREIGN KEY ("version_brand_icons_icon192_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_seo_defaults_v" ADD CONSTRAINT "_seo_defaults_v_version_brand_icons_icon512_id_media_id_fk" FOREIGN KEY ("version_brand_icons_icon512_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_seo_defaults_v" ADD CONSTRAINT "_seo_defaults_v_version_brand_icons_apple_touch_icon_id_media_i" FOREIGN KEY ("version_brand_icons_apple_touch_icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_seo_defaults_v" ADD CONSTRAINT "_seo_defaults_v_version_brand_icons_safari_pinned_tab_svg_id_me" FOREIGN KEY ("version_brand_icons_safari_pinned_tab_svg_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "seo_defaults_brand_icons_brand_icons_favicon32_idx" ON "seo_defaults" USING btree ("brand_icons_favicon32_id");
  CREATE INDEX "seo_defaults_brand_icons_brand_icons_icon192_idx" ON "seo_defaults" USING btree ("brand_icons_icon192_id");
  CREATE INDEX "seo_defaults_brand_icons_brand_icons_icon512_idx" ON "seo_defaults" USING btree ("brand_icons_icon512_id");
  CREATE INDEX "seo_defaults_brand_icons_brand_icons_apple_touch_icon_idx" ON "seo_defaults" USING btree ("brand_icons_apple_touch_icon_id");
  CREATE INDEX "seo_defaults_brand_icons_brand_icons_safari_pinned_tab_s_idx" ON "seo_defaults" USING btree ("brand_icons_safari_pinned_tab_svg_id");
  CREATE INDEX "_seo_defaults_v_version_brand_icons_version_brand_icons__idx" ON "_seo_defaults_v" USING btree ("version_brand_icons_favicon32_id");
  CREATE INDEX "_seo_defaults_v_version_brand_icons_version_brand_icon_1_idx" ON "_seo_defaults_v" USING btree ("version_brand_icons_icon192_id");
  CREATE INDEX "_seo_defaults_v_version_brand_icons_version_brand_icon_2_idx" ON "_seo_defaults_v" USING btree ("version_brand_icons_icon512_id");
  CREATE INDEX "_seo_defaults_v_version_brand_icons_version_brand_icon_3_idx" ON "_seo_defaults_v" USING btree ("version_brand_icons_apple_touch_icon_id");
  CREATE INDEX "_seo_defaults_v_version_brand_icons_version_brand_icon_4_idx" ON "_seo_defaults_v" USING btree ("version_brand_icons_safari_pinned_tab_svg_id");`)
}
