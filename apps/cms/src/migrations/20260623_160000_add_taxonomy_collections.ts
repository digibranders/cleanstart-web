import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

// Recovery migration for the filter->taxonomy promotion feature, whose
// code (6 taxonomy collections + ...Ref relationship fields on News /
// Resources / Jobs / Case Studies / Webinars) was deployed without its
// schema migration. Creates the 6 taxonomy tables (+ version tables) and
// the ...Ref columns the deployed admin queries. DDL mirrors the
// push-built local schema exactly.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
-- ============================================================
-- Recovery migration: filter->taxonomy promotion schema.
-- The taxonomy-promotion feature (6 collections + ...Ref relationship
-- fields) shipped to main without a migration, so prod's DB lacks these
-- objects while the deployed code queries them -> admin edit/list views
-- 500 (e.g. "column _jobs_v.version_department_ref_id does not exist").
-- DDL captured from the local push-built schema (authoritative source).
-- ============================================================

-- 1. Enum types for the 6 taxonomy collections (status + SEO selects)
DO $$ BEGIN
  CREATE TYPE public."enum__departments_v_version_seo_indexable" AS ENUM ('index', 'noindex', 'noindex,nofollow');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE public."enum__departments_v_version_seo_twitter_card" AS ENUM ('summary', 'summary_large_image');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE public."enum__departments_v_version_status" AS ENUM ('draft', 'published');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE public."enum__industries_v_version_seo_indexable" AS ENUM ('index', 'noindex', 'noindex,nofollow');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE public."enum__industries_v_version_seo_twitter_card" AS ENUM ('summary', 'summary_large_image');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE public."enum__industries_v_version_status" AS ENUM ('draft', 'published');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE public."enum__press_types_v_version_seo_indexable" AS ENUM ('index', 'noindex', 'noindex,nofollow');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE public."enum__press_types_v_version_seo_twitter_card" AS ENUM ('summary', 'summary_large_image');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE public."enum__press_types_v_version_status" AS ENUM ('draft', 'published');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE public."enum__regions_v_version_seo_indexable" AS ENUM ('index', 'noindex', 'noindex,nofollow');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE public."enum__regions_v_version_seo_twitter_card" AS ENUM ('summary', 'summary_large_image');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE public."enum__regions_v_version_status" AS ENUM ('draft', 'published');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE public."enum__resource_types_v_version_seo_indexable" AS ENUM ('index', 'noindex', 'noindex,nofollow');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE public."enum__resource_types_v_version_seo_twitter_card" AS ENUM ('summary', 'summary_large_image');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE public."enum__resource_types_v_version_status" AS ENUM ('draft', 'published');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE public."enum__webinar_types_v_version_seo_indexable" AS ENUM ('index', 'noindex', 'noindex,nofollow');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE public."enum__webinar_types_v_version_seo_twitter_card" AS ENUM ('summary', 'summary_large_image');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE public."enum__webinar_types_v_version_status" AS ENUM ('draft', 'published');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE public."enum_departments_seo_indexable" AS ENUM ('index', 'noindex', 'noindex,nofollow');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE public."enum_departments_seo_twitter_card" AS ENUM ('summary', 'summary_large_image');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE public."enum_departments_status" AS ENUM ('draft', 'published');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE public."enum_industries_seo_indexable" AS ENUM ('index', 'noindex', 'noindex,nofollow');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE public."enum_industries_seo_twitter_card" AS ENUM ('summary', 'summary_large_image');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE public."enum_industries_status" AS ENUM ('draft', 'published');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE public."enum_press_types_seo_indexable" AS ENUM ('index', 'noindex', 'noindex,nofollow');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE public."enum_press_types_seo_twitter_card" AS ENUM ('summary', 'summary_large_image');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE public."enum_press_types_status" AS ENUM ('draft', 'published');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE public."enum_regions_seo_indexable" AS ENUM ('index', 'noindex', 'noindex,nofollow');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE public."enum_regions_seo_twitter_card" AS ENUM ('summary', 'summary_large_image');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE public."enum_regions_status" AS ENUM ('draft', 'published');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE public."enum_resource_types_seo_indexable" AS ENUM ('index', 'noindex', 'noindex,nofollow');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE public."enum_resource_types_seo_twitter_card" AS ENUM ('summary', 'summary_large_image');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE public."enum_resource_types_status" AS ENUM ('draft', 'published');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE public."enum_webinar_types_seo_indexable" AS ENUM ('index', 'noindex', 'noindex,nofollow');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE public."enum_webinar_types_seo_twitter_card" AS ENUM ('summary', 'summary_large_image');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE public."enum_webinar_types_status" AS ENUM ('draft', 'published');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Taxonomy collection tables (+ version tables, speakable-path arrays,
--    sequences, PK/FK constraints, indexes)
CREATE TABLE IF NOT EXISTS public._departments_v (
    id integer NOT NULL,
    parent_id integer,
    version_name character varying,
    version_slug character varying,
    version_description character varying,
    version_icon_id integer,
    version_parent_id integer,
    version_seo_title character varying,
    version_seo_description character varying,
    version_seo_indexable public.enum__departments_v_version_seo_indexable DEFAULT 'index'::public.enum__departments_v_version_seo_indexable,
    version_seo_og_image_id integer,
    version_seo_og_image_alt character varying,
    version_seo_use_advanced_og boolean DEFAULT false,
    version_seo_og_title character varying,
    version_seo_og_description character varying,
    version_seo_use_advanced_twitter boolean DEFAULT false,
    version_seo_twitter_card public.enum__departments_v_version_seo_twitter_card DEFAULT 'summary_large_image'::public.enum__departments_v_version_seo_twitter_card,
    version_seo_twitter_title character varying,
    version_seo_twitter_description character varying,
    version_seo_twitter_image_id integer,
    version_seo_use_custom_canonical boolean DEFAULT false,
    version_seo_canonical_override character varying,
    version_seo_robots_advanced_noarchive boolean DEFAULT false,
    version_seo_robots_advanced_nosnippet boolean DEFAULT false,
    version_seo_robots_advanced_noimageindex boolean DEFAULT false,
    version_seo_robots_advanced_notranslate boolean DEFAULT false,
    version_seo_robots_advanced_max_snippet numeric,
    version_seo_robots_advanced_max_image_preview public.enum_seo_max_image_preview,
    version_seo_robots_advanced_max_video_preview numeric,
    version_seo_robots_advanced_unavailable_after timestamp(3) with time zone,
    version_seo_alternates jsonb,
    version_seo_custom_tags jsonb,
    version_seo_keyword_target character varying,
    version_seo_keywords jsonb,
    version_seo_additional_schema jsonb,
    version_seo_schema_history jsonb,
    version_updated_at timestamp(3) with time zone,
    version_created_at timestamp(3) with time zone,
    version__status public.enum__departments_v_version_status DEFAULT 'draft'::public.enum__departments_v_version_status,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    latest boolean
);



CREATE SEQUENCE IF NOT EXISTS public._departments_v_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



ALTER SEQUENCE public._departments_v_id_seq OWNED BY public._departments_v.id;



CREATE TABLE IF NOT EXISTS public._departments_v_version_seo_speakable_path (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id integer NOT NULL,
    selector character varying,
    _uuid character varying
);



CREATE SEQUENCE IF NOT EXISTS public._departments_v_version_seo_speakable_path_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



ALTER SEQUENCE public._departments_v_version_seo_speakable_path_id_seq OWNED BY public._departments_v_version_seo_speakable_path.id;



CREATE TABLE IF NOT EXISTS public._industries_v (
    id integer NOT NULL,
    parent_id integer,
    version_name character varying,
    version_slug character varying,
    version_description character varying,
    version_icon_id integer,
    version_parent_id integer,
    version_seo_title character varying,
    version_seo_description character varying,
    version_seo_indexable public.enum__industries_v_version_seo_indexable DEFAULT 'index'::public.enum__industries_v_version_seo_indexable,
    version_seo_og_image_id integer,
    version_seo_og_image_alt character varying,
    version_seo_use_advanced_og boolean DEFAULT false,
    version_seo_og_title character varying,
    version_seo_og_description character varying,
    version_seo_use_advanced_twitter boolean DEFAULT false,
    version_seo_twitter_card public.enum__industries_v_version_seo_twitter_card DEFAULT 'summary_large_image'::public.enum__industries_v_version_seo_twitter_card,
    version_seo_twitter_title character varying,
    version_seo_twitter_description character varying,
    version_seo_twitter_image_id integer,
    version_seo_use_custom_canonical boolean DEFAULT false,
    version_seo_canonical_override character varying,
    version_seo_robots_advanced_noarchive boolean DEFAULT false,
    version_seo_robots_advanced_nosnippet boolean DEFAULT false,
    version_seo_robots_advanced_noimageindex boolean DEFAULT false,
    version_seo_robots_advanced_notranslate boolean DEFAULT false,
    version_seo_robots_advanced_max_snippet numeric,
    version_seo_robots_advanced_max_image_preview public.enum_seo_max_image_preview,
    version_seo_robots_advanced_max_video_preview numeric,
    version_seo_robots_advanced_unavailable_after timestamp(3) with time zone,
    version_seo_alternates jsonb,
    version_seo_custom_tags jsonb,
    version_seo_keyword_target character varying,
    version_seo_keywords jsonb,
    version_seo_additional_schema jsonb,
    version_seo_schema_history jsonb,
    version_updated_at timestamp(3) with time zone,
    version_created_at timestamp(3) with time zone,
    version__status public.enum__industries_v_version_status DEFAULT 'draft'::public.enum__industries_v_version_status,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    latest boolean
);



CREATE SEQUENCE IF NOT EXISTS public._industries_v_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



ALTER SEQUENCE public._industries_v_id_seq OWNED BY public._industries_v.id;



CREATE TABLE IF NOT EXISTS public._industries_v_version_seo_speakable_path (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id integer NOT NULL,
    selector character varying,
    _uuid character varying
);



CREATE SEQUENCE IF NOT EXISTS public._industries_v_version_seo_speakable_path_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



ALTER SEQUENCE public._industries_v_version_seo_speakable_path_id_seq OWNED BY public._industries_v_version_seo_speakable_path.id;



CREATE TABLE IF NOT EXISTS public._press_types_v (
    id integer NOT NULL,
    parent_id integer,
    version_name character varying,
    version_slug character varying,
    version_description character varying,
    version_icon_id integer,
    version_parent_id integer,
    version_seo_title character varying,
    version_seo_description character varying,
    version_seo_indexable public.enum__press_types_v_version_seo_indexable DEFAULT 'index'::public.enum__press_types_v_version_seo_indexable,
    version_seo_og_image_id integer,
    version_seo_og_image_alt character varying,
    version_seo_use_advanced_og boolean DEFAULT false,
    version_seo_og_title character varying,
    version_seo_og_description character varying,
    version_seo_use_advanced_twitter boolean DEFAULT false,
    version_seo_twitter_card public.enum__press_types_v_version_seo_twitter_card DEFAULT 'summary_large_image'::public.enum__press_types_v_version_seo_twitter_card,
    version_seo_twitter_title character varying,
    version_seo_twitter_description character varying,
    version_seo_twitter_image_id integer,
    version_seo_use_custom_canonical boolean DEFAULT false,
    version_seo_canonical_override character varying,
    version_seo_robots_advanced_noarchive boolean DEFAULT false,
    version_seo_robots_advanced_nosnippet boolean DEFAULT false,
    version_seo_robots_advanced_noimageindex boolean DEFAULT false,
    version_seo_robots_advanced_notranslate boolean DEFAULT false,
    version_seo_robots_advanced_max_snippet numeric,
    version_seo_robots_advanced_max_image_preview public.enum_seo_max_image_preview,
    version_seo_robots_advanced_max_video_preview numeric,
    version_seo_robots_advanced_unavailable_after timestamp(3) with time zone,
    version_seo_alternates jsonb,
    version_seo_custom_tags jsonb,
    version_seo_keyword_target character varying,
    version_seo_keywords jsonb,
    version_seo_additional_schema jsonb,
    version_seo_schema_history jsonb,
    version_updated_at timestamp(3) with time zone,
    version_created_at timestamp(3) with time zone,
    version__status public.enum__press_types_v_version_status DEFAULT 'draft'::public.enum__press_types_v_version_status,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    latest boolean
);



CREATE SEQUENCE IF NOT EXISTS public._press_types_v_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



ALTER SEQUENCE public._press_types_v_id_seq OWNED BY public._press_types_v.id;



CREATE TABLE IF NOT EXISTS public._press_types_v_version_seo_speakable_path (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id integer NOT NULL,
    selector character varying,
    _uuid character varying
);



CREATE SEQUENCE IF NOT EXISTS public._press_types_v_version_seo_speakable_path_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



ALTER SEQUENCE public._press_types_v_version_seo_speakable_path_id_seq OWNED BY public._press_types_v_version_seo_speakable_path.id;



CREATE TABLE IF NOT EXISTS public._regions_v (
    id integer NOT NULL,
    parent_id integer,
    version_name character varying,
    version_slug character varying,
    version_description character varying,
    version_icon_id integer,
    version_parent_id integer,
    version_seo_title character varying,
    version_seo_description character varying,
    version_seo_indexable public.enum__regions_v_version_seo_indexable DEFAULT 'index'::public.enum__regions_v_version_seo_indexable,
    version_seo_og_image_id integer,
    version_seo_og_image_alt character varying,
    version_seo_use_advanced_og boolean DEFAULT false,
    version_seo_og_title character varying,
    version_seo_og_description character varying,
    version_seo_use_advanced_twitter boolean DEFAULT false,
    version_seo_twitter_card public.enum__regions_v_version_seo_twitter_card DEFAULT 'summary_large_image'::public.enum__regions_v_version_seo_twitter_card,
    version_seo_twitter_title character varying,
    version_seo_twitter_description character varying,
    version_seo_twitter_image_id integer,
    version_seo_use_custom_canonical boolean DEFAULT false,
    version_seo_canonical_override character varying,
    version_seo_robots_advanced_noarchive boolean DEFAULT false,
    version_seo_robots_advanced_nosnippet boolean DEFAULT false,
    version_seo_robots_advanced_noimageindex boolean DEFAULT false,
    version_seo_robots_advanced_notranslate boolean DEFAULT false,
    version_seo_robots_advanced_max_snippet numeric,
    version_seo_robots_advanced_max_image_preview public.enum_seo_max_image_preview,
    version_seo_robots_advanced_max_video_preview numeric,
    version_seo_robots_advanced_unavailable_after timestamp(3) with time zone,
    version_seo_alternates jsonb,
    version_seo_custom_tags jsonb,
    version_seo_keyword_target character varying,
    version_seo_keywords jsonb,
    version_seo_additional_schema jsonb,
    version_seo_schema_history jsonb,
    version_updated_at timestamp(3) with time zone,
    version_created_at timestamp(3) with time zone,
    version__status public.enum__regions_v_version_status DEFAULT 'draft'::public.enum__regions_v_version_status,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    latest boolean
);



CREATE SEQUENCE IF NOT EXISTS public._regions_v_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



ALTER SEQUENCE public._regions_v_id_seq OWNED BY public._regions_v.id;



CREATE TABLE IF NOT EXISTS public._regions_v_version_seo_speakable_path (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id integer NOT NULL,
    selector character varying,
    _uuid character varying
);



CREATE SEQUENCE IF NOT EXISTS public._regions_v_version_seo_speakable_path_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



ALTER SEQUENCE public._regions_v_version_seo_speakable_path_id_seq OWNED BY public._regions_v_version_seo_speakable_path.id;



CREATE TABLE IF NOT EXISTS public._resource_types_v (
    id integer NOT NULL,
    parent_id integer,
    version_name character varying,
    version_slug character varying,
    version_description character varying,
    version_icon_id integer,
    version_parent_id integer,
    version_seo_title character varying,
    version_seo_description character varying,
    version_seo_indexable public.enum__resource_types_v_version_seo_indexable DEFAULT 'index'::public.enum__resource_types_v_version_seo_indexable,
    version_seo_og_image_id integer,
    version_seo_og_image_alt character varying,
    version_seo_use_advanced_og boolean DEFAULT false,
    version_seo_og_title character varying,
    version_seo_og_description character varying,
    version_seo_use_advanced_twitter boolean DEFAULT false,
    version_seo_twitter_card public.enum__resource_types_v_version_seo_twitter_card DEFAULT 'summary_large_image'::public.enum__resource_types_v_version_seo_twitter_card,
    version_seo_twitter_title character varying,
    version_seo_twitter_description character varying,
    version_seo_twitter_image_id integer,
    version_seo_use_custom_canonical boolean DEFAULT false,
    version_seo_canonical_override character varying,
    version_seo_robots_advanced_noarchive boolean DEFAULT false,
    version_seo_robots_advanced_nosnippet boolean DEFAULT false,
    version_seo_robots_advanced_noimageindex boolean DEFAULT false,
    version_seo_robots_advanced_notranslate boolean DEFAULT false,
    version_seo_robots_advanced_max_snippet numeric,
    version_seo_robots_advanced_max_image_preview public.enum_seo_max_image_preview,
    version_seo_robots_advanced_max_video_preview numeric,
    version_seo_robots_advanced_unavailable_after timestamp(3) with time zone,
    version_seo_alternates jsonb,
    version_seo_custom_tags jsonb,
    version_seo_keyword_target character varying,
    version_seo_keywords jsonb,
    version_seo_additional_schema jsonb,
    version_seo_schema_history jsonb,
    version_updated_at timestamp(3) with time zone,
    version_created_at timestamp(3) with time zone,
    version__status public.enum__resource_types_v_version_status DEFAULT 'draft'::public.enum__resource_types_v_version_status,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    latest boolean
);



CREATE SEQUENCE IF NOT EXISTS public._resource_types_v_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



ALTER SEQUENCE public._resource_types_v_id_seq OWNED BY public._resource_types_v.id;



CREATE TABLE IF NOT EXISTS public._resource_types_v_version_seo_speakable_path (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id integer NOT NULL,
    selector character varying,
    _uuid character varying
);



CREATE SEQUENCE IF NOT EXISTS public._resource_types_v_version_seo_speakable_path_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



ALTER SEQUENCE public._resource_types_v_version_seo_speakable_path_id_seq OWNED BY public._resource_types_v_version_seo_speakable_path.id;



CREATE TABLE IF NOT EXISTS public._webinar_types_v (
    id integer NOT NULL,
    parent_id integer,
    version_name character varying,
    version_slug character varying,
    version_description character varying,
    version_icon_id integer,
    version_parent_id integer,
    version_seo_title character varying,
    version_seo_description character varying,
    version_seo_indexable public.enum__webinar_types_v_version_seo_indexable DEFAULT 'index'::public.enum__webinar_types_v_version_seo_indexable,
    version_seo_og_image_id integer,
    version_seo_og_image_alt character varying,
    version_seo_use_advanced_og boolean DEFAULT false,
    version_seo_og_title character varying,
    version_seo_og_description character varying,
    version_seo_use_advanced_twitter boolean DEFAULT false,
    version_seo_twitter_card public.enum__webinar_types_v_version_seo_twitter_card DEFAULT 'summary_large_image'::public.enum__webinar_types_v_version_seo_twitter_card,
    version_seo_twitter_title character varying,
    version_seo_twitter_description character varying,
    version_seo_twitter_image_id integer,
    version_seo_use_custom_canonical boolean DEFAULT false,
    version_seo_canonical_override character varying,
    version_seo_robots_advanced_noarchive boolean DEFAULT false,
    version_seo_robots_advanced_nosnippet boolean DEFAULT false,
    version_seo_robots_advanced_noimageindex boolean DEFAULT false,
    version_seo_robots_advanced_notranslate boolean DEFAULT false,
    version_seo_robots_advanced_max_snippet numeric,
    version_seo_robots_advanced_max_image_preview public.enum_seo_max_image_preview,
    version_seo_robots_advanced_max_video_preview numeric,
    version_seo_robots_advanced_unavailable_after timestamp(3) with time zone,
    version_seo_alternates jsonb,
    version_seo_custom_tags jsonb,
    version_seo_keyword_target character varying,
    version_seo_keywords jsonb,
    version_seo_additional_schema jsonb,
    version_seo_schema_history jsonb,
    version_updated_at timestamp(3) with time zone,
    version_created_at timestamp(3) with time zone,
    version__status public.enum__webinar_types_v_version_status DEFAULT 'draft'::public.enum__webinar_types_v_version_status,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    latest boolean
);



CREATE SEQUENCE IF NOT EXISTS public._webinar_types_v_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



ALTER SEQUENCE public._webinar_types_v_id_seq OWNED BY public._webinar_types_v.id;



CREATE TABLE IF NOT EXISTS public._webinar_types_v_version_seo_speakable_path (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id integer NOT NULL,
    selector character varying,
    _uuid character varying
);



CREATE SEQUENCE IF NOT EXISTS public._webinar_types_v_version_seo_speakable_path_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



ALTER SEQUENCE public._webinar_types_v_version_seo_speakable_path_id_seq OWNED BY public._webinar_types_v_version_seo_speakable_path.id;



CREATE TABLE IF NOT EXISTS public.departments (
    id integer NOT NULL,
    name character varying,
    slug character varying,
    description character varying,
    icon_id integer,
    parent_id integer,
    seo_title character varying,
    seo_description character varying,
    seo_indexable public.enum_departments_seo_indexable DEFAULT 'index'::public.enum_departments_seo_indexable,
    seo_og_image_id integer,
    seo_og_image_alt character varying,
    seo_use_advanced_og boolean DEFAULT false,
    seo_og_title character varying,
    seo_og_description character varying,
    seo_use_advanced_twitter boolean DEFAULT false,
    seo_twitter_card public.enum_departments_seo_twitter_card DEFAULT 'summary_large_image'::public.enum_departments_seo_twitter_card,
    seo_twitter_title character varying,
    seo_twitter_description character varying,
    seo_twitter_image_id integer,
    seo_use_custom_canonical boolean DEFAULT false,
    seo_canonical_override character varying,
    seo_robots_advanced_noarchive boolean DEFAULT false,
    seo_robots_advanced_nosnippet boolean DEFAULT false,
    seo_robots_advanced_noimageindex boolean DEFAULT false,
    seo_robots_advanced_notranslate boolean DEFAULT false,
    seo_robots_advanced_max_snippet numeric,
    seo_robots_advanced_max_image_preview public.enum_seo_max_image_preview,
    seo_robots_advanced_max_video_preview numeric,
    seo_robots_advanced_unavailable_after timestamp(3) with time zone,
    seo_alternates jsonb,
    seo_custom_tags jsonb,
    seo_keyword_target character varying,
    seo_keywords jsonb,
    seo_additional_schema jsonb,
    seo_schema_history jsonb,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    _status public.enum_departments_status DEFAULT 'draft'::public.enum_departments_status
);



CREATE SEQUENCE IF NOT EXISTS public.departments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



ALTER SEQUENCE public.departments_id_seq OWNED BY public.departments.id;



CREATE TABLE IF NOT EXISTS public.departments_seo_speakable_path (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id character varying NOT NULL,
    selector character varying
);



CREATE TABLE IF NOT EXISTS public.industries (
    id integer NOT NULL,
    name character varying,
    slug character varying,
    description character varying,
    icon_id integer,
    parent_id integer,
    seo_title character varying,
    seo_description character varying,
    seo_indexable public.enum_industries_seo_indexable DEFAULT 'index'::public.enum_industries_seo_indexable,
    seo_og_image_id integer,
    seo_og_image_alt character varying,
    seo_use_advanced_og boolean DEFAULT false,
    seo_og_title character varying,
    seo_og_description character varying,
    seo_use_advanced_twitter boolean DEFAULT false,
    seo_twitter_card public.enum_industries_seo_twitter_card DEFAULT 'summary_large_image'::public.enum_industries_seo_twitter_card,
    seo_twitter_title character varying,
    seo_twitter_description character varying,
    seo_twitter_image_id integer,
    seo_use_custom_canonical boolean DEFAULT false,
    seo_canonical_override character varying,
    seo_robots_advanced_noarchive boolean DEFAULT false,
    seo_robots_advanced_nosnippet boolean DEFAULT false,
    seo_robots_advanced_noimageindex boolean DEFAULT false,
    seo_robots_advanced_notranslate boolean DEFAULT false,
    seo_robots_advanced_max_snippet numeric,
    seo_robots_advanced_max_image_preview public.enum_seo_max_image_preview,
    seo_robots_advanced_max_video_preview numeric,
    seo_robots_advanced_unavailable_after timestamp(3) with time zone,
    seo_alternates jsonb,
    seo_custom_tags jsonb,
    seo_keyword_target character varying,
    seo_keywords jsonb,
    seo_additional_schema jsonb,
    seo_schema_history jsonb,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    _status public.enum_industries_status DEFAULT 'draft'::public.enum_industries_status
);



CREATE SEQUENCE IF NOT EXISTS public.industries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



ALTER SEQUENCE public.industries_id_seq OWNED BY public.industries.id;



CREATE TABLE IF NOT EXISTS public.industries_seo_speakable_path (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id character varying NOT NULL,
    selector character varying
);



CREATE TABLE IF NOT EXISTS public.press_types (
    id integer NOT NULL,
    name character varying,
    slug character varying,
    description character varying,
    icon_id integer,
    parent_id integer,
    seo_title character varying,
    seo_description character varying,
    seo_indexable public.enum_press_types_seo_indexable DEFAULT 'index'::public.enum_press_types_seo_indexable,
    seo_og_image_id integer,
    seo_og_image_alt character varying,
    seo_use_advanced_og boolean DEFAULT false,
    seo_og_title character varying,
    seo_og_description character varying,
    seo_use_advanced_twitter boolean DEFAULT false,
    seo_twitter_card public.enum_press_types_seo_twitter_card DEFAULT 'summary_large_image'::public.enum_press_types_seo_twitter_card,
    seo_twitter_title character varying,
    seo_twitter_description character varying,
    seo_twitter_image_id integer,
    seo_use_custom_canonical boolean DEFAULT false,
    seo_canonical_override character varying,
    seo_robots_advanced_noarchive boolean DEFAULT false,
    seo_robots_advanced_nosnippet boolean DEFAULT false,
    seo_robots_advanced_noimageindex boolean DEFAULT false,
    seo_robots_advanced_notranslate boolean DEFAULT false,
    seo_robots_advanced_max_snippet numeric,
    seo_robots_advanced_max_image_preview public.enum_seo_max_image_preview,
    seo_robots_advanced_max_video_preview numeric,
    seo_robots_advanced_unavailable_after timestamp(3) with time zone,
    seo_alternates jsonb,
    seo_custom_tags jsonb,
    seo_keyword_target character varying,
    seo_keywords jsonb,
    seo_additional_schema jsonb,
    seo_schema_history jsonb,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    _status public.enum_press_types_status DEFAULT 'draft'::public.enum_press_types_status
);



CREATE SEQUENCE IF NOT EXISTS public.press_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



ALTER SEQUENCE public.press_types_id_seq OWNED BY public.press_types.id;



CREATE TABLE IF NOT EXISTS public.press_types_seo_speakable_path (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id character varying NOT NULL,
    selector character varying
);



CREATE TABLE IF NOT EXISTS public.regions (
    id integer NOT NULL,
    name character varying,
    slug character varying,
    description character varying,
    icon_id integer,
    parent_id integer,
    seo_title character varying,
    seo_description character varying,
    seo_indexable public.enum_regions_seo_indexable DEFAULT 'index'::public.enum_regions_seo_indexable,
    seo_og_image_id integer,
    seo_og_image_alt character varying,
    seo_use_advanced_og boolean DEFAULT false,
    seo_og_title character varying,
    seo_og_description character varying,
    seo_use_advanced_twitter boolean DEFAULT false,
    seo_twitter_card public.enum_regions_seo_twitter_card DEFAULT 'summary_large_image'::public.enum_regions_seo_twitter_card,
    seo_twitter_title character varying,
    seo_twitter_description character varying,
    seo_twitter_image_id integer,
    seo_use_custom_canonical boolean DEFAULT false,
    seo_canonical_override character varying,
    seo_robots_advanced_noarchive boolean DEFAULT false,
    seo_robots_advanced_nosnippet boolean DEFAULT false,
    seo_robots_advanced_noimageindex boolean DEFAULT false,
    seo_robots_advanced_notranslate boolean DEFAULT false,
    seo_robots_advanced_max_snippet numeric,
    seo_robots_advanced_max_image_preview public.enum_seo_max_image_preview,
    seo_robots_advanced_max_video_preview numeric,
    seo_robots_advanced_unavailable_after timestamp(3) with time zone,
    seo_alternates jsonb,
    seo_custom_tags jsonb,
    seo_keyword_target character varying,
    seo_keywords jsonb,
    seo_additional_schema jsonb,
    seo_schema_history jsonb,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    _status public.enum_regions_status DEFAULT 'draft'::public.enum_regions_status
);



CREATE SEQUENCE IF NOT EXISTS public.regions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



ALTER SEQUENCE public.regions_id_seq OWNED BY public.regions.id;



CREATE TABLE IF NOT EXISTS public.regions_seo_speakable_path (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id character varying NOT NULL,
    selector character varying
);



CREATE TABLE IF NOT EXISTS public.resource_types (
    id integer NOT NULL,
    name character varying,
    slug character varying,
    description character varying,
    icon_id integer,
    parent_id integer,
    seo_title character varying,
    seo_description character varying,
    seo_indexable public.enum_resource_types_seo_indexable DEFAULT 'index'::public.enum_resource_types_seo_indexable,
    seo_og_image_id integer,
    seo_og_image_alt character varying,
    seo_use_advanced_og boolean DEFAULT false,
    seo_og_title character varying,
    seo_og_description character varying,
    seo_use_advanced_twitter boolean DEFAULT false,
    seo_twitter_card public.enum_resource_types_seo_twitter_card DEFAULT 'summary_large_image'::public.enum_resource_types_seo_twitter_card,
    seo_twitter_title character varying,
    seo_twitter_description character varying,
    seo_twitter_image_id integer,
    seo_use_custom_canonical boolean DEFAULT false,
    seo_canonical_override character varying,
    seo_robots_advanced_noarchive boolean DEFAULT false,
    seo_robots_advanced_nosnippet boolean DEFAULT false,
    seo_robots_advanced_noimageindex boolean DEFAULT false,
    seo_robots_advanced_notranslate boolean DEFAULT false,
    seo_robots_advanced_max_snippet numeric,
    seo_robots_advanced_max_image_preview public.enum_seo_max_image_preview,
    seo_robots_advanced_max_video_preview numeric,
    seo_robots_advanced_unavailable_after timestamp(3) with time zone,
    seo_alternates jsonb,
    seo_custom_tags jsonb,
    seo_keyword_target character varying,
    seo_keywords jsonb,
    seo_additional_schema jsonb,
    seo_schema_history jsonb,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    _status public.enum_resource_types_status DEFAULT 'draft'::public.enum_resource_types_status
);



CREATE SEQUENCE IF NOT EXISTS public.resource_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



ALTER SEQUENCE public.resource_types_id_seq OWNED BY public.resource_types.id;



CREATE TABLE IF NOT EXISTS public.resource_types_seo_speakable_path (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id character varying NOT NULL,
    selector character varying
);



CREATE TABLE IF NOT EXISTS public.webinar_types (
    id integer NOT NULL,
    name character varying,
    slug character varying,
    description character varying,
    icon_id integer,
    parent_id integer,
    seo_title character varying,
    seo_description character varying,
    seo_indexable public.enum_webinar_types_seo_indexable DEFAULT 'index'::public.enum_webinar_types_seo_indexable,
    seo_og_image_id integer,
    seo_og_image_alt character varying,
    seo_use_advanced_og boolean DEFAULT false,
    seo_og_title character varying,
    seo_og_description character varying,
    seo_use_advanced_twitter boolean DEFAULT false,
    seo_twitter_card public.enum_webinar_types_seo_twitter_card DEFAULT 'summary_large_image'::public.enum_webinar_types_seo_twitter_card,
    seo_twitter_title character varying,
    seo_twitter_description character varying,
    seo_twitter_image_id integer,
    seo_use_custom_canonical boolean DEFAULT false,
    seo_canonical_override character varying,
    seo_robots_advanced_noarchive boolean DEFAULT false,
    seo_robots_advanced_nosnippet boolean DEFAULT false,
    seo_robots_advanced_noimageindex boolean DEFAULT false,
    seo_robots_advanced_notranslate boolean DEFAULT false,
    seo_robots_advanced_max_snippet numeric,
    seo_robots_advanced_max_image_preview public.enum_seo_max_image_preview,
    seo_robots_advanced_max_video_preview numeric,
    seo_robots_advanced_unavailable_after timestamp(3) with time zone,
    seo_alternates jsonb,
    seo_custom_tags jsonb,
    seo_keyword_target character varying,
    seo_keywords jsonb,
    seo_additional_schema jsonb,
    seo_schema_history jsonb,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    _status public.enum_webinar_types_status DEFAULT 'draft'::public.enum_webinar_types_status
);



CREATE SEQUENCE IF NOT EXISTS public.webinar_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



ALTER SEQUENCE public.webinar_types_id_seq OWNED BY public.webinar_types.id;



CREATE TABLE IF NOT EXISTS public.webinar_types_seo_speakable_path (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id character varying NOT NULL,
    selector character varying
);



ALTER TABLE ONLY public._departments_v ALTER COLUMN id SET DEFAULT nextval('public._departments_v_id_seq'::regclass);



ALTER TABLE ONLY public._departments_v_version_seo_speakable_path ALTER COLUMN id SET DEFAULT nextval('public._departments_v_version_seo_speakable_path_id_seq'::regclass);



ALTER TABLE ONLY public._industries_v ALTER COLUMN id SET DEFAULT nextval('public._industries_v_id_seq'::regclass);



ALTER TABLE ONLY public._industries_v_version_seo_speakable_path ALTER COLUMN id SET DEFAULT nextval('public._industries_v_version_seo_speakable_path_id_seq'::regclass);



ALTER TABLE ONLY public._press_types_v ALTER COLUMN id SET DEFAULT nextval('public._press_types_v_id_seq'::regclass);



ALTER TABLE ONLY public._press_types_v_version_seo_speakable_path ALTER COLUMN id SET DEFAULT nextval('public._press_types_v_version_seo_speakable_path_id_seq'::regclass);



ALTER TABLE ONLY public._regions_v ALTER COLUMN id SET DEFAULT nextval('public._regions_v_id_seq'::regclass);



ALTER TABLE ONLY public._regions_v_version_seo_speakable_path ALTER COLUMN id SET DEFAULT nextval('public._regions_v_version_seo_speakable_path_id_seq'::regclass);



ALTER TABLE ONLY public._resource_types_v ALTER COLUMN id SET DEFAULT nextval('public._resource_types_v_id_seq'::regclass);



ALTER TABLE ONLY public._resource_types_v_version_seo_speakable_path ALTER COLUMN id SET DEFAULT nextval('public._resource_types_v_version_seo_speakable_path_id_seq'::regclass);



ALTER TABLE ONLY public._webinar_types_v ALTER COLUMN id SET DEFAULT nextval('public._webinar_types_v_id_seq'::regclass);



ALTER TABLE ONLY public._webinar_types_v_version_seo_speakable_path ALTER COLUMN id SET DEFAULT nextval('public._webinar_types_v_version_seo_speakable_path_id_seq'::regclass);



ALTER TABLE ONLY public.departments ALTER COLUMN id SET DEFAULT nextval('public.departments_id_seq'::regclass);



ALTER TABLE ONLY public.industries ALTER COLUMN id SET DEFAULT nextval('public.industries_id_seq'::regclass);



ALTER TABLE ONLY public.press_types ALTER COLUMN id SET DEFAULT nextval('public.press_types_id_seq'::regclass);



ALTER TABLE ONLY public.regions ALTER COLUMN id SET DEFAULT nextval('public.regions_id_seq'::regclass);



ALTER TABLE ONLY public.resource_types ALTER COLUMN id SET DEFAULT nextval('public.resource_types_id_seq'::regclass);



ALTER TABLE ONLY public.webinar_types ALTER COLUMN id SET DEFAULT nextval('public.webinar_types_id_seq'::regclass);



DO $$ BEGIN
  ALTER TABLE ONLY public._departments_v
  ADD CONSTRAINT _departments_v_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public._departments_v_version_seo_speakable_path
  ADD CONSTRAINT _departments_v_version_seo_speakable_path_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public._industries_v
  ADD CONSTRAINT _industries_v_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public._industries_v_version_seo_speakable_path
  ADD CONSTRAINT _industries_v_version_seo_speakable_path_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public._press_types_v
  ADD CONSTRAINT _press_types_v_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public._press_types_v_version_seo_speakable_path
  ADD CONSTRAINT _press_types_v_version_seo_speakable_path_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public._regions_v
  ADD CONSTRAINT _regions_v_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public._regions_v_version_seo_speakable_path
  ADD CONSTRAINT _regions_v_version_seo_speakable_path_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public._resource_types_v
  ADD CONSTRAINT _resource_types_v_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public._resource_types_v_version_seo_speakable_path
  ADD CONSTRAINT _resource_types_v_version_seo_speakable_path_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public._webinar_types_v
  ADD CONSTRAINT _webinar_types_v_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public._webinar_types_v_version_seo_speakable_path
  ADD CONSTRAINT _webinar_types_v_version_seo_speakable_path_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public.departments
  ADD CONSTRAINT departments_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public.departments_seo_speakable_path
  ADD CONSTRAINT departments_seo_speakable_path_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public.industries
  ADD CONSTRAINT industries_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public.industries_seo_speakable_path
  ADD CONSTRAINT industries_seo_speakable_path_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public.press_types
  ADD CONSTRAINT press_types_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public.press_types_seo_speakable_path
  ADD CONSTRAINT press_types_seo_speakable_path_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public.regions
  ADD CONSTRAINT regions_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public.regions_seo_speakable_path
  ADD CONSTRAINT regions_seo_speakable_path_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public.resource_types
  ADD CONSTRAINT resource_types_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public.resource_types_seo_speakable_path
  ADD CONSTRAINT resource_types_seo_speakable_path_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public.webinar_types
  ADD CONSTRAINT webinar_types_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public.webinar_types_seo_speakable_path
  ADD CONSTRAINT webinar_types_seo_speakable_path_pkey PRIMARY KEY (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



CREATE INDEX IF NOT EXISTS _departments_v_created_at_idx ON public._departments_v USING btree (created_at);



CREATE INDEX IF NOT EXISTS _departments_v_latest_idx ON public._departments_v USING btree (latest);



CREATE INDEX IF NOT EXISTS _departments_v_parent_idx ON public._departments_v USING btree (parent_id);



CREATE INDEX IF NOT EXISTS _departments_v_updated_at_idx ON public._departments_v USING btree (updated_at);



CREATE INDEX IF NOT EXISTS _departments_v_version_seo_speakable_path_order_idx ON public._departments_v_version_seo_speakable_path USING btree (_order);



CREATE INDEX IF NOT EXISTS _departments_v_version_seo_speakable_path_parent_id_idx ON public._departments_v_version_seo_speakable_path USING btree (_parent_id);



CREATE INDEX IF NOT EXISTS _departments_v_version_seo_version_seo_og_image_idx ON public._departments_v USING btree (version_seo_og_image_id);



CREATE INDEX IF NOT EXISTS _departments_v_version_seo_version_seo_twitter_image_idx ON public._departments_v USING btree (version_seo_twitter_image_id);



CREATE INDEX IF NOT EXISTS _departments_v_version_version__status_idx ON public._departments_v USING btree (version__status);



CREATE INDEX IF NOT EXISTS _departments_v_version_version_created_at_idx ON public._departments_v USING btree (version_created_at);



CREATE INDEX IF NOT EXISTS _departments_v_version_version_icon_idx ON public._departments_v USING btree (version_icon_id);



CREATE INDEX IF NOT EXISTS _departments_v_version_version_parent_idx ON public._departments_v USING btree (version_parent_id);



CREATE INDEX IF NOT EXISTS _departments_v_version_version_slug_idx ON public._departments_v USING btree (version_slug);



CREATE INDEX IF NOT EXISTS _departments_v_version_version_updated_at_idx ON public._departments_v USING btree (version_updated_at);



CREATE INDEX IF NOT EXISTS _industries_v_created_at_idx ON public._industries_v USING btree (created_at);



CREATE INDEX IF NOT EXISTS _industries_v_latest_idx ON public._industries_v USING btree (latest);



CREATE INDEX IF NOT EXISTS _industries_v_parent_idx ON public._industries_v USING btree (parent_id);



CREATE INDEX IF NOT EXISTS _industries_v_updated_at_idx ON public._industries_v USING btree (updated_at);



CREATE INDEX IF NOT EXISTS _industries_v_version_seo_speakable_path_order_idx ON public._industries_v_version_seo_speakable_path USING btree (_order);



CREATE INDEX IF NOT EXISTS _industries_v_version_seo_speakable_path_parent_id_idx ON public._industries_v_version_seo_speakable_path USING btree (_parent_id);



CREATE INDEX IF NOT EXISTS _industries_v_version_seo_version_seo_og_image_idx ON public._industries_v USING btree (version_seo_og_image_id);



CREATE INDEX IF NOT EXISTS _industries_v_version_seo_version_seo_twitter_image_idx ON public._industries_v USING btree (version_seo_twitter_image_id);



CREATE INDEX IF NOT EXISTS _industries_v_version_version__status_idx ON public._industries_v USING btree (version__status);



CREATE INDEX IF NOT EXISTS _industries_v_version_version_created_at_idx ON public._industries_v USING btree (version_created_at);



CREATE INDEX IF NOT EXISTS _industries_v_version_version_icon_idx ON public._industries_v USING btree (version_icon_id);



CREATE INDEX IF NOT EXISTS _industries_v_version_version_parent_idx ON public._industries_v USING btree (version_parent_id);



CREATE INDEX IF NOT EXISTS _industries_v_version_version_slug_idx ON public._industries_v USING btree (version_slug);



CREATE INDEX IF NOT EXISTS _industries_v_version_version_updated_at_idx ON public._industries_v USING btree (version_updated_at);



CREATE INDEX IF NOT EXISTS _press_types_v_created_at_idx ON public._press_types_v USING btree (created_at);



CREATE INDEX IF NOT EXISTS _press_types_v_latest_idx ON public._press_types_v USING btree (latest);



CREATE INDEX IF NOT EXISTS _press_types_v_parent_idx ON public._press_types_v USING btree (parent_id);



CREATE INDEX IF NOT EXISTS _press_types_v_updated_at_idx ON public._press_types_v USING btree (updated_at);



CREATE INDEX IF NOT EXISTS _press_types_v_version_seo_speakable_path_order_idx ON public._press_types_v_version_seo_speakable_path USING btree (_order);



CREATE INDEX IF NOT EXISTS _press_types_v_version_seo_speakable_path_parent_id_idx ON public._press_types_v_version_seo_speakable_path USING btree (_parent_id);



CREATE INDEX IF NOT EXISTS _press_types_v_version_seo_version_seo_og_image_idx ON public._press_types_v USING btree (version_seo_og_image_id);



CREATE INDEX IF NOT EXISTS _press_types_v_version_seo_version_seo_twitter_image_idx ON public._press_types_v USING btree (version_seo_twitter_image_id);



CREATE INDEX IF NOT EXISTS _press_types_v_version_version__status_idx ON public._press_types_v USING btree (version__status);



CREATE INDEX IF NOT EXISTS _press_types_v_version_version_created_at_idx ON public._press_types_v USING btree (version_created_at);



CREATE INDEX IF NOT EXISTS _press_types_v_version_version_icon_idx ON public._press_types_v USING btree (version_icon_id);



CREATE INDEX IF NOT EXISTS _press_types_v_version_version_parent_idx ON public._press_types_v USING btree (version_parent_id);



CREATE INDEX IF NOT EXISTS _press_types_v_version_version_slug_idx ON public._press_types_v USING btree (version_slug);



CREATE INDEX IF NOT EXISTS _press_types_v_version_version_updated_at_idx ON public._press_types_v USING btree (version_updated_at);



CREATE INDEX IF NOT EXISTS _regions_v_created_at_idx ON public._regions_v USING btree (created_at);



CREATE INDEX IF NOT EXISTS _regions_v_latest_idx ON public._regions_v USING btree (latest);



CREATE INDEX IF NOT EXISTS _regions_v_parent_idx ON public._regions_v USING btree (parent_id);



CREATE INDEX IF NOT EXISTS _regions_v_updated_at_idx ON public._regions_v USING btree (updated_at);



CREATE INDEX IF NOT EXISTS _regions_v_version_seo_speakable_path_order_idx ON public._regions_v_version_seo_speakable_path USING btree (_order);



CREATE INDEX IF NOT EXISTS _regions_v_version_seo_speakable_path_parent_id_idx ON public._regions_v_version_seo_speakable_path USING btree (_parent_id);



CREATE INDEX IF NOT EXISTS _regions_v_version_seo_version_seo_og_image_idx ON public._regions_v USING btree (version_seo_og_image_id);



CREATE INDEX IF NOT EXISTS _regions_v_version_seo_version_seo_twitter_image_idx ON public._regions_v USING btree (version_seo_twitter_image_id);



CREATE INDEX IF NOT EXISTS _regions_v_version_version__status_idx ON public._regions_v USING btree (version__status);



CREATE INDEX IF NOT EXISTS _regions_v_version_version_created_at_idx ON public._regions_v USING btree (version_created_at);



CREATE INDEX IF NOT EXISTS _regions_v_version_version_icon_idx ON public._regions_v USING btree (version_icon_id);



CREATE INDEX IF NOT EXISTS _regions_v_version_version_parent_idx ON public._regions_v USING btree (version_parent_id);



CREATE INDEX IF NOT EXISTS _regions_v_version_version_slug_idx ON public._regions_v USING btree (version_slug);



CREATE INDEX IF NOT EXISTS _regions_v_version_version_updated_at_idx ON public._regions_v USING btree (version_updated_at);



CREATE INDEX IF NOT EXISTS _resource_types_v_created_at_idx ON public._resource_types_v USING btree (created_at);



CREATE INDEX IF NOT EXISTS _resource_types_v_latest_idx ON public._resource_types_v USING btree (latest);



CREATE INDEX IF NOT EXISTS _resource_types_v_parent_idx ON public._resource_types_v USING btree (parent_id);



CREATE INDEX IF NOT EXISTS _resource_types_v_updated_at_idx ON public._resource_types_v USING btree (updated_at);



CREATE INDEX IF NOT EXISTS _resource_types_v_version_seo_speakable_path_order_idx ON public._resource_types_v_version_seo_speakable_path USING btree (_order);



CREATE INDEX IF NOT EXISTS _resource_types_v_version_seo_speakable_path_parent_id_idx ON public._resource_types_v_version_seo_speakable_path USING btree (_parent_id);



CREATE INDEX IF NOT EXISTS _resource_types_v_version_seo_version_seo_og_image_idx ON public._resource_types_v USING btree (version_seo_og_image_id);



CREATE INDEX IF NOT EXISTS _resource_types_v_version_seo_version_seo_twitter_image_idx ON public._resource_types_v USING btree (version_seo_twitter_image_id);



CREATE INDEX IF NOT EXISTS _resource_types_v_version_version__status_idx ON public._resource_types_v USING btree (version__status);



CREATE INDEX IF NOT EXISTS _resource_types_v_version_version_created_at_idx ON public._resource_types_v USING btree (version_created_at);



CREATE INDEX IF NOT EXISTS _resource_types_v_version_version_icon_idx ON public._resource_types_v USING btree (version_icon_id);



CREATE INDEX IF NOT EXISTS _resource_types_v_version_version_parent_idx ON public._resource_types_v USING btree (version_parent_id);



CREATE INDEX IF NOT EXISTS _resource_types_v_version_version_slug_idx ON public._resource_types_v USING btree (version_slug);



CREATE INDEX IF NOT EXISTS _resource_types_v_version_version_updated_at_idx ON public._resource_types_v USING btree (version_updated_at);



CREATE INDEX IF NOT EXISTS _webinar_types_v_created_at_idx ON public._webinar_types_v USING btree (created_at);



CREATE INDEX IF NOT EXISTS _webinar_types_v_latest_idx ON public._webinar_types_v USING btree (latest);



CREATE INDEX IF NOT EXISTS _webinar_types_v_parent_idx ON public._webinar_types_v USING btree (parent_id);



CREATE INDEX IF NOT EXISTS _webinar_types_v_updated_at_idx ON public._webinar_types_v USING btree (updated_at);



CREATE INDEX IF NOT EXISTS _webinar_types_v_version_seo_speakable_path_order_idx ON public._webinar_types_v_version_seo_speakable_path USING btree (_order);



CREATE INDEX IF NOT EXISTS _webinar_types_v_version_seo_speakable_path_parent_id_idx ON public._webinar_types_v_version_seo_speakable_path USING btree (_parent_id);



CREATE INDEX IF NOT EXISTS _webinar_types_v_version_seo_version_seo_og_image_idx ON public._webinar_types_v USING btree (version_seo_og_image_id);



CREATE INDEX IF NOT EXISTS _webinar_types_v_version_seo_version_seo_twitter_image_idx ON public._webinar_types_v USING btree (version_seo_twitter_image_id);



CREATE INDEX IF NOT EXISTS _webinar_types_v_version_version__status_idx ON public._webinar_types_v USING btree (version__status);



CREATE INDEX IF NOT EXISTS _webinar_types_v_version_version_created_at_idx ON public._webinar_types_v USING btree (version_created_at);



CREATE INDEX IF NOT EXISTS _webinar_types_v_version_version_icon_idx ON public._webinar_types_v USING btree (version_icon_id);



CREATE INDEX IF NOT EXISTS _webinar_types_v_version_version_parent_idx ON public._webinar_types_v USING btree (version_parent_id);



CREATE INDEX IF NOT EXISTS _webinar_types_v_version_version_slug_idx ON public._webinar_types_v USING btree (version_slug);



CREATE INDEX IF NOT EXISTS _webinar_types_v_version_version_updated_at_idx ON public._webinar_types_v USING btree (version_updated_at);



CREATE INDEX IF NOT EXISTS departments__status_idx ON public.departments USING btree (_status);



CREATE INDEX IF NOT EXISTS departments_created_at_idx ON public.departments USING btree (created_at);



CREATE INDEX IF NOT EXISTS departments_icon_idx ON public.departments USING btree (icon_id);



CREATE INDEX IF NOT EXISTS departments_parent_idx ON public.departments USING btree (parent_id);



CREATE INDEX IF NOT EXISTS departments_seo_seo_og_image_idx ON public.departments USING btree (seo_og_image_id);



CREATE INDEX IF NOT EXISTS departments_seo_seo_twitter_image_idx ON public.departments USING btree (seo_twitter_image_id);



CREATE INDEX IF NOT EXISTS departments_seo_speakable_path_order_idx ON public.departments_seo_speakable_path USING btree (_order);



CREATE INDEX IF NOT EXISTS departments_seo_speakable_path_parent_id_idx ON public.departments_seo_speakable_path USING btree (_parent_id);



CREATE UNIQUE INDEX IF NOT EXISTS departments_slug_idx ON public.departments USING btree (slug);



CREATE INDEX IF NOT EXISTS departments_updated_at_idx ON public.departments USING btree (updated_at);



CREATE INDEX IF NOT EXISTS industries__status_idx ON public.industries USING btree (_status);



CREATE INDEX IF NOT EXISTS industries_created_at_idx ON public.industries USING btree (created_at);



CREATE INDEX IF NOT EXISTS industries_icon_idx ON public.industries USING btree (icon_id);



CREATE INDEX IF NOT EXISTS industries_parent_idx ON public.industries USING btree (parent_id);



CREATE INDEX IF NOT EXISTS industries_seo_seo_og_image_idx ON public.industries USING btree (seo_og_image_id);



CREATE INDEX IF NOT EXISTS industries_seo_seo_twitter_image_idx ON public.industries USING btree (seo_twitter_image_id);



CREATE INDEX IF NOT EXISTS industries_seo_speakable_path_order_idx ON public.industries_seo_speakable_path USING btree (_order);



CREATE INDEX IF NOT EXISTS industries_seo_speakable_path_parent_id_idx ON public.industries_seo_speakable_path USING btree (_parent_id);



CREATE UNIQUE INDEX IF NOT EXISTS industries_slug_idx ON public.industries USING btree (slug);



CREATE INDEX IF NOT EXISTS industries_updated_at_idx ON public.industries USING btree (updated_at);



CREATE INDEX IF NOT EXISTS press_types__status_idx ON public.press_types USING btree (_status);



CREATE INDEX IF NOT EXISTS press_types_created_at_idx ON public.press_types USING btree (created_at);



CREATE INDEX IF NOT EXISTS press_types_icon_idx ON public.press_types USING btree (icon_id);



CREATE INDEX IF NOT EXISTS press_types_parent_idx ON public.press_types USING btree (parent_id);



CREATE INDEX IF NOT EXISTS press_types_seo_seo_og_image_idx ON public.press_types USING btree (seo_og_image_id);



CREATE INDEX IF NOT EXISTS press_types_seo_seo_twitter_image_idx ON public.press_types USING btree (seo_twitter_image_id);



CREATE INDEX IF NOT EXISTS press_types_seo_speakable_path_order_idx ON public.press_types_seo_speakable_path USING btree (_order);



CREATE INDEX IF NOT EXISTS press_types_seo_speakable_path_parent_id_idx ON public.press_types_seo_speakable_path USING btree (_parent_id);



CREATE UNIQUE INDEX IF NOT EXISTS press_types_slug_idx ON public.press_types USING btree (slug);



CREATE INDEX IF NOT EXISTS press_types_updated_at_idx ON public.press_types USING btree (updated_at);



CREATE INDEX IF NOT EXISTS regions__status_idx ON public.regions USING btree (_status);



CREATE INDEX IF NOT EXISTS regions_created_at_idx ON public.regions USING btree (created_at);



CREATE INDEX IF NOT EXISTS regions_icon_idx ON public.regions USING btree (icon_id);



CREATE INDEX IF NOT EXISTS regions_parent_idx ON public.regions USING btree (parent_id);



CREATE INDEX IF NOT EXISTS regions_seo_seo_og_image_idx ON public.regions USING btree (seo_og_image_id);



CREATE INDEX IF NOT EXISTS regions_seo_seo_twitter_image_idx ON public.regions USING btree (seo_twitter_image_id);



CREATE INDEX IF NOT EXISTS regions_seo_speakable_path_order_idx ON public.regions_seo_speakable_path USING btree (_order);



CREATE INDEX IF NOT EXISTS regions_seo_speakable_path_parent_id_idx ON public.regions_seo_speakable_path USING btree (_parent_id);



CREATE UNIQUE INDEX IF NOT EXISTS regions_slug_idx ON public.regions USING btree (slug);



CREATE INDEX IF NOT EXISTS regions_updated_at_idx ON public.regions USING btree (updated_at);



CREATE INDEX IF NOT EXISTS resource_types__status_idx ON public.resource_types USING btree (_status);



CREATE INDEX IF NOT EXISTS resource_types_created_at_idx ON public.resource_types USING btree (created_at);



CREATE INDEX IF NOT EXISTS resource_types_icon_idx ON public.resource_types USING btree (icon_id);



CREATE INDEX IF NOT EXISTS resource_types_parent_idx ON public.resource_types USING btree (parent_id);



CREATE INDEX IF NOT EXISTS resource_types_seo_seo_og_image_idx ON public.resource_types USING btree (seo_og_image_id);



CREATE INDEX IF NOT EXISTS resource_types_seo_seo_twitter_image_idx ON public.resource_types USING btree (seo_twitter_image_id);



CREATE INDEX IF NOT EXISTS resource_types_seo_speakable_path_order_idx ON public.resource_types_seo_speakable_path USING btree (_order);



CREATE INDEX IF NOT EXISTS resource_types_seo_speakable_path_parent_id_idx ON public.resource_types_seo_speakable_path USING btree (_parent_id);



CREATE UNIQUE INDEX IF NOT EXISTS resource_types_slug_idx ON public.resource_types USING btree (slug);



CREATE INDEX IF NOT EXISTS resource_types_updated_at_idx ON public.resource_types USING btree (updated_at);



CREATE INDEX IF NOT EXISTS webinar_types__status_idx ON public.webinar_types USING btree (_status);



CREATE INDEX IF NOT EXISTS webinar_types_created_at_idx ON public.webinar_types USING btree (created_at);



CREATE INDEX IF NOT EXISTS webinar_types_icon_idx ON public.webinar_types USING btree (icon_id);



CREATE INDEX IF NOT EXISTS webinar_types_parent_idx ON public.webinar_types USING btree (parent_id);



CREATE INDEX IF NOT EXISTS webinar_types_seo_seo_og_image_idx ON public.webinar_types USING btree (seo_og_image_id);



CREATE INDEX IF NOT EXISTS webinar_types_seo_seo_twitter_image_idx ON public.webinar_types USING btree (seo_twitter_image_id);



CREATE INDEX IF NOT EXISTS webinar_types_seo_speakable_path_order_idx ON public.webinar_types_seo_speakable_path USING btree (_order);



CREATE INDEX IF NOT EXISTS webinar_types_seo_speakable_path_parent_id_idx ON public.webinar_types_seo_speakable_path USING btree (_parent_id);



CREATE UNIQUE INDEX IF NOT EXISTS webinar_types_slug_idx ON public.webinar_types USING btree (slug);



CREATE INDEX IF NOT EXISTS webinar_types_updated_at_idx ON public.webinar_types USING btree (updated_at);



DO $$ BEGIN
  ALTER TABLE ONLY public._departments_v
  ADD CONSTRAINT _departments_v_parent_id_departments_id_fk FOREIGN KEY (parent_id) REFERENCES public.departments(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public._departments_v
  ADD CONSTRAINT _departments_v_version_icon_id_media_id_fk FOREIGN KEY (version_icon_id) REFERENCES public.media(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public._departments_v
  ADD CONSTRAINT _departments_v_version_parent_id_departments_id_fk FOREIGN KEY (version_parent_id) REFERENCES public.departments(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public._departments_v
  ADD CONSTRAINT _departments_v_version_seo_og_image_id_media_id_fk FOREIGN KEY (version_seo_og_image_id) REFERENCES public.media(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public._departments_v_version_seo_speakable_path
  ADD CONSTRAINT _departments_v_version_seo_speakable_path_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public._departments_v(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public._departments_v
  ADD CONSTRAINT _departments_v_version_seo_twitter_image_id_media_id_fk FOREIGN KEY (version_seo_twitter_image_id) REFERENCES public.media(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public._industries_v
  ADD CONSTRAINT _industries_v_parent_id_industries_id_fk FOREIGN KEY (parent_id) REFERENCES public.industries(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public._industries_v
  ADD CONSTRAINT _industries_v_version_icon_id_media_id_fk FOREIGN KEY (version_icon_id) REFERENCES public.media(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public._industries_v
  ADD CONSTRAINT _industries_v_version_parent_id_industries_id_fk FOREIGN KEY (version_parent_id) REFERENCES public.industries(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public._industries_v
  ADD CONSTRAINT _industries_v_version_seo_og_image_id_media_id_fk FOREIGN KEY (version_seo_og_image_id) REFERENCES public.media(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public._industries_v_version_seo_speakable_path
  ADD CONSTRAINT _industries_v_version_seo_speakable_path_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public._industries_v(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public._industries_v
  ADD CONSTRAINT _industries_v_version_seo_twitter_image_id_media_id_fk FOREIGN KEY (version_seo_twitter_image_id) REFERENCES public.media(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public._press_types_v
  ADD CONSTRAINT _press_types_v_parent_id_press_types_id_fk FOREIGN KEY (parent_id) REFERENCES public.press_types(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public._press_types_v
  ADD CONSTRAINT _press_types_v_version_icon_id_media_id_fk FOREIGN KEY (version_icon_id) REFERENCES public.media(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public._press_types_v
  ADD CONSTRAINT _press_types_v_version_parent_id_press_types_id_fk FOREIGN KEY (version_parent_id) REFERENCES public.press_types(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public._press_types_v
  ADD CONSTRAINT _press_types_v_version_seo_og_image_id_media_id_fk FOREIGN KEY (version_seo_og_image_id) REFERENCES public.media(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public._press_types_v_version_seo_speakable_path
  ADD CONSTRAINT _press_types_v_version_seo_speakable_path_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public._press_types_v(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public._press_types_v
  ADD CONSTRAINT _press_types_v_version_seo_twitter_image_id_media_id_fk FOREIGN KEY (version_seo_twitter_image_id) REFERENCES public.media(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public._regions_v
  ADD CONSTRAINT _regions_v_parent_id_regions_id_fk FOREIGN KEY (parent_id) REFERENCES public.regions(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public._regions_v
  ADD CONSTRAINT _regions_v_version_icon_id_media_id_fk FOREIGN KEY (version_icon_id) REFERENCES public.media(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public._regions_v
  ADD CONSTRAINT _regions_v_version_parent_id_regions_id_fk FOREIGN KEY (version_parent_id) REFERENCES public.regions(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public._regions_v
  ADD CONSTRAINT _regions_v_version_seo_og_image_id_media_id_fk FOREIGN KEY (version_seo_og_image_id) REFERENCES public.media(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public._regions_v_version_seo_speakable_path
  ADD CONSTRAINT _regions_v_version_seo_speakable_path_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public._regions_v(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public._regions_v
  ADD CONSTRAINT _regions_v_version_seo_twitter_image_id_media_id_fk FOREIGN KEY (version_seo_twitter_image_id) REFERENCES public.media(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public._resource_types_v
  ADD CONSTRAINT _resource_types_v_parent_id_resource_types_id_fk FOREIGN KEY (parent_id) REFERENCES public.resource_types(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public._resource_types_v
  ADD CONSTRAINT _resource_types_v_version_icon_id_media_id_fk FOREIGN KEY (version_icon_id) REFERENCES public.media(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public._resource_types_v
  ADD CONSTRAINT _resource_types_v_version_parent_id_resource_types_id_fk FOREIGN KEY (version_parent_id) REFERENCES public.resource_types(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public._resource_types_v
  ADD CONSTRAINT _resource_types_v_version_seo_og_image_id_media_id_fk FOREIGN KEY (version_seo_og_image_id) REFERENCES public.media(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public._resource_types_v_version_seo_speakable_path
  ADD CONSTRAINT _resource_types_v_version_seo_speakable_path_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public._resource_types_v(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public._resource_types_v
  ADD CONSTRAINT _resource_types_v_version_seo_twitter_image_id_media_id_fk FOREIGN KEY (version_seo_twitter_image_id) REFERENCES public.media(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public._webinar_types_v
  ADD CONSTRAINT _webinar_types_v_parent_id_webinar_types_id_fk FOREIGN KEY (parent_id) REFERENCES public.webinar_types(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public._webinar_types_v
  ADD CONSTRAINT _webinar_types_v_version_icon_id_media_id_fk FOREIGN KEY (version_icon_id) REFERENCES public.media(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public._webinar_types_v
  ADD CONSTRAINT _webinar_types_v_version_parent_id_webinar_types_id_fk FOREIGN KEY (version_parent_id) REFERENCES public.webinar_types(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public._webinar_types_v
  ADD CONSTRAINT _webinar_types_v_version_seo_og_image_id_media_id_fk FOREIGN KEY (version_seo_og_image_id) REFERENCES public.media(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public._webinar_types_v_version_seo_speakable_path
  ADD CONSTRAINT _webinar_types_v_version_seo_speakable_path_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public._webinar_types_v(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public._webinar_types_v
  ADD CONSTRAINT _webinar_types_v_version_seo_twitter_image_id_media_id_fk FOREIGN KEY (version_seo_twitter_image_id) REFERENCES public.media(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public.departments
  ADD CONSTRAINT departments_icon_id_media_id_fk FOREIGN KEY (icon_id) REFERENCES public.media(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public.departments
  ADD CONSTRAINT departments_parent_id_departments_id_fk FOREIGN KEY (parent_id) REFERENCES public.departments(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public.departments
  ADD CONSTRAINT departments_seo_og_image_id_media_id_fk FOREIGN KEY (seo_og_image_id) REFERENCES public.media(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public.departments_seo_speakable_path
  ADD CONSTRAINT departments_seo_speakable_path_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.departments(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public.departments
  ADD CONSTRAINT departments_seo_twitter_image_id_media_id_fk FOREIGN KEY (seo_twitter_image_id) REFERENCES public.media(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public.industries
  ADD CONSTRAINT industries_icon_id_media_id_fk FOREIGN KEY (icon_id) REFERENCES public.media(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public.industries
  ADD CONSTRAINT industries_parent_id_industries_id_fk FOREIGN KEY (parent_id) REFERENCES public.industries(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public.industries
  ADD CONSTRAINT industries_seo_og_image_id_media_id_fk FOREIGN KEY (seo_og_image_id) REFERENCES public.media(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public.industries_seo_speakable_path
  ADD CONSTRAINT industries_seo_speakable_path_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.industries(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public.industries
  ADD CONSTRAINT industries_seo_twitter_image_id_media_id_fk FOREIGN KEY (seo_twitter_image_id) REFERENCES public.media(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public.press_types
  ADD CONSTRAINT press_types_icon_id_media_id_fk FOREIGN KEY (icon_id) REFERENCES public.media(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public.press_types
  ADD CONSTRAINT press_types_parent_id_press_types_id_fk FOREIGN KEY (parent_id) REFERENCES public.press_types(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public.press_types
  ADD CONSTRAINT press_types_seo_og_image_id_media_id_fk FOREIGN KEY (seo_og_image_id) REFERENCES public.media(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public.press_types_seo_speakable_path
  ADD CONSTRAINT press_types_seo_speakable_path_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.press_types(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public.press_types
  ADD CONSTRAINT press_types_seo_twitter_image_id_media_id_fk FOREIGN KEY (seo_twitter_image_id) REFERENCES public.media(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public.regions
  ADD CONSTRAINT regions_icon_id_media_id_fk FOREIGN KEY (icon_id) REFERENCES public.media(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public.regions
  ADD CONSTRAINT regions_parent_id_regions_id_fk FOREIGN KEY (parent_id) REFERENCES public.regions(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public.regions
  ADD CONSTRAINT regions_seo_og_image_id_media_id_fk FOREIGN KEY (seo_og_image_id) REFERENCES public.media(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public.regions_seo_speakable_path
  ADD CONSTRAINT regions_seo_speakable_path_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.regions(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public.regions
  ADD CONSTRAINT regions_seo_twitter_image_id_media_id_fk FOREIGN KEY (seo_twitter_image_id) REFERENCES public.media(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public.resource_types
  ADD CONSTRAINT resource_types_icon_id_media_id_fk FOREIGN KEY (icon_id) REFERENCES public.media(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public.resource_types
  ADD CONSTRAINT resource_types_parent_id_resource_types_id_fk FOREIGN KEY (parent_id) REFERENCES public.resource_types(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public.resource_types
  ADD CONSTRAINT resource_types_seo_og_image_id_media_id_fk FOREIGN KEY (seo_og_image_id) REFERENCES public.media(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public.resource_types_seo_speakable_path
  ADD CONSTRAINT resource_types_seo_speakable_path_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.resource_types(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public.resource_types
  ADD CONSTRAINT resource_types_seo_twitter_image_id_media_id_fk FOREIGN KEY (seo_twitter_image_id) REFERENCES public.media(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public.webinar_types
  ADD CONSTRAINT webinar_types_icon_id_media_id_fk FOREIGN KEY (icon_id) REFERENCES public.media(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public.webinar_types
  ADD CONSTRAINT webinar_types_parent_id_webinar_types_id_fk FOREIGN KEY (parent_id) REFERENCES public.webinar_types(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public.webinar_types
  ADD CONSTRAINT webinar_types_seo_og_image_id_media_id_fk FOREIGN KEY (seo_og_image_id) REFERENCES public.media(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public.webinar_types_seo_speakable_path
  ADD CONSTRAINT webinar_types_seo_speakable_path_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.webinar_types(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;



DO $$ BEGIN
  ALTER TABLE ONLY public.webinar_types
  ADD CONSTRAINT webinar_types_seo_twitter_image_id_media_id_fk FOREIGN KEY (seo_twitter_image_id) REFERENCES public.media(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. ...Ref relationship columns on the 5 content collections (+ _v tables)
  ALTER TABLE public."case_studies" ADD COLUMN IF NOT EXISTS "industry_ref_id" integer;
  ALTER TABLE public."jobs" ADD COLUMN IF NOT EXISTS "department_ref_id" integer;
  ALTER TABLE public."news" ADD COLUMN IF NOT EXISTS "press_type_ref_id" integer;
  ALTER TABLE public."news" ADD COLUMN IF NOT EXISTS "region_ref_id" integer;
  ALTER TABLE public."resources" ADD COLUMN IF NOT EXISTS "type_ref_id" integer;
  ALTER TABLE public."webinars" ADD COLUMN IF NOT EXISTS "region_ref_id" integer;
  ALTER TABLE public."webinars" ADD COLUMN IF NOT EXISTS "webinar_type_ref_id" integer;
  ALTER TABLE public."_case_studies_v" ADD COLUMN IF NOT EXISTS "version_industry_ref_id" integer;
  ALTER TABLE public."_jobs_v" ADD COLUMN IF NOT EXISTS "version_department_ref_id" integer;
  ALTER TABLE public."_news_v" ADD COLUMN IF NOT EXISTS "version_press_type_ref_id" integer;
  ALTER TABLE public."_news_v" ADD COLUMN IF NOT EXISTS "version_region_ref_id" integer;
  ALTER TABLE public."_resources_v" ADD COLUMN IF NOT EXISTS "version_type_ref_id" integer;
  ALTER TABLE public."_webinars_v" ADD COLUMN IF NOT EXISTS "version_region_ref_id" integer;
  ALTER TABLE public."_webinars_v" ADD COLUMN IF NOT EXISTS "version_webinar_type_ref_id" integer;

DO $$ BEGIN
  ALTER TABLE public."_case_studies_v" ADD CONSTRAINT "_case_studies_v_version_industry_ref_id_industries_id_fk" FOREIGN KEY (version_industry_ref_id) REFERENCES industries(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public."_jobs_v" ADD CONSTRAINT "_jobs_v_version_department_ref_id_departments_id_fk" FOREIGN KEY (version_department_ref_id) REFERENCES departments(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public."_news_v" ADD CONSTRAINT "_news_v_version_press_type_ref_id_press_types_id_fk" FOREIGN KEY (version_press_type_ref_id) REFERENCES press_types(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public."_news_v" ADD CONSTRAINT "_news_v_version_region_ref_id_regions_id_fk" FOREIGN KEY (version_region_ref_id) REFERENCES regions(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public."_resources_v" ADD CONSTRAINT "_resources_v_version_type_ref_id_resource_types_id_fk" FOREIGN KEY (version_type_ref_id) REFERENCES resource_types(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public."_webinars_v" ADD CONSTRAINT "_webinars_v_version_webinar_type_ref_id_webinar_types_id_fk" FOREIGN KEY (version_webinar_type_ref_id) REFERENCES webinar_types(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public."_webinars_v" ADD CONSTRAINT "_webinars_v_version_region_ref_id_regions_id_fk" FOREIGN KEY (version_region_ref_id) REFERENCES regions(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public."case_studies" ADD CONSTRAINT "case_studies_industry_ref_id_industries_id_fk" FOREIGN KEY (industry_ref_id) REFERENCES industries(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public."jobs" ADD CONSTRAINT "jobs_department_ref_id_departments_id_fk" FOREIGN KEY (department_ref_id) REFERENCES departments(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public."news" ADD CONSTRAINT "news_press_type_ref_id_press_types_id_fk" FOREIGN KEY (press_type_ref_id) REFERENCES press_types(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public."news" ADD CONSTRAINT "news_region_ref_id_regions_id_fk" FOREIGN KEY (region_ref_id) REFERENCES regions(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public."resources" ADD CONSTRAINT "resources_type_ref_id_resource_types_id_fk" FOREIGN KEY (type_ref_id) REFERENCES resource_types(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public."webinars" ADD CONSTRAINT "webinars_region_ref_id_regions_id_fk" FOREIGN KEY (region_ref_id) REFERENCES regions(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public."webinars" ADD CONSTRAINT "webinars_webinar_type_ref_id_webinar_types_id_fk" FOREIGN KEY (webinar_type_ref_id) REFERENCES webinar_types(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS _case_studies_v_version_version_industry_ref_idx ON public._case_studies_v USING btree (version_industry_ref_id);
CREATE INDEX IF NOT EXISTS _jobs_v_version_version_department_ref_idx ON public._jobs_v USING btree (version_department_ref_id);
CREATE INDEX IF NOT EXISTS _news_v_version_version_press_type_ref_idx ON public._news_v USING btree (version_press_type_ref_id);
CREATE INDEX IF NOT EXISTS _news_v_version_version_region_ref_idx ON public._news_v USING btree (version_region_ref_id);
CREATE INDEX IF NOT EXISTS _resources_v_version_version_type_ref_idx ON public._resources_v USING btree (version_type_ref_id);
CREATE INDEX IF NOT EXISTS _webinars_v_version_version_webinar_type_ref_idx ON public._webinars_v USING btree (version_webinar_type_ref_id);
CREATE INDEX IF NOT EXISTS _webinars_v_version_version_region_ref_idx ON public._webinars_v USING btree (version_region_ref_id);
CREATE INDEX IF NOT EXISTS case_studies_industry_ref_idx ON public.case_studies USING btree (industry_ref_id);
CREATE INDEX IF NOT EXISTS jobs_department_ref_idx ON public.jobs USING btree (department_ref_id);
CREATE INDEX IF NOT EXISTS news_region_ref_idx ON public.news USING btree (region_ref_id);
CREATE INDEX IF NOT EXISTS news_press_type_ref_idx ON public.news USING btree (press_type_ref_id);
CREATE INDEX IF NOT EXISTS resources_type_ref_idx ON public.resources USING btree (type_ref_id);
CREATE INDEX IF NOT EXISTS webinars_webinar_type_ref_idx ON public.webinars USING btree (webinar_type_ref_id);
CREATE INDEX IF NOT EXISTS webinars_region_ref_idx ON public.webinars USING btree (region_ref_id);
`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
-- Reverse: drop ref columns (auto-drops their FK+index), taxonomy tables, enums.
  ALTER TABLE public."case_studies" DROP COLUMN IF EXISTS "industry_ref_id";
  ALTER TABLE public."jobs" DROP COLUMN IF EXISTS "department_ref_id";
  ALTER TABLE public."news" DROP COLUMN IF EXISTS "press_type_ref_id";
  ALTER TABLE public."news" DROP COLUMN IF EXISTS "region_ref_id";
  ALTER TABLE public."resources" DROP COLUMN IF EXISTS "type_ref_id";
  ALTER TABLE public."webinars" DROP COLUMN IF EXISTS "region_ref_id";
  ALTER TABLE public."webinars" DROP COLUMN IF EXISTS "webinar_type_ref_id";
  ALTER TABLE public."_case_studies_v" DROP COLUMN IF EXISTS "version_industry_ref_id";
  ALTER TABLE public."_jobs_v" DROP COLUMN IF EXISTS "version_department_ref_id";
  ALTER TABLE public."_news_v" DROP COLUMN IF EXISTS "version_press_type_ref_id";
  ALTER TABLE public."_news_v" DROP COLUMN IF EXISTS "version_region_ref_id";
  ALTER TABLE public."_resources_v" DROP COLUMN IF EXISTS "version_type_ref_id";
  ALTER TABLE public."_webinars_v" DROP COLUMN IF EXISTS "version_region_ref_id";
  ALTER TABLE public."_webinars_v" DROP COLUMN IF EXISTS "version_webinar_type_ref_id";

  DROP TABLE IF EXISTS public."departments" CASCADE;
  DROP TABLE IF EXISTS public."_departments_v" CASCADE;
  DROP TABLE IF EXISTS public."departments_seo_speakable_path" CASCADE;
  DROP TABLE IF EXISTS public."_departments_v_version_seo_speakable_path" CASCADE;
  DROP TABLE IF EXISTS public."industries" CASCADE;
  DROP TABLE IF EXISTS public."_industries_v" CASCADE;
  DROP TABLE IF EXISTS public."industries_seo_speakable_path" CASCADE;
  DROP TABLE IF EXISTS public."_industries_v_version_seo_speakable_path" CASCADE;
  DROP TABLE IF EXISTS public."press_types" CASCADE;
  DROP TABLE IF EXISTS public."_press_types_v" CASCADE;
  DROP TABLE IF EXISTS public."press_types_seo_speakable_path" CASCADE;
  DROP TABLE IF EXISTS public."_press_types_v_version_seo_speakable_path" CASCADE;
  DROP TABLE IF EXISTS public."regions" CASCADE;
  DROP TABLE IF EXISTS public."_regions_v" CASCADE;
  DROP TABLE IF EXISTS public."regions_seo_speakable_path" CASCADE;
  DROP TABLE IF EXISTS public."_regions_v_version_seo_speakable_path" CASCADE;
  DROP TABLE IF EXISTS public."resource_types" CASCADE;
  DROP TABLE IF EXISTS public."_resource_types_v" CASCADE;
  DROP TABLE IF EXISTS public."resource_types_seo_speakable_path" CASCADE;
  DROP TABLE IF EXISTS public."_resource_types_v_version_seo_speakable_path" CASCADE;
  DROP TABLE IF EXISTS public."webinar_types" CASCADE;
  DROP TABLE IF EXISTS public."_webinar_types_v" CASCADE;
  DROP TABLE IF EXISTS public."webinar_types_seo_speakable_path" CASCADE;
  DROP TABLE IF EXISTS public."_webinar_types_v_version_seo_speakable_path" CASCADE;

  DROP TYPE IF EXISTS public."enum__departments_v_version_seo_indexable";
  DROP TYPE IF EXISTS public."enum__departments_v_version_seo_twitter_card";
  DROP TYPE IF EXISTS public."enum__departments_v_version_status";
  DROP TYPE IF EXISTS public."enum__industries_v_version_seo_indexable";
  DROP TYPE IF EXISTS public."enum__industries_v_version_seo_twitter_card";
  DROP TYPE IF EXISTS public."enum__industries_v_version_status";
  DROP TYPE IF EXISTS public."enum__press_types_v_version_seo_indexable";
  DROP TYPE IF EXISTS public."enum__press_types_v_version_seo_twitter_card";
  DROP TYPE IF EXISTS public."enum__press_types_v_version_status";
  DROP TYPE IF EXISTS public."enum__regions_v_version_seo_indexable";
  DROP TYPE IF EXISTS public."enum__regions_v_version_seo_twitter_card";
  DROP TYPE IF EXISTS public."enum__regions_v_version_status";
  DROP TYPE IF EXISTS public."enum__resource_types_v_version_seo_indexable";
  DROP TYPE IF EXISTS public."enum__resource_types_v_version_seo_twitter_card";
  DROP TYPE IF EXISTS public."enum__resource_types_v_version_status";
  DROP TYPE IF EXISTS public."enum__webinar_types_v_version_seo_indexable";
  DROP TYPE IF EXISTS public."enum__webinar_types_v_version_seo_twitter_card";
  DROP TYPE IF EXISTS public."enum__webinar_types_v_version_status";
  DROP TYPE IF EXISTS public."enum_departments_seo_indexable";
  DROP TYPE IF EXISTS public."enum_departments_seo_twitter_card";
  DROP TYPE IF EXISTS public."enum_departments_status";
  DROP TYPE IF EXISTS public."enum_industries_seo_indexable";
  DROP TYPE IF EXISTS public."enum_industries_seo_twitter_card";
  DROP TYPE IF EXISTS public."enum_industries_status";
  DROP TYPE IF EXISTS public."enum_press_types_seo_indexable";
  DROP TYPE IF EXISTS public."enum_press_types_seo_twitter_card";
  DROP TYPE IF EXISTS public."enum_press_types_status";
  DROP TYPE IF EXISTS public."enum_regions_seo_indexable";
  DROP TYPE IF EXISTS public."enum_regions_seo_twitter_card";
  DROP TYPE IF EXISTS public."enum_regions_status";
  DROP TYPE IF EXISTS public."enum_resource_types_seo_indexable";
  DROP TYPE IF EXISTS public."enum_resource_types_seo_twitter_card";
  DROP TYPE IF EXISTS public."enum_resource_types_status";
  DROP TYPE IF EXISTS public."enum_webinar_types_seo_indexable";
  DROP TYPE IF EXISTS public."enum_webinar_types_seo_twitter_card";
  DROP TYPE IF EXISTS public."enum_webinar_types_status";
`)
}
