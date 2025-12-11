


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."auto_draft_on_author_edit"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  editor_role TEXT;
  post_author_id UUID;
BEGIN
  -- Get the editor's role
  SELECT role INTO editor_role
  FROM profiles
  WHERE id = (select auth.uid());

  -- Get the post's author
  SELECT author_id INTO post_author_id
  FROM posts
  WHERE id = NEW.id;

  -- If the post was published AND the editor is NOT a SUPER_ADMIN AND the editor is the author
  IF OLD.status = 'published' 
     AND editor_role != 'SUPER_ADMIN' 
     AND (select auth.uid()) = post_author_id THEN
    
    -- Force status to 'draft'
    NEW.status := 'draft';
    
    -- Log the change (optional)
    RAISE NOTICE 'Post % automatically changed to draft because author edited it', NEW.id;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."auto_draft_on_author_edit"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."auto_draft_on_author_edit"() IS 'Automatically changes post status to draft when a non-SUPER_ADMIN author edits a published post. This ensures editorial review.';



CREATE OR REPLACE FUNCTION "public"."auto_generate_category_slug"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- If slug is empty or null, generate it
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_category_slug(NEW.name, NEW.language);
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."auto_generate_category_slug"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_category_slug"("category_name" "text", "lang" "text") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $_$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Convert to lowercase and replace spaces with hyphens
  base_slug := lower(trim(category_name));
  
  -- Georgian to English transliteration (basic)
  base_slug := replace(base_slug, 'ა', 'a');
  base_slug := replace(base_slug, 'ბ', 'b');
  base_slug := replace(base_slug, 'გ', 'g');
  base_slug := replace(base_slug, 'დ', 'd');
  base_slug := replace(base_slug, 'ე', 'e');
  base_slug := replace(base_slug, 'ვ', 'v');
  base_slug := replace(base_slug, 'ზ', 'z');
  base_slug := replace(base_slug, 'თ', 't');
  base_slug := replace(base_slug, 'ი', 'i');
  base_slug := replace(base_slug, 'კ', 'k');
  base_slug := replace(base_slug, 'ლ', 'l');
  base_slug := replace(base_slug, 'მ', 'm');
  base_slug := replace(base_slug, 'ნ', 'n');
  base_slug := replace(base_slug, 'ო', 'o');
  base_slug := replace(base_slug, 'პ', 'p');
  base_slug := replace(base_slug, 'ჟ', 'zh');
  base_slug := replace(base_slug, 'რ', 'r');
  base_slug := replace(base_slug, 'ს', 's');
  base_slug := replace(base_slug, 'ტ', 't');
  base_slug := replace(base_slug, 'უ', 'u');
  base_slug := replace(base_slug, 'ფ', 'p');
  base_slug := replace(base_slug, 'ქ', 'k');
  base_slug := replace(base_slug, 'ღ', 'gh');
  base_slug := replace(base_slug, 'ყ', 'q');
  base_slug := replace(base_slug, 'შ', 'sh');
  base_slug := replace(base_slug, 'ჩ', 'ch');
  base_slug := replace(base_slug, 'ც', 'ts');
  base_slug := replace(base_slug, 'ძ', 'dz');
  base_slug := replace(base_slug, 'წ', 'ts');
  base_slug := replace(base_slug, 'ჭ', 'ch');
  base_slug := replace(base_slug, 'ხ', 'kh');
  base_slug := replace(base_slug, 'ჯ', 'j');
  base_slug := replace(base_slug, 'ჰ', 'h');
  
  -- Replace spaces and special characters with hyphens
  base_slug := regexp_replace(base_slug, '[^a-z0-9]+', '-', 'g');
  
  -- Remove leading/trailing hyphens
  base_slug := regexp_replace(base_slug, '^-+|-+$', '', 'g');
  
  -- Ensure uniqueness
  final_slug := base_slug;
  WHILE EXISTS (
    SELECT 1 FROM post_category_translations 
    WHERE slug = final_slug AND language = lang
  ) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$_$;


ALTER FUNCTION "public"."generate_category_slug"("category_name" "text", "lang" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_message_read_stats"("p_message_id" "uuid") RETURNS TABLE("user_id" "uuid", "full_name" "text", "email" "text", "role" "text", "read_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id AS user_id,
    p.full_name,
    p.email,
    p.role,
    urm.read_at
  FROM public.user_read_messages urm
  INNER JOIN public.profiles p ON p.id = urm.user_id
  WHERE urm.message_id = p_message_id
  ORDER BY urm.read_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_message_read_stats"("p_message_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_message_read_stats"("p_message_id" "uuid") IS 'Returns list of users who have read a specific message with their details';



CREATE OR REPLACE FUNCTION "public"."get_message_target_count"("p_message_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Count all users whose role matches the target roles of this message
  SELECT COUNT(DISTINCT p.id) INTO v_count
  FROM public.profiles p
  INNER JOIN public.message_target_roles mtr ON mtr.target_role = p.role
  WHERE mtr.message_id = p_message_id;
  
  RETURN COALESCE(v_count, 0);
END;
$$;


ALTER FUNCTION "public"."get_message_target_count"("p_message_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_message_target_count"("p_message_id" "uuid") IS 'Returns total count of users who should receive this message based on their role';



CREATE OR REPLACE FUNCTION "public"."get_messages_for_user"("p_user_id" "uuid", "p_locale" "text" DEFAULT 'ka'::"text", "p_include_read" boolean DEFAULT true) RETURNS TABLE("message_id" "uuid", "title" "text", "content" "text", "priority" "text", "created_at" timestamp with time zone, "is_read" boolean, "read_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_user_role TEXT;
BEGIN
  -- აიღე მომხმარებლის როლი
  SELECT role INTO v_user_role
  FROM public.profiles
  WHERE profiles.id = p_user_id;
  
  RETURN QUERY
  SELECT 
    gm.id AS message_id,
    CASE p_locale
      WHEN 'en' THEN gm.title_en
      WHEN 'ru' THEN gm.title_ru
      ELSE gm.title_ka
    END AS title,
    CASE p_locale
      WHEN 'en' THEN gm.content_en
      WHEN 'ru' THEN gm.content_ru
      ELSE gm.content_ka
    END AS content,
    gm.priority,
    gm.created_at,
    (urm.user_id IS NOT NULL) AS is_read,
    urm.read_at
  FROM public.global_messages gm
  INNER JOIN public.message_target_roles mtr ON mtr.message_id = gm.id
  LEFT JOIN public.user_read_messages urm ON urm.message_id = gm.id AND urm.user_id = p_user_id
  WHERE gm.is_active = true
    AND (gm.expires_at IS NULL OR gm.expires_at > NOW())
    AND mtr.target_role = v_user_role
    AND (p_include_read = true OR urm.user_id IS NULL)
  ORDER BY 
    CASE gm.priority
      WHEN 'urgent' THEN 1
      WHEN 'high' THEN 2
      WHEN 'normal' THEN 3
      WHEN 'low' THEN 4
    END,
    gm.created_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_messages_for_user"("p_user_id" "uuid", "p_locale" "text", "p_include_read" boolean) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_messages_for_user"("p_user_id" "uuid", "p_locale" "text", "p_include_read" boolean) IS 'Returns all messages for a user in specified locale, optionally filtered by read status';



CREATE OR REPLACE FUNCTION "public"."get_unread_messages_count"("p_user_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_count INTEGER;
  v_user_role TEXT;
BEGIN
  -- აიღე მომხმარებლის როლი
  SELECT role INTO v_user_role
  FROM public.profiles
  WHERE id = p_user_id;
  
  -- თუ მომხმარებელი არ არსებობს
  IF v_user_role IS NULL THEN
    RETURN 0;
  END IF;
  
  -- დაითვალე წაუკითხავი შეტყობინებები
  SELECT COUNT(DISTINCT gm.id) INTO v_count
  FROM public.global_messages gm
  INNER JOIN public.message_target_roles mtr ON mtr.message_id = gm.id
  LEFT JOIN public.user_read_messages urm ON urm.message_id = gm.id AND urm.user_id = p_user_id
  WHERE gm.is_active = true
    AND (gm.expires_at IS NULL OR gm.expires_at > NOW())
    AND mtr.target_role = v_user_role
    AND urm.user_id IS NULL; -- არ არის წაკითხული
  
  RETURN COALESCE(v_count, 0);
END;
$$;


ALTER FUNCTION "public"."get_unread_messages_count"("p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_unread_messages_count"("p_user_id" "uuid") IS 'Returns count of unread messages for a user based on their role';



CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."handle_new_user"() IS 'Automatically creates a profile with role USER when a new user signs up via email or OAuth';



CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_message_as_read"("p_user_id" "uuid", "p_message_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_user_role TEXT;
  v_is_valid BOOLEAN;
BEGIN
  -- აიღე მომხმარებლის როლი
  SELECT role INTO v_user_role
  FROM public.profiles
  WHERE id = p_user_id;
  
  -- შეამოწმე რომ შეტყობინება ნამდვილად ამ როლისთვისაა
  SELECT EXISTS (
    SELECT 1 FROM public.global_messages gm
    INNER JOIN public.message_target_roles mtr ON mtr.message_id = gm.id
    WHERE gm.id = p_message_id
      AND mtr.target_role = v_user_role
      AND gm.is_active = true
      AND (gm.expires_at IS NULL OR gm.expires_at > NOW())
  ) INTO v_is_valid;
  
  -- თუ არავალიდურია, არ შეინახო
  IF NOT v_is_valid THEN
    RAISE EXCEPTION 'Message not valid for this user role';
  END IF;
  
  -- დაამატე ან განაახლე read status
  INSERT INTO public.user_read_messages (user_id, message_id, read_at)
  VALUES (p_user_id, p_message_id, NOW())
  ON CONFLICT (user_id, message_id) DO UPDATE
    SET read_at = NOW();
END;
$$;


ALTER FUNCTION "public"."mark_message_as_read"("p_user_id" "uuid", "p_message_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."mark_message_as_read"("p_user_id" "uuid", "p_message_id" "uuid") IS 'Marks a message as read for a specific user';



CREATE OR REPLACE FUNCTION "public"."update_legal_pages_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_legal_pages_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_news_banners_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_news_banners_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_specialist_translations_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_specialist_translations_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."access_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "request_type" "text" NOT NULL,
    "full_name" "text" NOT NULL,
    "company_slug" "text",
    "phone_number" "text" NOT NULL,
    "about" "text" NOT NULL,
    "status" "text" DEFAULT 'PENDING'::"text" NOT NULL,
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "rejection_reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "company_id" "uuid",
    CONSTRAINT "access_requests_request_type_check" CHECK (("request_type" = ANY (ARRAY['SPECIALIST'::"text", 'COMPANY'::"text", 'SOLO_SPECIALIST'::"text"]))),
    CONSTRAINT "access_requests_status_check" CHECK (("status" = ANY (ARRAY['PENDING'::"text", 'APPROVED'::"text", 'REJECTED'::"text"])))
);


ALTER TABLE "public"."access_requests" OWNER TO "postgres";


COMMENT ON TABLE "public"."access_requests" IS 'Stores access requests from users wanting to become specialists or companies';



COMMENT ON COLUMN "public"."access_requests"."request_type" IS 'Type of access request: SPECIALIST (joining company), COMPANY (company registration), or SOLO_SPECIALIST (independent specialist)';



COMMENT ON COLUMN "public"."access_requests"."company_id" IS 'Company that specialist wants to join (null for solo specialists or company registrations)';



CREATE TABLE IF NOT EXISTS "public"."post_translations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_id" "uuid" NOT NULL,
    "language" "text" NOT NULL,
    "title" "text" NOT NULL,
    "excerpt" "text",
    "content" "text",
    "category" "text",
    "slug" "text" NOT NULL,
    "meta_title" "text",
    "meta_description" "text",
    "keywords" "text",
    "og_title" "text",
    "og_description" "text",
    "og_image" "text",
    "word_count" integer DEFAULT 0,
    "reading_time" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "category_id" "uuid",
    "category_slug" "text",
    "social_hashtags" "text",
    CONSTRAINT "post_translations_language_check" CHECK (("language" = ANY (ARRAY['ka'::"text", 'en'::"text", 'ru'::"text"])))
);


ALTER TABLE "public"."post_translations" OWNER TO "postgres";


COMMENT ON TABLE "public"."post_translations" IS 'Translations for posts - 3 rows per post (ka, en, ru)';



COMMENT ON COLUMN "public"."post_translations"."post_id" IS 'Foreign key to posts table';



COMMENT ON COLUMN "public"."post_translations"."language" IS 'Language code: ka (Georgian), en (English), ru (Russian)';



COMMENT ON COLUMN "public"."post_translations"."title" IS 'Post title in this language';



COMMENT ON COLUMN "public"."post_translations"."excerpt" IS 'Short description/summary (for cards and previews)';



COMMENT ON COLUMN "public"."post_translations"."content" IS 'Full HTML content from RichTextEditor (Tiptap)';



COMMENT ON COLUMN "public"."post_translations"."category" IS 'Legacy text category (will be deprecated after migration)';



COMMENT ON COLUMN "public"."post_translations"."slug" IS 'URL-friendly slug - unique per language (e.g., /blog/my-post-slug)';



COMMENT ON COLUMN "public"."post_translations"."meta_title" IS 'SEO meta title for search engines';



COMMENT ON COLUMN "public"."post_translations"."meta_description" IS 'SEO meta description for search engines';



COMMENT ON COLUMN "public"."post_translations"."keywords" IS 'Comma-separated keywords for SEO';



COMMENT ON COLUMN "public"."post_translations"."og_title" IS 'Open Graph title (Facebook, Twitter, LinkedIn, etc.)';



COMMENT ON COLUMN "public"."post_translations"."og_description" IS 'Open Graph description for social media sharing';



COMMENT ON COLUMN "public"."post_translations"."og_image" IS 'Open Graph image URL for social media previews';



COMMENT ON COLUMN "public"."post_translations"."word_count" IS 'Number of words in content (for reading stats)';



COMMENT ON COLUMN "public"."post_translations"."reading_time" IS 'Estimated reading time in minutes (Georgian: 180 WPM, English: 200 WPM, Russian: 190 WPM)';



COMMENT ON COLUMN "public"."post_translations"."category_id" IS 'Foreign key to post_categories table (recommended way)';



COMMENT ON COLUMN "public"."post_translations"."category_slug" IS 'Denormalized category slug for quick lookups without JOIN';



COMMENT ON COLUMN "public"."post_translations"."social_hashtags" IS 'Social media hashtags for this language';



CREATE TABLE IF NOT EXISTS "public"."posts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "author_id" "uuid",
    "practice_id" "uuid",
    "display_position" integer,
    "position_order" integer DEFAULT 0,
    "status" "text" DEFAULT 'draft'::"text",
    "featured_image_url" "text",
    "published_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "category_id" "uuid",
    CONSTRAINT "posts_display_position_check" CHECK ((("display_position" >= 1) AND ("display_position" <= 10))),
    CONSTRAINT "posts_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'pending'::"text", 'published'::"text", 'archived'::"text"])))
);


ALTER TABLE "public"."posts" OWNER TO "postgres";


COMMENT ON TABLE "public"."posts" IS 'Main posts table - news articles and blog posts with multi-language support';



COMMENT ON COLUMN "public"."posts"."id" IS 'Unique post identifier';



COMMENT ON COLUMN "public"."posts"."author_id" IS 'Foreign key to profiles table (post author)';



COMMENT ON COLUMN "public"."posts"."practice_id" IS 'Foreign key to practices table (optional)';



COMMENT ON COLUMN "public"."posts"."display_position" IS 'NewsPage position 1-10 (featured), NULL = AllPostsSection';



COMMENT ON COLUMN "public"."posts"."position_order" IS 'Order within slider positions (3, 5, 9, 10)';



COMMENT ON COLUMN "public"."posts"."status" IS 'Publication status: draft, pending, published, archived';



COMMENT ON COLUMN "public"."posts"."featured_image_url" IS 'Featured image URL (language-independent)';



COMMENT ON COLUMN "public"."posts"."published_at" IS 'Publication timestamp (NULL = not published yet)';



COMMENT ON COLUMN "public"."posts"."category_id" IS 'Foreign key to post_categories table (optional category for the post)';



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text",
    "full_name" "text",
    "role" "text" DEFAULT 'USER'::"text",
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "phone_number" "text",
    "company_slug" "text",
    "is_blocked" boolean DEFAULT false,
    "company_id" "uuid",
    "company_overview" "text",
    "summary" "text",
    "mission_statement" "text",
    "vision_values" "text",
    "history" "text",
    "how_we_work" "text",
    "website" "text",
    "address" "text",
    "map_link" "text",
    "facebook_link" "text",
    "instagram_link" "text",
    "linkedin_link" "text",
    "twitter_link" "text",
    "logo_url" "text",
    "slug" "text",
    "role_title" "text",
    "languages" "jsonb" DEFAULT '[]'::"jsonb",
    "bio" "text",
    "philosophy" "text",
    "focus_areas" "jsonb" DEFAULT '[]'::"jsonb",
    "representative_matters" "jsonb" DEFAULT '[]'::"jsonb",
    "teaching_writing_speaking" "text",
    "credentials_memberships" "jsonb" DEFAULT '[]'::"jsonb",
    "values_how_we_work" "jsonb" DEFAULT '{}'::"jsonb",
    "verification_status" "text" DEFAULT 'unverified'::"text",
    "verification_requested_at" timestamp with time zone,
    "verification_reviewed_at" timestamp with time zone,
    "verification_reviewed_by" "uuid",
    "verification_notes" "text",
    "blocked_by" "uuid",
    "blocked_at" timestamp with time zone,
    "block_reason" "text",
    "seo_title" "text",
    "seo_description" "text",
    "seo_keywords" "text",
    "social_title" "text",
    "social_description" "text",
    "social_hashtags" "text",
    "social_image_url" "text",
    "avatar_alt_text" "text",
    "meta_title" "text",
    "meta_description" "text",
    "meta_keywords" "text",
    "info_activate" boolean DEFAULT false NOT NULL,
    CONSTRAINT "profiles_role_check" CHECK (("role" = ANY (ARRAY['USER'::"text", 'AUTHOR'::"text", 'SPECIALIST'::"text", 'SOLO_SPECIALIST'::"text", 'COMPANY'::"text", 'SUPER_ADMIN'::"text", 'MODERATOR'::"text"]))),
    CONSTRAINT "profiles_verification_status_check" CHECK (("verification_status" = ANY (ARRAY['unverified'::"text", 'pending'::"text", 'verified'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON TABLE "public"."profiles" IS 'User profiles table - RLS policies restored to working state';



COMMENT ON COLUMN "public"."profiles"."role" IS 'User role: USER (default), AUTHOR (content creator), SPECIALIST (company-affiliated specialist), SOLO_SPECIALIST (independent specialist), COMPANY (company account), SUPER_ADMIN (full access), MODERATOR (content moderation)';



COMMENT ON COLUMN "public"."profiles"."phone_number" IS 'User phone number for contact purposes';



COMMENT ON COLUMN "public"."profiles"."company_slug" IS 'URL-friendly slug for company profiles';



COMMENT ON COLUMN "public"."profiles"."is_blocked" IS 'Whether the user is blocked (cannot access platform)';



COMMENT ON COLUMN "public"."profiles"."company_id" IS 'Reference to company profile that this specialist belongs to';



COMMENT ON COLUMN "public"."profiles"."company_overview" IS 'Detailed company overview/description';



COMMENT ON COLUMN "public"."profiles"."summary" IS 'Brief introduction shown on public profile';



COMMENT ON COLUMN "public"."profiles"."mission_statement" IS 'Company mission statement';



COMMENT ON COLUMN "public"."profiles"."vision_values" IS 'Company vision and values';



COMMENT ON COLUMN "public"."profiles"."history" IS 'Company history or founding story';



COMMENT ON COLUMN "public"."profiles"."how_we_work" IS 'Description of how the company works';



COMMENT ON COLUMN "public"."profiles"."website" IS 'Company website URL';



COMMENT ON COLUMN "public"."profiles"."address" IS 'Company physical address';



COMMENT ON COLUMN "public"."profiles"."map_link" IS 'Google Maps or similar map link';



COMMENT ON COLUMN "public"."profiles"."facebook_link" IS 'Facebook page URL';



COMMENT ON COLUMN "public"."profiles"."instagram_link" IS 'Instagram profile URL';



COMMENT ON COLUMN "public"."profiles"."linkedin_link" IS 'LinkedIn company page URL';



COMMENT ON COLUMN "public"."profiles"."twitter_link" IS 'Twitter/X profile URL';



COMMENT ON COLUMN "public"."profiles"."logo_url" IS 'Company logo image URL';



COMMENT ON COLUMN "public"."profiles"."slug" IS 'URL-friendly identifier for specialist profile pages';



COMMENT ON COLUMN "public"."profiles"."role_title" IS 'Professional role/title (e.g., "Senior Legal Counsel")';



COMMENT ON COLUMN "public"."profiles"."languages" IS 'JSON array of languages spoken (e.g., ["English", "Georgian", "Russian"])';



COMMENT ON COLUMN "public"."profiles"."bio" IS 'Brief professional biography';



COMMENT ON COLUMN "public"."profiles"."philosophy" IS 'Professional philosophy and approach';



COMMENT ON COLUMN "public"."profiles"."focus_areas" IS 'JSON array of practice focus areas';



COMMENT ON COLUMN "public"."profiles"."representative_matters" IS 'JSON array of notable case examples';



COMMENT ON COLUMN "public"."profiles"."teaching_writing_speaking" IS 'Teaching engagements, publications, speaking topics';



COMMENT ON COLUMN "public"."profiles"."credentials_memberships" IS 'JSON array of professional credentials and memberships';



COMMENT ON COLUMN "public"."profiles"."values_how_we_work" IS 'JSON object describing work values and approach';



COMMENT ON COLUMN "public"."profiles"."verification_status" IS 'Verification status for SOLO_SPECIALIST, SPECIALIST, and COMPANY roles: unverified, pending, verified, rejected';



COMMENT ON COLUMN "public"."profiles"."verification_requested_at" IS 'Timestamp when specialist requested verification';



COMMENT ON COLUMN "public"."profiles"."verification_reviewed_at" IS 'Timestamp when admin reviewed the verification request';



COMMENT ON COLUMN "public"."profiles"."verification_reviewed_by" IS 'Admin user ID who reviewed the verification';



COMMENT ON COLUMN "public"."profiles"."verification_notes" IS 'Admin notes about verification decision';



COMMENT ON COLUMN "public"."profiles"."blocked_by" IS 'ID of user who blocked this profile (NULL if not blocked)';



COMMENT ON COLUMN "public"."profiles"."blocked_at" IS 'Timestamp when the user was blocked';



COMMENT ON COLUMN "public"."profiles"."block_reason" IS 'Reason for blocking the user';



COMMENT ON COLUMN "public"."profiles"."seo_title" IS 'SEO meta title (Georgian/default language)';



COMMENT ON COLUMN "public"."profiles"."seo_description" IS 'SEO meta description (Georgian/default language)';



COMMENT ON COLUMN "public"."profiles"."seo_keywords" IS 'SEO keywords comma-separated (Georgian/default language)';



COMMENT ON COLUMN "public"."profiles"."social_title" IS 'Social media title (Georgian/default language)';



COMMENT ON COLUMN "public"."profiles"."social_description" IS 'Social media description (Georgian/default language)';



COMMENT ON COLUMN "public"."profiles"."social_hashtags" IS 'Social media hashtags (Georgian/default language)';



COMMENT ON COLUMN "public"."profiles"."social_image_url" IS 'Social media image URL (Georgian/default language)';



COMMENT ON COLUMN "public"."profiles"."avatar_alt_text" IS 'Profile image alt text for accessibility (Georgian/default language)';



COMMENT ON COLUMN "public"."profiles"."meta_title" IS 'SEO meta title (Georgian/default language)';



COMMENT ON COLUMN "public"."profiles"."meta_description" IS 'SEO meta description (Georgian/default language)';



COMMENT ON COLUMN "public"."profiles"."meta_keywords" IS 'SEO keywords (Georgian/default language)';



COMMENT ON COLUMN "public"."profiles"."info_activate" IS 'When TRUE: shows real email, phone, and social links. When FALSE: shows static contact info (info.01199@gmail.com, +995551911961) and hides social links.';



CREATE OR REPLACE VIEW "public"."author_posts_with_status" WITH ("security_invoker"='on') AS
 SELECT "p"."id",
    "p"."author_id",
    "p"."practice_id",
    "p"."status",
    "p"."display_position",
    "p"."position_order",
    "p"."featured_image_url",
    "p"."published_at",
    "p"."created_at",
    "p"."updated_at",
    "prof"."full_name" AS "author_name",
    "prof"."email" AS "author_email",
    "prof"."role" AS "author_role",
    ( SELECT "count"(*) AS "count"
           FROM "public"."post_translations"
          WHERE ("post_translations"."post_id" = "p"."id")) AS "translation_count",
    ( SELECT "post_translations"."title"
           FROM "public"."post_translations"
          WHERE (("post_translations"."post_id" = "p"."id") AND ("post_translations"."language" = 'ka'::"text"))
         LIMIT 1) AS "title_ka"
   FROM ("public"."posts" "p"
     LEFT JOIN "public"."profiles" "prof" ON (("p"."author_id" = "prof"."id")));


ALTER VIEW "public"."author_posts_with_status" OWNER TO "postgres";


COMMENT ON VIEW "public"."author_posts_with_status" IS 'Helper view for author dashboards. Shows posts with author info and basic translation data.';



CREATE TABLE IF NOT EXISTS "public"."cities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name_ka" "text" NOT NULL,
    "name_en" "text" NOT NULL,
    "name_ru" "text" NOT NULL,
    "region" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."cities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."company_cities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "city_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."company_cities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."company_specializations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "specialization_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."company_specializations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."company_translations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_id" "uuid" NOT NULL,
    "language" "text" NOT NULL,
    "company_overview" "text",
    "summary" "text",
    "mission_statement" "text",
    "vision_values" "text",
    "history" "text",
    "how_we_work" "text",
    "avatar_alt_text" "text",
    "meta_title" "text",
    "meta_description" "text",
    "meta_keywords" "text",
    "social_title" "text",
    "social_description" "text",
    "social_hashtags" "text",
    "social_image_url" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "slug" "text",
    "company_name" "text",
    CONSTRAINT "company_translations_language_check" CHECK (("language" = ANY (ARRAY['en'::"text", 'ru'::"text"])))
);


ALTER TABLE "public"."company_translations" OWNER TO "postgres";


COMMENT ON TABLE "public"."company_translations" IS 'Now properly cascades when company is deleted';



COMMENT ON COLUMN "public"."company_translations"."company_id" IS 'Reference to company profile in profiles table';



COMMENT ON COLUMN "public"."company_translations"."language" IS 'Language code: en (English) or ru (Russian)';



COMMENT ON COLUMN "public"."company_translations"."company_overview" IS 'Detailed company overview/description (translated)';



COMMENT ON COLUMN "public"."company_translations"."summary" IS 'Brief introduction (translated)';



COMMENT ON COLUMN "public"."company_translations"."mission_statement" IS 'Company mission statement (translated)';



COMMENT ON COLUMN "public"."company_translations"."vision_values" IS 'Company vision and values (translated)';



COMMENT ON COLUMN "public"."company_translations"."history" IS 'Company history (translated)';



COMMENT ON COLUMN "public"."company_translations"."how_we_work" IS 'How the company works (translated)';



COMMENT ON COLUMN "public"."company_translations"."avatar_alt_text" IS 'Company logo alt text for accessibility (translated)';



COMMENT ON COLUMN "public"."company_translations"."meta_title" IS 'SEO meta title (translated)';



COMMENT ON COLUMN "public"."company_translations"."meta_description" IS 'SEO meta description (translated)';



COMMENT ON COLUMN "public"."company_translations"."meta_keywords" IS 'SEO keywords (translated)';



COMMENT ON COLUMN "public"."company_translations"."social_title" IS 'Social media title (translated)';



COMMENT ON COLUMN "public"."company_translations"."social_description" IS 'Social media description (translated)';



COMMENT ON COLUMN "public"."company_translations"."social_hashtags" IS 'Social media hashtags (translated)';



COMMENT ON COLUMN "public"."company_translations"."social_image_url" IS 'Social media image URL (translated)';



COMMENT ON COLUMN "public"."company_translations"."slug" IS 'URL-friendly identifier for company pages (English and Russian only)';



CREATE TABLE IF NOT EXISTS "public"."global_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title_ka" "text" NOT NULL,
    "title_en" "text" NOT NULL,
    "title_ru" "text" NOT NULL,
    "content_ka" "text" NOT NULL,
    "content_en" "text" NOT NULL,
    "content_ru" "text" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "is_active" boolean DEFAULT true,
    "priority" "text" DEFAULT 'normal'::"text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone,
    CONSTRAINT "global_messages_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'normal'::"text", 'high'::"text", 'urgent'::"text"])))
);


ALTER TABLE "public"."global_messages" OWNER TO "postgres";


COMMENT ON TABLE "public"."global_messages" IS 'Global messages sent by SuperAdmin to specific user roles';



COMMENT ON COLUMN "public"."global_messages"."priority" IS 'Message priority: low, normal, high, urgent';



COMMENT ON COLUMN "public"."global_messages"."expires_at" IS 'Optional expiration date for the message';



CREATE TABLE IF NOT EXISTS "public"."legal_page_translations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "legal_page_id" "uuid" NOT NULL,
    "language" "text" NOT NULL,
    "title" "text" NOT NULL,
    "intro" "text",
    "content" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "legal_page_translations_language_check" CHECK (("language" = ANY (ARRAY['ka'::"text", 'en'::"text", 'ru'::"text"])))
);


ALTER TABLE "public"."legal_page_translations" OWNER TO "postgres";


COMMENT ON TABLE "public"."legal_page_translations" IS 'Translations for legal pages in ka, en, ru languages';



COMMENT ON COLUMN "public"."legal_page_translations"."content" IS 'JSON array of sections: [{id, title, content}, ...]';



CREATE TABLE IF NOT EXISTS "public"."legal_pages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "page_type" "text" NOT NULL,
    "icon" "text" DEFAULT 'FileText'::"text",
    "status" "text" DEFAULT 'published'::"text",
    "updated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "legal_pages_page_type_check" CHECK (("page_type" = ANY (ARRAY['privacy'::"text", 'terms'::"text", 'cookies'::"text"]))),
    CONSTRAINT "legal_pages_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'published'::"text"])))
);


ALTER TABLE "public"."legal_pages" OWNER TO "postgres";


COMMENT ON TABLE "public"."legal_pages" IS 'Stores the 3 legal pages: privacy, terms, cookies';



CREATE TABLE IF NOT EXISTS "public"."message_target_roles" (
    "message_id" "uuid" NOT NULL,
    "target_role" "text" NOT NULL,
    CONSTRAINT "message_target_roles_target_role_check" CHECK (("target_role" = ANY (ARRAY['USER'::"text", 'AUTHOR'::"text", 'SPECIALIST'::"text", 'SOLO_SPECIALIST'::"text", 'COMPANY'::"text", 'MODERATOR'::"text"])))
);


ALTER TABLE "public"."message_target_roles" OWNER TO "postgres";


COMMENT ON TABLE "public"."message_target_roles" IS 'Defines which user roles should receive each global message';



CREATE TABLE IF NOT EXISTS "public"."news_banners" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "image_url_ka" "text" NOT NULL,
    "image_url_en" "text" NOT NULL,
    "image_url_ru" "text" NOT NULL,
    "category_id" "uuid",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "display_order" integer DEFAULT 0
);


ALTER TABLE "public"."news_banners" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."post_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "parent_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."post_categories" OWNER TO "postgres";


COMMENT ON TABLE "public"."post_categories" IS 'Hierarchical categories for posts (supports subcategories)';



COMMENT ON COLUMN "public"."post_categories"."parent_id" IS 'Parent category ID for hierarchical structure (NULL = root category)';



CREATE TABLE IF NOT EXISTS "public"."post_category_translations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "category_id" "uuid" NOT NULL,
    "language" "text" NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "seo_title" "text",
    "seo_description" "text",
    CONSTRAINT "post_category_translations_language_check" CHECK (("language" = ANY (ARRAY['ka'::"text", 'en'::"text", 'ru'::"text"])))
);


ALTER TABLE "public"."post_category_translations" OWNER TO "postgres";


COMMENT ON TABLE "public"."post_category_translations" IS 'Translations for post categories - 3 rows per category (ka, en, ru)';



COMMENT ON COLUMN "public"."post_category_translations"."category_id" IS 'Foreign key to post_categories table';



COMMENT ON COLUMN "public"."post_category_translations"."language" IS 'Language code: ka (Georgian), en (English), ru (Russian)';



COMMENT ON COLUMN "public"."post_category_translations"."slug" IS 'URL-friendly slug - unique per language';



COMMENT ON COLUMN "public"."post_category_translations"."seo_title" IS 'SEO optimized title for category page meta tags';



COMMENT ON COLUMN "public"."post_category_translations"."seo_description" IS 'SEO optimized description for category page meta tags';



CREATE TABLE IF NOT EXISTS "public"."post_display_settings" (
    "post_id" "uuid" NOT NULL,
    "focal_point_x" integer DEFAULT 50,
    "focal_point_y" integer DEFAULT 50,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "post_display_settings_focal_point_x_check" CHECK ((("focal_point_x" >= 0) AND ("focal_point_x" <= 100))),
    CONSTRAINT "post_display_settings_focal_point_y_check" CHECK ((("focal_point_y" >= 0) AND ("focal_point_y" <= 100)))
);


ALTER TABLE "public"."post_display_settings" OWNER TO "postgres";


COMMENT ON TABLE "public"."post_display_settings" IS 'Display settings for posts - focal points for Position 1 image positioning';



COMMENT ON COLUMN "public"."post_display_settings"."post_id" IS 'Foreign key to posts table (primary key)';



COMMENT ON COLUMN "public"."post_display_settings"."focal_point_x" IS 'Horizontal focal point: 0=left edge, 50=center, 100=right edge (used in CSS object-position)';



COMMENT ON COLUMN "public"."post_display_settings"."focal_point_y" IS 'Vertical focal point: 0=top edge, 50=center, 100=bottom edge (used in CSS object-position)';



CREATE TABLE IF NOT EXISTS "public"."practice_translations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "practice_id" "uuid" NOT NULL,
    "language" "text" NOT NULL,
    "title" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text",
    "hero_image_alt" "text",
    "page_hero_image_alt" "text",
    "word_count" integer DEFAULT 0,
    "reading_time" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "meta_title" "text",
    "meta_description" "text",
    "focus_keyword" "text",
    "og_title" "text",
    "og_description" "text",
    "og_image_url" "text",
    "social_hashtags" "text",
    CONSTRAINT "meta_description_length" CHECK ((("meta_description" IS NULL) OR ("char_length"("meta_description") <= 160))),
    CONSTRAINT "og_description_length" CHECK ((("og_description" IS NULL) OR ("char_length"("og_description") <= 200))),
    CONSTRAINT "og_title_length" CHECK ((("og_title" IS NULL) OR ("char_length"("og_title") <= 60))),
    CONSTRAINT "practice_translations_language_check" CHECK (("language" = ANY (ARRAY['ka'::"text", 'en'::"text", 'ru'::"text"])))
);


ALTER TABLE "public"."practice_translations" OWNER TO "postgres";


COMMENT ON TABLE "public"."practice_translations" IS 'Translations for practices - 3 rows per practice (ka, en, ru)';



COMMENT ON COLUMN "public"."practice_translations"."practice_id" IS 'Foreign key to practices table';



COMMENT ON COLUMN "public"."practice_translations"."language" IS 'Language code: ka (Georgian), en (English), ru (Russian)';



COMMENT ON COLUMN "public"."practice_translations"."slug" IS 'URL-friendly slug - unique per language';



COMMENT ON COLUMN "public"."practice_translations"."description" IS 'HTML content from Tiptap editor';



COMMENT ON COLUMN "public"."practice_translations"."word_count" IS 'Number of words in description (for reading stats)';



COMMENT ON COLUMN "public"."practice_translations"."reading_time" IS 'Estimated reading time in minutes';



COMMENT ON COLUMN "public"."practice_translations"."meta_title" IS 'SEO meta title for search engines. Max 60 characters recommended. Shows in browser tab and Google search results. If NULL, fallback to title + site name.';



COMMENT ON COLUMN "public"."practice_translations"."meta_description" IS 'SEO meta description for search results snippet. Max 160 characters enforced. Shows below title in Google search results. If NULL, auto-generated from description.';



COMMENT ON COLUMN "public"."practice_translations"."focus_keyword" IS 'Primary SEO keyword for page ranking. Optional field used for SEO optimization tracking and content analysis.';



COMMENT ON COLUMN "public"."practice_translations"."og_title" IS 'Open Graph title for social media shares (Facebook, LinkedIn, WhatsApp). Max 60 characters enforced. If NULL, fallback to meta_title or title.';



COMMENT ON COLUMN "public"."practice_translations"."og_description" IS 'Open Graph description for social media shares. Max 200 characters enforced. Shows in social media cards. If NULL, fallback to meta_description.';



COMMENT ON COLUMN "public"."practice_translations"."og_image_url" IS 'Open Graph image URL for social media shares. Recommended size: 1200x630px. If NULL, fallback to page_hero_image_url. Used by Facebook, LinkedIn, Twitter, WhatsApp.';



COMMENT ON COLUMN "public"."practice_translations"."social_hashtags" IS 'Social media hashtags for this language';



CREATE TABLE IF NOT EXISTS "public"."practices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "hero_image_url" "text",
    "page_hero_image_url" "text",
    "status" "text" DEFAULT 'draft'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "practices_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'published'::"text", 'archived'::"text"])))
);


ALTER TABLE "public"."practices" OWNER TO "postgres";


COMMENT ON TABLE "public"."practices" IS 'Main practices table - one record per practice area';



COMMENT ON COLUMN "public"."practices"."id" IS 'Unique practice identifier';



COMMENT ON COLUMN "public"."practices"."hero_image_url" IS 'Hero image URL for list view (same for all languages)';



COMMENT ON COLUMN "public"."practices"."page_hero_image_url" IS 'Page hero image URL for detail view (same for all languages)';



COMMENT ON COLUMN "public"."practices"."status" IS 'Publication status: draft, published, or archived';



CREATE TABLE IF NOT EXISTS "public"."service_translations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "service_id" "uuid" NOT NULL,
    "language" "text" NOT NULL,
    "title" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text",
    "image_alt" "text",
    "meta_title" "text",
    "meta_description" "text",
    "og_title" "text",
    "og_description" "text",
    "word_count" integer DEFAULT 0,
    "reading_time" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "social_hashtags" "text",
    CONSTRAINT "service_translations_language_check" CHECK (("language" = ANY (ARRAY['ka'::"text", 'en'::"text", 'ru'::"text"])))
);


ALTER TABLE "public"."service_translations" OWNER TO "postgres";


COMMENT ON TABLE "public"."service_translations" IS 'Translations for services - 3 rows per service (ka, en, ru)';



COMMENT ON COLUMN "public"."service_translations"."service_id" IS 'Foreign key to services table';



COMMENT ON COLUMN "public"."service_translations"."language" IS 'Language code: ka (Georgian), en (English), ru (Russian)';



COMMENT ON COLUMN "public"."service_translations"."slug" IS 'URL-friendly slug - unique per language';



COMMENT ON COLUMN "public"."service_translations"."description" IS 'HTML content from Tiptap editor';



COMMENT ON COLUMN "public"."service_translations"."image_alt" IS 'Alt text for service image - language specific';



COMMENT ON COLUMN "public"."service_translations"."meta_title" IS 'SEO meta title for search engines';



COMMENT ON COLUMN "public"."service_translations"."meta_description" IS 'SEO meta description for search engines';



COMMENT ON COLUMN "public"."service_translations"."og_title" IS 'Open Graph title for social media';



COMMENT ON COLUMN "public"."service_translations"."og_description" IS 'Open Graph description for social media';



COMMENT ON COLUMN "public"."service_translations"."word_count" IS 'Number of words in description (for reading stats)';



COMMENT ON COLUMN "public"."service_translations"."reading_time" IS 'Estimated reading time in minutes';



COMMENT ON COLUMN "public"."service_translations"."social_hashtags" IS 'Social media hashtags for this language';



CREATE TABLE IF NOT EXISTS "public"."services" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "practice_id" "uuid" NOT NULL,
    "image_url" "text",
    "og_image_url" "text",
    "status" "text" DEFAULT 'draft'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "services_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'published'::"text", 'archived'::"text"])))
);


ALTER TABLE "public"."services" OWNER TO "postgres";


COMMENT ON TABLE "public"."services" IS 'Main services table - each service belongs to a practice';



COMMENT ON COLUMN "public"."services"."id" IS 'Unique service identifier';



COMMENT ON COLUMN "public"."services"."practice_id" IS 'Foreign key to practices table';



COMMENT ON COLUMN "public"."services"."image_url" IS 'Service image URL (same for all languages)';



COMMENT ON COLUMN "public"."services"."og_image_url" IS 'Open Graph image URL for social media sharing';



COMMENT ON COLUMN "public"."services"."status" IS 'Publication status: draft, published, or archived';



CREATE TABLE IF NOT EXISTS "public"."specialist_cities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "specialist_id" "uuid" NOT NULL,
    "city_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."specialist_cities" OWNER TO "postgres";


COMMENT ON TABLE "public"."specialist_cities" IS 'Now properly cascades when specialist is deleted';



COMMENT ON COLUMN "public"."specialist_cities"."specialist_id" IS 'References the specialist user ID from auth.users';



COMMENT ON COLUMN "public"."specialist_cities"."city_id" IS 'References the city ID from cities table';



CREATE TABLE IF NOT EXISTS "public"."specialist_services" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "service_id" "uuid" NOT NULL
);


ALTER TABLE "public"."specialist_services" OWNER TO "postgres";


COMMENT ON TABLE "public"."specialist_services" IS 'Now properly cascades when specialist is deleted';



COMMENT ON COLUMN "public"."specialist_services"."profile_id" IS 'Foreign key to profiles table (specialist)';



COMMENT ON COLUMN "public"."specialist_services"."service_id" IS 'Foreign key to services table';



CREATE TABLE IF NOT EXISTS "public"."specialist_translations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "specialist_id" "uuid" NOT NULL,
    "language" character varying(10) NOT NULL,
    "full_name" "text",
    "role_title" "text",
    "bio" "text",
    "philosophy" "text",
    "teaching_writing_speaking" "text",
    "focus_areas" "text"[],
    "representative_matters" "text"[],
    "credentials_memberships" "text"[],
    "values_how_we_work" "jsonb" DEFAULT '{}'::"jsonb",
    "seo_title" "text",
    "seo_description" "text",
    "seo_keywords" "text",
    "social_title" "text",
    "social_description" "text",
    "social_hashtags" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "social_image_url" "text",
    "avatar_alt_text" "text",
    "slug" "text",
    CONSTRAINT "specialist_translations_language_check" CHECK ((("language")::"text" = ANY ((ARRAY['ka'::character varying, 'en'::character varying, 'ru'::character varying])::"text"[])))
);


ALTER TABLE "public"."specialist_translations" OWNER TO "postgres";


COMMENT ON TABLE "public"."specialist_translations" IS 'Now properly cascades when specialist is deleted';



COMMENT ON COLUMN "public"."specialist_translations"."full_name" IS 'Translated full name';



COMMENT ON COLUMN "public"."specialist_translations"."role_title" IS 'Translated professional role/title';



COMMENT ON COLUMN "public"."specialist_translations"."bio" IS 'Translated biography';



COMMENT ON COLUMN "public"."specialist_translations"."philosophy" IS 'Translated professional philosophy';



COMMENT ON COLUMN "public"."specialist_translations"."teaching_writing_speaking" IS 'Translated teaching/writing/speaking activities';



COMMENT ON COLUMN "public"."specialist_translations"."focus_areas" IS 'Array of translated focus areas';



COMMENT ON COLUMN "public"."specialist_translations"."representative_matters" IS 'Array of translated representative matters';



COMMENT ON COLUMN "public"."specialist_translations"."credentials_memberships" IS 'Array of translated credentials and memberships';



COMMENT ON COLUMN "public"."specialist_translations"."values_how_we_work" IS 'JSON object with translated values and work approach';



COMMENT ON COLUMN "public"."specialist_translations"."seo_title" IS 'SEO meta title for this language';



COMMENT ON COLUMN "public"."specialist_translations"."seo_description" IS 'SEO meta description for this language';



COMMENT ON COLUMN "public"."specialist_translations"."seo_keywords" IS 'SEO keywords for this language';



COMMENT ON COLUMN "public"."specialist_translations"."social_title" IS 'Social media share title for this language';



COMMENT ON COLUMN "public"."specialist_translations"."social_description" IS 'Social media share description for this language';



COMMENT ON COLUMN "public"."specialist_translations"."social_hashtags" IS 'Social media hashtags for this language';



COMMENT ON COLUMN "public"."specialist_translations"."social_image_url" IS 'Social media share image URL for this language - path in specialist-social-images bucket';



COMMENT ON COLUMN "public"."specialist_translations"."avatar_alt_text" IS 'Profile image alt text for accessibility (translated)';



COMMENT ON COLUMN "public"."specialist_translations"."slug" IS 'URL-friendly identifier for specialist profile pages (per language)';



CREATE TABLE IF NOT EXISTS "public"."specializations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name_ka" "text" NOT NULL,
    "name_en" "text" NOT NULL,
    "name_ru" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."specializations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."team_members" (
    "section_id" "uuid" NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."team_members" OWNER TO "postgres";


COMMENT ON TABLE "public"."team_members" IS 'Associates specialists with specific team sections';



CREATE TABLE IF NOT EXISTS "public"."team_section_translations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "section_id" "uuid" NOT NULL,
    "language" "text" NOT NULL,
    "title" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "team_section_translations_language_check" CHECK (("language" = ANY (ARRAY['ka'::"text", 'en'::"text", 'ru'::"text"])))
);


ALTER TABLE "public"."team_section_translations" OWNER TO "postgres";


COMMENT ON TABLE "public"."team_section_translations" IS 'Stores multilingual titles for team sections';



CREATE TABLE IF NOT EXISTS "public"."team_sections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "team_id" "uuid" NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."team_sections" OWNER TO "postgres";


COMMENT ON TABLE "public"."team_sections" IS 'Stores sections within a team (e.g., Executive Board, Ethics Committee)';



CREATE TABLE IF NOT EXISTS "public"."team_translations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "team_id" "uuid" NOT NULL,
    "language" "text" NOT NULL,
    "name" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "slug" "text" NOT NULL,
    "meta_title" "text",
    "meta_description" "text",
    "og_title" "text",
    "og_description" "text",
    "banner_image_url" "text",
    "banner_alt" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "team_translations_language_check" CHECK (("language" = ANY (ARRAY['ka'::"text", 'en'::"text", 'ru'::"text"])))
);


ALTER TABLE "public"."team_translations" OWNER TO "postgres";


COMMENT ON TABLE "public"."team_translations" IS 'Stores multilingual content for teams (ka, en, ru) including slugs';



CREATE TABLE IF NOT EXISTS "public"."teams" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "leader_id" "uuid" NOT NULL,
    "og_image_url" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."teams" OWNER TO "postgres";


COMMENT ON TABLE "public"."teams" IS 'Stores team basic information including leader';



CREATE TABLE IF NOT EXISTS "public"."user_read_messages" (
    "user_id" "uuid" NOT NULL,
    "message_id" "uuid" NOT NULL,
    "read_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_read_messages" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_read_messages" IS 'Tracks which users have read which messages';



ALTER TABLE ONLY "public"."access_requests"
    ADD CONSTRAINT "access_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cities"
    ADD CONSTRAINT "cities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."company_cities"
    ADD CONSTRAINT "company_cities_company_id_city_id_key" UNIQUE ("company_id", "city_id");



ALTER TABLE ONLY "public"."company_cities"
    ADD CONSTRAINT "company_cities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."company_specializations"
    ADD CONSTRAINT "company_specializations_company_id_specialization_id_key" UNIQUE ("company_id", "specialization_id");



ALTER TABLE ONLY "public"."company_specializations"
    ADD CONSTRAINT "company_specializations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."company_translations"
    ADD CONSTRAINT "company_translations_company_id_language_key" UNIQUE ("company_id", "language");



ALTER TABLE ONLY "public"."company_translations"
    ADD CONSTRAINT "company_translations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."global_messages"
    ADD CONSTRAINT "global_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."legal_page_translations"
    ADD CONSTRAINT "legal_page_translations_legal_page_id_language_key" UNIQUE ("legal_page_id", "language");



ALTER TABLE ONLY "public"."legal_page_translations"
    ADD CONSTRAINT "legal_page_translations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."legal_pages"
    ADD CONSTRAINT "legal_pages_page_type_key" UNIQUE ("page_type");



ALTER TABLE ONLY "public"."legal_pages"
    ADD CONSTRAINT "legal_pages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."message_target_roles"
    ADD CONSTRAINT "message_target_roles_pkey" PRIMARY KEY ("message_id", "target_role");



ALTER TABLE ONLY "public"."news_banners"
    ADD CONSTRAINT "news_banners_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."post_categories"
    ADD CONSTRAINT "post_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."post_category_translations"
    ADD CONSTRAINT "post_category_translations_category_id_language_key" UNIQUE ("category_id", "language");



ALTER TABLE ONLY "public"."post_category_translations"
    ADD CONSTRAINT "post_category_translations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."post_category_translations"
    ADD CONSTRAINT "post_category_translations_slug_language_key" UNIQUE ("slug", "language");



ALTER TABLE ONLY "public"."post_display_settings"
    ADD CONSTRAINT "post_display_settings_pkey" PRIMARY KEY ("post_id");



ALTER TABLE ONLY "public"."post_translations"
    ADD CONSTRAINT "post_translations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."post_translations"
    ADD CONSTRAINT "post_translations_post_id_language_key" UNIQUE ("post_id", "language");



ALTER TABLE ONLY "public"."post_translations"
    ADD CONSTRAINT "post_translations_slug_language_key" UNIQUE ("slug", "language");



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."practice_translations"
    ADD CONSTRAINT "practice_translations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."practice_translations"
    ADD CONSTRAINT "practice_translations_practice_id_language_key" UNIQUE ("practice_id", "language");



ALTER TABLE ONLY "public"."practice_translations"
    ADD CONSTRAINT "practice_translations_slug_language_key" UNIQUE ("slug", "language");



ALTER TABLE ONLY "public"."practices"
    ADD CONSTRAINT "practices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."service_translations"
    ADD CONSTRAINT "service_translations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."service_translations"
    ADD CONSTRAINT "service_translations_service_id_language_key" UNIQUE ("service_id", "language");



ALTER TABLE ONLY "public"."service_translations"
    ADD CONSTRAINT "service_translations_slug_language_key" UNIQUE ("slug", "language");



ALTER TABLE ONLY "public"."services"
    ADD CONSTRAINT "services_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."specialist_cities"
    ADD CONSTRAINT "specialist_cities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."specialist_cities"
    ADD CONSTRAINT "specialist_cities_specialist_id_city_id_key" UNIQUE ("specialist_id", "city_id");



ALTER TABLE ONLY "public"."specialist_services"
    ADD CONSTRAINT "specialist_services_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."specialist_services"
    ADD CONSTRAINT "specialist_services_profile_id_service_id_key" UNIQUE ("profile_id", "service_id");



ALTER TABLE ONLY "public"."specialist_translations"
    ADD CONSTRAINT "specialist_translations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."specialist_translations"
    ADD CONSTRAINT "specialist_translations_specialist_id_language_key" UNIQUE ("specialist_id", "language");



ALTER TABLE ONLY "public"."specializations"
    ADD CONSTRAINT "specializations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_pkey" PRIMARY KEY ("section_id", "profile_id");



ALTER TABLE ONLY "public"."team_section_translations"
    ADD CONSTRAINT "team_section_translations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."team_section_translations"
    ADD CONSTRAINT "team_section_translations_section_id_language_key" UNIQUE ("section_id", "language");



ALTER TABLE ONLY "public"."team_sections"
    ADD CONSTRAINT "team_sections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."team_translations"
    ADD CONSTRAINT "team_translations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."team_translations"
    ADD CONSTRAINT "team_translations_slug_language_key" UNIQUE ("slug", "language");



ALTER TABLE ONLY "public"."team_translations"
    ADD CONSTRAINT "team_translations_team_id_language_key" UNIQUE ("team_id", "language");



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_read_messages"
    ADD CONSTRAINT "user_read_messages_pkey" PRIMARY KEY ("user_id", "message_id");



CREATE INDEX "idx_access_requests_company_id" ON "public"."access_requests" USING "btree" ("company_id");



CREATE INDEX "idx_access_requests_created_at" ON "public"."access_requests" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_access_requests_status" ON "public"."access_requests" USING "btree" ("status");



CREATE INDEX "idx_access_requests_user_id" ON "public"."access_requests" USING "btree" ("user_id");



CREATE INDEX "idx_cities_name_en" ON "public"."cities" USING "btree" ("name_en");



CREATE INDEX "idx_cities_name_ka" ON "public"."cities" USING "btree" ("name_ka");



CREATE INDEX "idx_cities_name_ru" ON "public"."cities" USING "btree" ("name_ru");



CREATE INDEX "idx_company_cities_city_id" ON "public"."company_cities" USING "btree" ("city_id");



CREATE INDEX "idx_company_cities_company_id" ON "public"."company_cities" USING "btree" ("company_id");



CREATE INDEX "idx_company_specializations_company_id" ON "public"."company_specializations" USING "btree" ("company_id");



CREATE INDEX "idx_company_specializations_specialization_id" ON "public"."company_specializations" USING "btree" ("specialization_id");



CREATE INDEX "idx_company_translations_company_name" ON "public"."company_translations" USING "btree" ("company_name");



CREATE INDEX "idx_company_translations_slug" ON "public"."company_translations" USING "btree" ("slug") WHERE ("slug" IS NOT NULL);



CREATE UNIQUE INDEX "idx_company_translations_slug_language" ON "public"."company_translations" USING "btree" ("slug", "language") WHERE ("slug" IS NOT NULL);



CREATE INDEX "idx_global_messages_created_at" ON "public"."global_messages" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_global_messages_created_by" ON "public"."global_messages" USING "btree" ("created_by");



CREATE INDEX "idx_global_messages_expires_at" ON "public"."global_messages" USING "btree" ("expires_at") WHERE ("expires_at" IS NOT NULL);



CREATE INDEX "idx_global_messages_is_active" ON "public"."global_messages" USING "btree" ("is_active");



CREATE INDEX "idx_legal_page_translations_language" ON "public"."legal_page_translations" USING "btree" ("language");



CREATE INDEX "idx_legal_page_translations_page_id" ON "public"."legal_page_translations" USING "btree" ("legal_page_id");



CREATE INDEX "idx_legal_page_translations_page_lang" ON "public"."legal_page_translations" USING "btree" ("legal_page_id", "language");



CREATE INDEX "idx_legal_pages_page_type" ON "public"."legal_pages" USING "btree" ("page_type");



CREATE INDEX "idx_legal_pages_status" ON "public"."legal_pages" USING "btree" ("status");



CREATE INDEX "idx_message_target_roles_message" ON "public"."message_target_roles" USING "btree" ("message_id");



CREATE INDEX "idx_message_target_roles_role" ON "public"."message_target_roles" USING "btree" ("target_role");



CREATE INDEX "idx_news_banners_category_id" ON "public"."news_banners" USING "btree" ("category_id");



CREATE INDEX "idx_news_banners_created_at" ON "public"."news_banners" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_news_banners_display_order" ON "public"."news_banners" USING "btree" ("display_order");



CREATE INDEX "idx_news_banners_is_active" ON "public"."news_banners" USING "btree" ("is_active");



CREATE INDEX "idx_post_category_translations_category_id" ON "public"."post_category_translations" USING "btree" ("category_id");



CREATE INDEX "idx_post_category_translations_language" ON "public"."post_category_translations" USING "btree" ("language");



CREATE INDEX "idx_post_category_translations_slug" ON "public"."post_category_translations" USING "btree" ("slug");



CREATE INDEX "idx_post_display_settings_post_id" ON "public"."post_display_settings" USING "btree" ("post_id");



CREATE INDEX "idx_post_translations_category" ON "public"."post_translations" USING "btree" ("category");



CREATE INDEX "idx_post_translations_category_id" ON "public"."post_translations" USING "btree" ("category_id");



CREATE INDEX "idx_post_translations_category_slug" ON "public"."post_translations" USING "btree" ("category_slug");



CREATE INDEX "idx_post_translations_language" ON "public"."post_translations" USING "btree" ("language");



CREATE INDEX "idx_post_translations_post_id" ON "public"."post_translations" USING "btree" ("post_id");



CREATE INDEX "idx_post_translations_slug" ON "public"."post_translations" USING "btree" ("slug");



CREATE INDEX "idx_post_translations_slug_language" ON "public"."post_translations" USING "btree" ("slug", "language");



CREATE INDEX "idx_posts_author_id" ON "public"."posts" USING "btree" ("author_id");



CREATE INDEX "idx_posts_category_id" ON "public"."posts" USING "btree" ("category_id");



CREATE INDEX "idx_posts_display_position" ON "public"."posts" USING "btree" ("display_position") WHERE ("display_position" IS NOT NULL);



CREATE INDEX "idx_posts_practice_id" ON "public"."posts" USING "btree" ("practice_id");



CREATE INDEX "idx_posts_published_at" ON "public"."posts" USING "btree" ("published_at" DESC) WHERE ("status" = 'published'::"text");



CREATE INDEX "idx_posts_published_positioned" ON "public"."posts" USING "btree" ("display_position", "position_order") WHERE (("status" = 'published'::"text") AND ("display_position" IS NOT NULL));



CREATE INDEX "idx_posts_status" ON "public"."posts" USING "btree" ("status");



CREATE UNIQUE INDEX "idx_posts_unique_single_position" ON "public"."posts" USING "btree" ("display_position") WHERE (("display_position" = ANY (ARRAY[4, 6, 7])) AND ("status" = 'published'::"text"));



COMMENT ON INDEX "public"."idx_posts_unique_single_position" IS 'Only positions 4,6,7 are single posts. Others are sliders/feeds with multiple posts.';



CREATE INDEX "idx_practice_translations_focus_keyword" ON "public"."practice_translations" USING "btree" ("focus_keyword") WHERE ("focus_keyword" IS NOT NULL);



CREATE INDEX "idx_practice_translations_language" ON "public"."practice_translations" USING "btree" ("language");



CREATE INDEX "idx_practice_translations_practice_id" ON "public"."practice_translations" USING "btree" ("practice_id");



CREATE INDEX "idx_practice_translations_slug" ON "public"."practice_translations" USING "btree" ("slug");



CREATE INDEX "idx_practice_translations_slug_language" ON "public"."practice_translations" USING "btree" ("slug", "language");



CREATE INDEX "idx_practices_status" ON "public"."practices" USING "btree" ("status");



CREATE INDEX "idx_profiles_blocked_by" ON "public"."profiles" USING "btree" ("blocked_by");



CREATE INDEX "idx_profiles_company_id" ON "public"."profiles" USING "btree" ("company_id");



CREATE INDEX "idx_profiles_info_activate" ON "public"."profiles" USING "btree" ("info_activate");



CREATE INDEX "idx_profiles_is_blocked" ON "public"."profiles" USING "btree" ("is_blocked");



CREATE INDEX "idx_profiles_pending_verification" ON "public"."profiles" USING "btree" ("verification_requested_at") WHERE ("verification_status" = 'pending'::"text");



CREATE INDEX "idx_profiles_pending_verification_all_roles" ON "public"."profiles" USING "btree" ("verification_requested_at") WHERE (("verification_status" = 'pending'::"text") AND ("role" = ANY (ARRAY['SOLO_SPECIALIST'::"text", 'SPECIALIST'::"text", 'COMPANY'::"text"])));



CREATE INDEX "idx_profiles_phone_number" ON "public"."profiles" USING "btree" ("phone_number");



CREATE INDEX "idx_profiles_slug" ON "public"."profiles" USING "btree" ("slug");



CREATE INDEX "idx_profiles_verification_status" ON "public"."profiles" USING "btree" ("verification_status") WHERE ("role" = 'SOLO_SPECIALIST'::"text");



CREATE INDEX "idx_profiles_verification_status_company" ON "public"."profiles" USING "btree" ("verification_status") WHERE ("role" = 'COMPANY'::"text");



CREATE INDEX "idx_profiles_verification_status_specialist" ON "public"."profiles" USING "btree" ("verification_status") WHERE ("role" = 'SPECIALIST'::"text");



CREATE INDEX "idx_service_translations_language" ON "public"."service_translations" USING "btree" ("language");



CREATE INDEX "idx_service_translations_service_id" ON "public"."service_translations" USING "btree" ("service_id");



CREATE INDEX "idx_service_translations_slug" ON "public"."service_translations" USING "btree" ("slug");



CREATE INDEX "idx_service_translations_slug_language" ON "public"."service_translations" USING "btree" ("slug", "language");



CREATE INDEX "idx_services_practice_id" ON "public"."services" USING "btree" ("practice_id");



CREATE INDEX "idx_services_status" ON "public"."services" USING "btree" ("status");



CREATE INDEX "idx_specialist_cities_city_id" ON "public"."specialist_cities" USING "btree" ("city_id");



CREATE INDEX "idx_specialist_cities_specialist_id" ON "public"."specialist_cities" USING "btree" ("specialist_id");



CREATE INDEX "idx_specialist_services_profile_id" ON "public"."specialist_services" USING "btree" ("profile_id");



CREATE INDEX "idx_specialist_services_profile_service" ON "public"."specialist_services" USING "btree" ("profile_id", "service_id");



CREATE INDEX "idx_specialist_services_service_id" ON "public"."specialist_services" USING "btree" ("service_id");



CREATE INDEX "idx_specialist_translations_language" ON "public"."specialist_translations" USING "btree" ("language");



CREATE INDEX "idx_specialist_translations_slug" ON "public"."specialist_translations" USING "btree" ("slug") WHERE ("slug" IS NOT NULL);



CREATE UNIQUE INDEX "idx_specialist_translations_slug_language" ON "public"."specialist_translations" USING "btree" ("slug", "language") WHERE ("slug" IS NOT NULL);



CREATE INDEX "idx_specialist_translations_specialist_id" ON "public"."specialist_translations" USING "btree" ("specialist_id");



CREATE INDEX "idx_team_members_order" ON "public"."team_members" USING "btree" ("order");



CREATE INDEX "idx_team_members_profile_id" ON "public"."team_members" USING "btree" ("profile_id");



CREATE INDEX "idx_team_members_section_id" ON "public"."team_members" USING "btree" ("section_id");



CREATE INDEX "idx_team_section_translations_language" ON "public"."team_section_translations" USING "btree" ("language");



CREATE INDEX "idx_team_section_translations_section_id" ON "public"."team_section_translations" USING "btree" ("section_id");



CREATE INDEX "idx_team_sections_order" ON "public"."team_sections" USING "btree" ("order");



CREATE INDEX "idx_team_sections_team_id" ON "public"."team_sections" USING "btree" ("team_id");



CREATE INDEX "idx_team_translations_language" ON "public"."team_translations" USING "btree" ("language");



CREATE INDEX "idx_team_translations_slug" ON "public"."team_translations" USING "btree" ("slug");



CREATE INDEX "idx_team_translations_team_id" ON "public"."team_translations" USING "btree" ("team_id");



CREATE INDEX "idx_teams_is_active" ON "public"."teams" USING "btree" ("is_active");



CREATE INDEX "idx_teams_leader_id" ON "public"."teams" USING "btree" ("leader_id");



CREATE INDEX "idx_user_read_messages_message" ON "public"."user_read_messages" USING "btree" ("message_id");



CREATE INDEX "idx_user_read_messages_read_at" ON "public"."user_read_messages" USING "btree" ("read_at" DESC);



CREATE INDEX "idx_user_read_messages_user" ON "public"."user_read_messages" USING "btree" ("user_id");



CREATE UNIQUE INDEX "profiles_company_slug_unique" ON "public"."profiles" USING "btree" ("company_slug") WHERE ("company_slug" IS NOT NULL);



CREATE OR REPLACE TRIGGER "on_company_translations_updated" BEFORE UPDATE ON "public"."company_translations" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "specialist_translations_updated_at" BEFORE UPDATE ON "public"."specialist_translations" FOR EACH ROW EXECUTE FUNCTION "public"."update_specialist_translations_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_auto_draft_on_author_edit" BEFORE UPDATE ON "public"."posts" FOR EACH ROW WHEN ((("old"."status" IS DISTINCT FROM "new"."status") OR ("old"."updated_at" IS DISTINCT FROM "new"."updated_at"))) EXECUTE FUNCTION "public"."auto_draft_on_author_edit"();



CREATE OR REPLACE TRIGGER "trigger_auto_generate_category_slug" BEFORE INSERT ON "public"."post_category_translations" FOR EACH ROW EXECUTE FUNCTION "public"."auto_generate_category_slug"();



CREATE OR REPLACE TRIGGER "trigger_legal_page_translations_updated_at" BEFORE UPDATE ON "public"."legal_page_translations" FOR EACH ROW EXECUTE FUNCTION "public"."update_legal_pages_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_legal_pages_updated_at" BEFORE UPDATE ON "public"."legal_pages" FOR EACH ROW EXECUTE FUNCTION "public"."update_legal_pages_updated_at"();



CREATE OR REPLACE TRIGGER "update_global_messages_updated_at" BEFORE UPDATE ON "public"."global_messages" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "update_news_banners_updated_at" BEFORE UPDATE ON "public"."news_banners" FOR EACH ROW EXECUTE FUNCTION "public"."update_news_banners_updated_at"();



CREATE OR REPLACE TRIGGER "update_post_categories_updated_at" BEFORE UPDATE ON "public"."post_categories" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_post_category_translations_updated_at" BEFORE UPDATE ON "public"."post_category_translations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_post_display_settings_updated_at" BEFORE UPDATE ON "public"."post_display_settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_post_translations_updated_at" BEFORE UPDATE ON "public"."post_translations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_posts_updated_at" BEFORE UPDATE ON "public"."posts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_practice_translations_updated_at" BEFORE UPDATE ON "public"."practice_translations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_practices_updated_at" BEFORE UPDATE ON "public"."practices" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_service_translations_updated_at" BEFORE UPDATE ON "public"."service_translations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_services_updated_at" BEFORE UPDATE ON "public"."services" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_specialist_services_updated_at" BEFORE UPDATE ON "public"."specialist_services" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_team_section_translations_updated_at" BEFORE UPDATE ON "public"."team_section_translations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_team_sections_updated_at" BEFORE UPDATE ON "public"."team_sections" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_team_translations_updated_at" BEFORE UPDATE ON "public"."team_translations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_teams_updated_at" BEFORE UPDATE ON "public"."teams" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."access_requests"
    ADD CONSTRAINT "access_requests_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



COMMENT ON CONSTRAINT "access_requests_company_id_fkey" ON "public"."access_requests" IS 'Foreign key with SET NULL on delete - preserves request history when company is deleted';



ALTER TABLE ONLY "public"."access_requests"
    ADD CONSTRAINT "access_requests_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



COMMENT ON CONSTRAINT "access_requests_reviewed_by_fkey" ON "public"."access_requests" IS 'Set reviewed_by to NULL when reviewer is deleted';



ALTER TABLE ONLY "public"."access_requests"
    ADD CONSTRAINT "access_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



COMMENT ON CONSTRAINT "access_requests_user_id_fkey" ON "public"."access_requests" IS 'Cascade delete access request when user is deleted';



ALTER TABLE ONLY "public"."company_cities"
    ADD CONSTRAINT "company_cities_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."company_cities"
    ADD CONSTRAINT "company_cities_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."company_specializations"
    ADD CONSTRAINT "company_specializations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."company_specializations"
    ADD CONSTRAINT "company_specializations_specialization_id_fkey" FOREIGN KEY ("specialization_id") REFERENCES "public"."specializations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."company_translations"
    ADD CONSTRAINT "company_translations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



COMMENT ON CONSTRAINT "company_translations_company_id_fkey" ON "public"."company_translations" IS 'Cascade delete translations when company is deleted';



ALTER TABLE ONLY "public"."global_messages"
    ADD CONSTRAINT "global_messages_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."legal_page_translations"
    ADD CONSTRAINT "legal_page_translations_legal_page_id_fkey" FOREIGN KEY ("legal_page_id") REFERENCES "public"."legal_pages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."legal_pages"
    ADD CONSTRAINT "legal_pages_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."message_target_roles"
    ADD CONSTRAINT "message_target_roles_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "public"."global_messages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."news_banners"
    ADD CONSTRAINT "news_banners_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."post_categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."post_categories"
    ADD CONSTRAINT "post_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."post_categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_category_translations"
    ADD CONSTRAINT "post_category_translations_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."post_categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_display_settings"
    ADD CONSTRAINT "post_display_settings_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_translations"
    ADD CONSTRAINT "post_translations_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."post_categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."post_translations"
    ADD CONSTRAINT "post_translations_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."post_categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_practice_id_fkey" FOREIGN KEY ("practice_id") REFERENCES "public"."practices"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."practice_translations"
    ADD CONSTRAINT "practice_translations_practice_id_fkey" FOREIGN KEY ("practice_id") REFERENCES "public"."practices"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_blocked_by_fkey" FOREIGN KEY ("blocked_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



COMMENT ON CONSTRAINT "profiles_blocked_by_fkey" ON "public"."profiles" IS 'Set blocked_by to NULL when the admin who blocked is deleted';



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



COMMENT ON CONSTRAINT "profiles_company_id_fkey" ON "public"."profiles" IS 'Set company_id to NULL when company is deleted (specialist becomes solo)';



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_verification_reviewed_by_fkey" FOREIGN KEY ("verification_reviewed_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."service_translations"
    ADD CONSTRAINT "service_translations_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."services"
    ADD CONSTRAINT "services_practice_id_fkey" FOREIGN KEY ("practice_id") REFERENCES "public"."practices"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."specialist_cities"
    ADD CONSTRAINT "specialist_cities_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."specialist_cities"
    ADD CONSTRAINT "specialist_cities_specialist_id_fkey" FOREIGN KEY ("specialist_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



COMMENT ON CONSTRAINT "specialist_cities_specialist_id_fkey" ON "public"."specialist_cities" IS 'Cascade delete cities when specialist is deleted';



ALTER TABLE ONLY "public"."specialist_services"
    ADD CONSTRAINT "specialist_services_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



COMMENT ON CONSTRAINT "specialist_services_profile_id_fkey" ON "public"."specialist_services" IS 'Cascade delete services when specialist is deleted';



ALTER TABLE ONLY "public"."specialist_services"
    ADD CONSTRAINT "specialist_services_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."specialist_translations"
    ADD CONSTRAINT "specialist_translations_specialist_id_fkey" FOREIGN KEY ("specialist_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



COMMENT ON CONSTRAINT "specialist_translations_specialist_id_fkey" ON "public"."specialist_translations" IS 'Cascade delete translations when specialist is deleted';



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "public"."team_sections"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."team_section_translations"
    ADD CONSTRAINT "team_section_translations_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "public"."team_sections"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."team_sections"
    ADD CONSTRAINT "team_sections_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."team_translations"
    ADD CONSTRAINT "team_translations_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_leader_id_fkey" FOREIGN KEY ("leader_id") REFERENCES "public"."profiles"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."user_read_messages"
    ADD CONSTRAINT "user_read_messages_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "public"."global_messages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_read_messages"
    ADD CONSTRAINT "user_read_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



CREATE POLICY "Anyone can view company cities" ON "public"."company_cities" FOR SELECT USING (true);



CREATE POLICY "Anyone can view company specializations" ON "public"."company_specializations" FOR SELECT USING (true);



CREATE POLICY "Anyone can view post display settings" ON "public"."post_display_settings" FOR SELECT USING (true);



CREATE POLICY "Authenticated users can create practice translations" ON "public"."practice_translations" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Authenticated users can create practices" ON "public"."practices" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Authenticated users can delete news banners" ON "public"."news_banners" FOR DELETE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can delete post display settings" ON "public"."post_display_settings" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can delete practice translations" ON "public"."practice_translations" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can delete practices" ON "public"."practices" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can insert news banners" ON "public"."news_banners" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can insert post display settings" ON "public"."post_display_settings" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Authenticated users can update news banners" ON "public"."news_banners" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can update post display settings" ON "public"."post_display_settings" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Authenticated users can update practice translations" ON "public"."practice_translations" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Authenticated users can update practices" ON "public"."practices" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Authenticated users can view their own profile" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "id"));



CREATE POLICY "Authors can create own post translations" ON "public"."post_translations" FOR INSERT TO "authenticated" WITH CHECK (("post_id" IN ( SELECT "posts"."id"
   FROM "public"."posts"
  WHERE ("posts"."author_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Authors can delete own draft posts" ON "public"."posts" FOR DELETE TO "authenticated" USING (((( SELECT "auth"."uid"() AS "uid") = "author_id") AND ("status" = 'draft'::"text")));



COMMENT ON POLICY "Authors can delete own draft posts" ON "public"."posts" IS 'Authors can only delete their own posts if they are in draft status.';



CREATE POLICY "Authors can delete own post translations" ON "public"."post_translations" FOR DELETE TO "authenticated" USING (("post_id" IN ( SELECT "posts"."id"
   FROM "public"."posts"
  WHERE (("posts"."author_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("posts"."status" = 'draft'::"text")))));



CREATE POLICY "Authors can read own post translations" ON "public"."post_translations" FOR SELECT TO "authenticated" USING (("post_id" IN ( SELECT "posts"."id"
   FROM "public"."posts"
  WHERE ("posts"."author_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Authors can read own posts" ON "public"."posts" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "author_id"));



COMMENT ON POLICY "Authors can read own posts" ON "public"."posts" IS 'Authors can view all their own posts regardless of status.';



CREATE POLICY "Authors can update own post translations" ON "public"."post_translations" FOR UPDATE TO "authenticated" USING (("post_id" IN ( SELECT "posts"."id"
   FROM "public"."posts"
  WHERE ("posts"."author_id" = ( SELECT "auth"."uid"() AS "uid"))))) WITH CHECK (("post_id" IN ( SELECT "posts"."id"
   FROM "public"."posts"
  WHERE ("posts"."author_id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "Authors can update own posts" ON "public"."posts" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "author_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "author_id"));



COMMENT ON POLICY "Authors can update own posts" ON "public"."posts" IS 'Authors can edit their own posts. If a published post is edited by author, trigger auto-sets status to draft.';



CREATE POLICY "Cities are viewable by everyone" ON "public"."cities" FOR SELECT USING (true);



CREATE POLICY "Companies can add their own cities" ON "public"."company_cities" FOR INSERT WITH CHECK (("auth"."uid"() = "company_id"));



CREATE POLICY "Companies can add their own specializations" ON "public"."company_specializations" FOR INSERT WITH CHECK (("auth"."uid"() = "company_id"));



CREATE POLICY "Companies can delete their specialists" ON "public"."profiles" FOR DELETE TO "authenticated" USING ((("company_id" IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."profiles" "company"
  WHERE (("company"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("company"."role" = 'COMPANY'::"text") AND ("company"."id" = "profiles"."company_id"))))));



CREATE POLICY "Companies can remove their own cities" ON "public"."company_cities" FOR DELETE USING (("auth"."uid"() = "company_id"));



CREATE POLICY "Companies can remove their own specializations" ON "public"."company_specializations" FOR DELETE USING (("auth"."uid"() = "company_id"));



CREATE POLICY "Companies can request verification" ON "public"."profiles" FOR UPDATE USING ((("auth"."uid"() = "id") AND ("role" = 'COMPANY'::"text") AND ("verification_status" = ANY (ARRAY['unverified'::"text", 'rejected'::"text"])))) WITH CHECK ((("auth"."uid"() = "id") AND ("role" = 'COMPANY'::"text") AND ("verification_status" = 'pending'::"text")));



CREATE POLICY "Companies can update join requests" ON "public"."access_requests" FOR UPDATE TO "authenticated" USING ((("company_id" IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = 'COMPANY'::"text") AND ("profiles"."id" = "access_requests"."company_id")))))) WITH CHECK ((("company_id" IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = 'COMPANY'::"text") AND ("profiles"."id" = "access_requests"."company_id"))))));



CREATE POLICY "Companies can update their specialists" ON "public"."profiles" FOR UPDATE TO "authenticated" USING ((("company_id" IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."profiles" "company"
  WHERE (("company"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("company"."role" = 'COMPANY'::"text") AND ("company"."id" = "profiles"."company_id")))))) WITH CHECK ((("company_id" IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."profiles" "company"
  WHERE (("company"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("company"."role" = 'COMPANY'::"text") AND ("company"."id" = "profiles"."company_id"))))));



CREATE POLICY "Companies can view join requests" ON "public"."access_requests" FOR SELECT TO "authenticated" USING ((("company_id" IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = 'COMPANY'::"text") AND ("profiles"."id" = "access_requests"."company_id"))))));



CREATE POLICY "Companies can view their specialists" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((("company_id" IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."profiles" "company"
  WHERE (("company"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("company"."role" = 'COMPANY'::"text") AND ("company"."id" = "profiles"."company_id"))))));



CREATE POLICY "Company admins can manage their specialists services" ON "public"."specialist_services" USING (("profile_id" IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE (("profiles"."company_id" = "auth"."uid"()) AND ("profiles"."role" = 'SPECIALIST'::"text"))))) WITH CHECK (("profile_id" IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE (("profiles"."company_id" = "auth"."uid"()) AND ("profiles"."role" = 'SPECIALIST'::"text")))));



CREATE POLICY "Company can insert their own translations" ON "public"."company_translations" FOR INSERT WITH CHECK ((("company_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['ADMIN'::"text", 'SUPER_ADMIN'::"text"])))))));



CREATE POLICY "Company can update their own translations" ON "public"."company_translations" FOR UPDATE USING ((("company_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['ADMIN'::"text", 'SUPER_ADMIN'::"text"])))))));



CREATE POLICY "Company can view their own translations" ON "public"."company_translations" FOR SELECT USING ((("company_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['ADMIN'::"text", 'SUPER_ADMIN'::"text"])))))));



CREATE POLICY "Enable delete for authenticated users only" ON "public"."practice_translations" FOR DELETE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable delete for authenticated users only" ON "public"."practices" FOR DELETE USING (("auth"."role"() = 'authenticated'::"text"));



COMMENT ON POLICY "Enable delete for authenticated users only" ON "public"."practices" IS 'Only authenticated users (admins) can delete practices';



CREATE POLICY "Enable delete for authenticated users only" ON "public"."service_translations" FOR DELETE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable delete for authenticated users only" ON "public"."services" FOR DELETE USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable insert for authenticated users only" ON "public"."practice_translations" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable insert for authenticated users only" ON "public"."practices" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



COMMENT ON POLICY "Enable insert for authenticated users only" ON "public"."practices" IS 'Only authenticated users (admins) can create new practices';



CREATE POLICY "Enable insert for authenticated users only" ON "public"."service_translations" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable insert for authenticated users only" ON "public"."services" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable read access for all users" ON "public"."practice_translations" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."practices" FOR SELECT USING (true);



COMMENT ON POLICY "Enable read access for all users" ON "public"."practices" IS 'Allows anyone to read practices (published and draft)';



CREATE POLICY "Enable read access for all users" ON "public"."service_translations" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."services" FOR SELECT USING (true);



CREATE POLICY "Enable update for authenticated users only" ON "public"."practice_translations" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text")) WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable update for authenticated users only" ON "public"."practices" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text")) WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



COMMENT ON POLICY "Enable update for authenticated users only" ON "public"."practices" IS 'Only authenticated users (admins) can update practices';



CREATE POLICY "Enable update for authenticated users only" ON "public"."service_translations" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text")) WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable update for authenticated users only" ON "public"."services" FOR UPDATE USING (("auth"."role"() = 'authenticated'::"text")) WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "News banners are viewable by everyone" ON "public"."news_banners" FOR SELECT USING (true);



CREATE POLICY "Public can read published legal page translations" ON "public"."legal_page_translations" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."legal_pages"
  WHERE (("legal_pages"."id" = "legal_page_translations"."legal_page_id") AND ("legal_pages"."status" = 'published'::"text")))));



CREATE POLICY "Public can read published legal pages" ON "public"."legal_pages" FOR SELECT USING (("status" = 'published'::"text"));



CREATE POLICY "Public can view active teams" ON "public"."teams" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Public can view all company translations" ON "public"."company_translations" FOR SELECT USING (true);



CREATE POLICY "Public can view public profile data" ON "public"."profiles" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Public can view team members" ON "public"."team_members" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."team_sections"
     JOIN "public"."teams" ON (("teams"."id" = "team_sections"."team_id")))
  WHERE (("team_sections"."id" = "team_members"."section_id") AND ("teams"."is_active" = true)))));



CREATE POLICY "Public can view team section translations" ON "public"."team_section_translations" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."team_sections"
     JOIN "public"."teams" ON (("teams"."id" = "team_sections"."team_id")))
  WHERE (("team_sections"."id" = "team_section_translations"."section_id") AND ("teams"."is_active" = true)))));



CREATE POLICY "Public can view team sections" ON "public"."team_sections" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."teams"
  WHERE (("teams"."id" = "team_sections"."team_id") AND ("teams"."is_active" = true)))));



CREATE POLICY "Public can view team translations" ON "public"."team_translations" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."teams"
  WHERE (("teams"."id" = "team_translations"."team_id") AND ("teams"."is_active" = true)))));



CREATE POLICY "Public read access for category translations" ON "public"."post_category_translations" FOR SELECT USING (true);



CREATE POLICY "Public read access for post categories" ON "public"."post_categories" FOR SELECT USING (true);



CREATE POLICY "Public read access for published post translations" ON "public"."post_translations" FOR SELECT USING (("post_id" IN ( SELECT "posts"."id"
   FROM "public"."posts"
  WHERE ("posts"."status" = 'published'::"text"))));



CREATE POLICY "Public read access for published posts" ON "public"."posts" FOR SELECT USING (("status" = 'published'::"text"));



CREATE POLICY "Public read access for published practice translations" ON "public"."practice_translations" FOR SELECT USING (("practice_id" IN ( SELECT "practices"."id"
   FROM "public"."practices"
  WHERE ("practices"."status" = 'published'::"text"))));



CREATE POLICY "Public read access for published practices" ON "public"."practices" FOR SELECT USING (("status" = 'published'::"text"));



CREATE POLICY "Public read access for specialist services" ON "public"."specialist_services" FOR SELECT USING (true);



CREATE POLICY "SOLO_SPECIALIST can view own profile" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((("auth"."uid"() = "id") AND ("role" = 'SOLO_SPECIALIST'::"text")));



CREATE POLICY "Solo specialists can manage their own services" ON "public"."specialist_services" USING (("profile_id" IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['SOLO_SPECIALIST'::"text", 'SPECIALIST'::"text"])))))) WITH CHECK (("profile_id" IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['SOLO_SPECIALIST'::"text", 'SPECIALIST'::"text"]))))));



CREATE POLICY "Solo specialists can update own profile" ON "public"."profiles" FOR UPDATE TO "authenticated" USING ((("auth"."uid"() = "id") AND ("role" = 'SOLO_SPECIALIST'::"text")));



CREATE POLICY "Solo specialists can view own profile" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((("auth"."uid"() = "id") AND ("role" = 'SOLO_SPECIALIST'::"text")));



CREATE POLICY "Specialist cities are viewable by everyone" ON "public"."specialist_cities" FOR SELECT USING (true);



CREATE POLICY "Specialists can add their own cities" ON "public"."specialist_cities" FOR INSERT WITH CHECK (((( SELECT "auth"."uid"() AS "uid") = "specialist_id") OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = 'SUPER_ADMIN'::"text"))))));



CREATE POLICY "Specialists can remove their own cities" ON "public"."specialist_cities" FOR DELETE USING (((( SELECT "auth"."uid"() AS "uid") = "specialist_id") OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = 'SUPER_ADMIN'::"text"))))));



CREATE POLICY "Specialists can request verification" ON "public"."profiles" FOR UPDATE USING ((("auth"."uid"() = "id") AND ("role" = 'SPECIALIST'::"text") AND ("verification_status" = ANY (ARRAY['unverified'::"text", 'rejected'::"text"])))) WITH CHECK ((("auth"."uid"() = "id") AND ("role" = 'SPECIALIST'::"text") AND ("verification_status" = 'pending'::"text")));



CREATE POLICY "Specializations are viewable by everyone" ON "public"."specializations" FOR SELECT USING (true);



CREATE POLICY "Super Admin and Moderator full access to post translations" ON "public"."post_translations" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['SUPER_ADMIN'::"text", 'MODERATOR'::"text"]))))));



CREATE POLICY "Super Admin and Moderator full access to posts" ON "public"."posts" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['SUPER_ADMIN'::"text", 'MODERATOR'::"text"]))))));



CREATE POLICY "Super Admin can delete legal page translations" ON "public"."legal_page_translations" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = 'SUPER_ADMIN'::"text")))));



CREATE POLICY "Super Admin can delete legal pages" ON "public"."legal_pages" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = 'SUPER_ADMIN'::"text")))));



CREATE POLICY "Super Admin can insert legal page translations" ON "public"."legal_page_translations" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = 'SUPER_ADMIN'::"text")))));



CREATE POLICY "Super Admin can insert legal pages" ON "public"."legal_pages" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = 'SUPER_ADMIN'::"text")))));



CREATE POLICY "Super Admin can read all legal page translations" ON "public"."legal_page_translations" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = 'SUPER_ADMIN'::"text")))));



CREATE POLICY "Super Admin can read all legal pages" ON "public"."legal_pages" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = 'SUPER_ADMIN'::"text")))));



CREATE POLICY "Super Admin can update legal page translations" ON "public"."legal_page_translations" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = 'SUPER_ADMIN'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = 'SUPER_ADMIN'::"text")))));



CREATE POLICY "Super Admin can update legal pages" ON "public"."legal_pages" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = 'SUPER_ADMIN'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = 'SUPER_ADMIN'::"text")))));



CREATE POLICY "Super Admin full access to categories" ON "public"."post_categories" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = 'SUPER_ADMIN'::"text")))));



CREATE POLICY "Super Admin full access to category translations" ON "public"."post_category_translations" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = 'SUPER_ADMIN'::"text")))));



CREATE POLICY "Super admins can manage team members" ON "public"."team_members" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'SUPER_ADMIN'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'SUPER_ADMIN'::"text")))));



CREATE POLICY "Super admins can manage team section translations" ON "public"."team_section_translations" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'SUPER_ADMIN'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'SUPER_ADMIN'::"text")))));



CREATE POLICY "Super admins can manage team sections" ON "public"."team_sections" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'SUPER_ADMIN'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'SUPER_ADMIN'::"text")))));



CREATE POLICY "Super admins can manage team translations" ON "public"."team_translations" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'SUPER_ADMIN'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'SUPER_ADMIN'::"text")))));



CREATE POLICY "Super admins can manage teams" ON "public"."teams" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'SUPER_ADMIN'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'SUPER_ADMIN'::"text")))));



CREATE POLICY "Super admins can update requests" ON "public"."access_requests" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'SUPER_ADMIN'::"text")))));



CREATE POLICY "Super admins have full access to access_requests" ON "public"."access_requests" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'SUPER_ADMIN'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'SUPER_ADMIN'::"text")))));



COMMENT ON POLICY "Super admins have full access to access_requests" ON "public"."access_requests" IS 'SUPER_ADMIN has unrestricted access to all access request operations';



CREATE POLICY "Super admins have full access to all profiles" ON "public"."profiles" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "profiles_1"
  WHERE (("profiles_1"."id" = "auth"."uid"()) AND ("profiles_1"."role" = 'SUPER_ADMIN'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "profiles_1"
  WHERE (("profiles_1"."id" = "auth"."uid"()) AND ("profiles_1"."role" = 'SUPER_ADMIN'::"text")))));



COMMENT ON POLICY "Super admins have full access to all profiles" ON "public"."profiles" IS 'SUPER_ADMIN role has unrestricted access to all profile operations including verification status changes';



CREATE POLICY "Super admins have full access to cities" ON "public"."cities" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'SUPER_ADMIN'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'SUPER_ADMIN'::"text")))));



CREATE POLICY "Super admins have full access to company_cities" ON "public"."company_cities" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'SUPER_ADMIN'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'SUPER_ADMIN'::"text")))));



CREATE POLICY "Super admins have full access to company_specializations" ON "public"."company_specializations" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'SUPER_ADMIN'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'SUPER_ADMIN'::"text")))));



CREATE POLICY "Super admins have full access to practice_translations" ON "public"."practice_translations" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'SUPER_ADMIN'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'SUPER_ADMIN'::"text")))));



CREATE POLICY "Super admins have full access to practices" ON "public"."practices" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'SUPER_ADMIN'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'SUPER_ADMIN'::"text")))));



COMMENT ON POLICY "Super admins have full access to practices" ON "public"."practices" IS 'SUPER_ADMIN has unrestricted access to all practices operations';



CREATE POLICY "Super admins have full access to service_translations" ON "public"."service_translations" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'SUPER_ADMIN'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'SUPER_ADMIN'::"text")))));



CREATE POLICY "Super admins have full access to services" ON "public"."services" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'SUPER_ADMIN'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'SUPER_ADMIN'::"text")))));



CREATE POLICY "Super admins have full access to specialist_cities" ON "public"."specialist_cities" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = 'SUPER_ADMIN'::"text")))));



CREATE POLICY "Super admins have full access to specialist_services" ON "public"."specialist_services" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'SUPER_ADMIN'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'SUPER_ADMIN'::"text")))));



CREATE POLICY "Super admins have full access to specializations" ON "public"."specializations" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'SUPER_ADMIN'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'SUPER_ADMIN'::"text")))));



CREATE POLICY "SuperAdmin can manage all messages" ON "public"."global_messages" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'SUPER_ADMIN'::"text")))));



CREATE POLICY "SuperAdmin can manage target roles" ON "public"."message_target_roles" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'SUPER_ADMIN'::"text")))));



CREATE POLICY "SuperAdmin can view all read statuses" ON "public"."user_read_messages" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'SUPER_ADMIN'::"text")))));



CREATE POLICY "Users can create own requests" ON "public"."access_requests" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can mark messages as read" ON "public"."user_read_messages" FOR INSERT WITH CHECK ((("auth"."uid"() = "user_id") AND (EXISTS ( SELECT 1
   FROM (("public"."global_messages" "gm"
     JOIN "public"."message_target_roles" "mtr" ON (("mtr"."message_id" = "gm"."id")))
     JOIN "public"."profiles" "p" ON (("p"."id" = "auth"."uid"())))
  WHERE (("gm"."id" = "user_read_messages"."message_id") AND ("mtr"."target_role" = "p"."role") AND ("gm"."is_active" = true) AND (("gm"."expires_at" IS NULL) OR ("gm"."expires_at" > "now"())))))));



CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "id")) WITH CHECK ((("auth"."uid"() = "id") AND (("role" = ( SELECT "profiles_1"."role"
   FROM "public"."profiles" "profiles_1"
  WHERE ("profiles_1"."id" = "auth"."uid"()))) OR ((( SELECT "profiles_1"."role"
   FROM "public"."profiles" "profiles_1"
  WHERE ("profiles_1"."id" = "auth"."uid"())) = 'USER'::"text") AND ("role" = 'SOLO_SPECIALIST'::"text")))));



COMMENT ON POLICY "Users can update their own profile" ON "public"."profiles" IS 'SECURITY: Users can update profile fields. Role changes are RESTRICTED: Only USER → SOLO_SPECIALIST self-upgrade allowed. All other role assignments (SPECIALIST, COMPANY, MODERATOR, SUPER_ADMIN, AUTHOR) require SUPER_ADMIN approval via access_requests table.';



CREATE POLICY "Users can view messages for their role" ON "public"."global_messages" FOR SELECT USING ((("is_active" = true) AND (("expires_at" IS NULL) OR ("expires_at" > "now"())) AND (EXISTS ( SELECT 1
   FROM ("public"."message_target_roles" "mtr"
     JOIN "public"."profiles" "p" ON (("p"."id" = "auth"."uid"())))
  WHERE (("mtr"."message_id" = "global_messages"."id") AND ("mtr"."target_role" = "p"."role"))))));



CREATE POLICY "Users can view own read status" ON "public"."user_read_messages" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own requests" ON "public"."access_requests" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view target roles for their messages" ON "public"."message_target_roles" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = "message_target_roles"."target_role")))));



CREATE POLICY "Verified users can create posts" ON "public"."posts" FOR INSERT TO "authenticated" WITH CHECK (((( SELECT "auth"."uid"() AS "uid") = "author_id") AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."role" = ANY (ARRAY['SPECIALIST'::"text", 'COMPANY'::"text", 'SOLO_SPECIALIST'::"text", 'AUTHOR'::"text", 'SUPER_ADMIN'::"text"])) AND (("profiles"."role" = ANY (ARRAY['SUPER_ADMIN'::"text", 'AUTHOR'::"text"])) OR (("profiles"."role" = ANY (ARRAY['SPECIALIST'::"text", 'SOLO_SPECIALIST'::"text", 'COMPANY'::"text"])) AND ("profiles"."verification_status" = 'verified'::"text")))))) AND ("status" = 'draft'::"text")));



COMMENT ON POLICY "Verified users can create posts" ON "public"."posts" IS 'Only verified specialists/solo specialists/companies or authors/super admins can create draft posts';



ALTER TABLE "public"."access_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."company_cities" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "company_manage_own_specialists_translations" ON "public"."specialist_translations" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "company"
  WHERE (("company"."id" = "auth"."uid"()) AND ("company"."role" = 'COMPANY'::"text") AND (EXISTS ( SELECT 1
           FROM "public"."profiles" "specialist"
          WHERE (("specialist"."id" = "specialist_translations"."specialist_id") AND ("specialist"."company_id" = "company"."id") AND ("specialist"."role" = 'SPECIALIST'::"text"))))))));



ALTER TABLE "public"."company_specializations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."company_translations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."global_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."legal_page_translations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."legal_pages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."message_target_roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."news_banners" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."post_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."post_category_translations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."post_display_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."post_translations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."posts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."practice_translations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."practices" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "public_read_all_translations" ON "public"."specialist_translations" FOR SELECT USING (true);



ALTER TABLE "public"."service_translations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."services" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."specialist_cities" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "specialist_read_own_translations" ON "public"."specialist_translations" FOR SELECT USING (("specialist_id" = "auth"."uid"()));



ALTER TABLE "public"."specialist_services" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."specialist_translations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."specializations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "super_admin_all_access_specialist_translations" ON "public"."specialist_translations" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'SUPER_ADMIN'::"text")))));



CREATE POLICY "super_admin_delete_profiles" ON "public"."profiles" FOR DELETE TO "authenticated" USING (("auth"."uid"() IN ( SELECT "profiles_1"."id"
   FROM "public"."profiles" "profiles_1"
  WHERE ("profiles_1"."role" = 'SUPER_ADMIN'::"text"))));



ALTER TABLE "public"."team_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."team_section_translations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."team_sections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."team_translations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."teams" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_read_messages" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."auto_draft_on_author_edit"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_draft_on_author_edit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_draft_on_author_edit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."auto_generate_category_slug"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_generate_category_slug"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_generate_category_slug"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_category_slug"("category_name" "text", "lang" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_category_slug"("category_name" "text", "lang" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_category_slug"("category_name" "text", "lang" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_message_read_stats"("p_message_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_message_read_stats"("p_message_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_message_read_stats"("p_message_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_message_target_count"("p_message_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_message_target_count"("p_message_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_message_target_count"("p_message_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_messages_for_user"("p_user_id" "uuid", "p_locale" "text", "p_include_read" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."get_messages_for_user"("p_user_id" "uuid", "p_locale" "text", "p_include_read" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_messages_for_user"("p_user_id" "uuid", "p_locale" "text", "p_include_read" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_unread_messages_count"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_unread_messages_count"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_unread_messages_count"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."mark_message_as_read"("p_user_id" "uuid", "p_message_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."mark_message_as_read"("p_user_id" "uuid", "p_message_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_message_as_read"("p_user_id" "uuid", "p_message_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_legal_pages_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_legal_pages_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_legal_pages_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_news_banners_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_news_banners_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_news_banners_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_specialist_translations_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_specialist_translations_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_specialist_translations_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON TABLE "public"."access_requests" TO "anon";
GRANT ALL ON TABLE "public"."access_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."access_requests" TO "service_role";



GRANT ALL ON TABLE "public"."post_translations" TO "anon";
GRANT ALL ON TABLE "public"."post_translations" TO "authenticated";
GRANT ALL ON TABLE "public"."post_translations" TO "service_role";



GRANT ALL ON TABLE "public"."posts" TO "anon";
GRANT ALL ON TABLE "public"."posts" TO "authenticated";
GRANT ALL ON TABLE "public"."posts" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT SELECT,UPDATE ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."author_posts_with_status" TO "anon";
GRANT ALL ON TABLE "public"."author_posts_with_status" TO "authenticated";
GRANT ALL ON TABLE "public"."author_posts_with_status" TO "service_role";



GRANT ALL ON TABLE "public"."cities" TO "anon";
GRANT ALL ON TABLE "public"."cities" TO "authenticated";
GRANT ALL ON TABLE "public"."cities" TO "service_role";



GRANT ALL ON TABLE "public"."company_cities" TO "anon";
GRANT ALL ON TABLE "public"."company_cities" TO "authenticated";
GRANT ALL ON TABLE "public"."company_cities" TO "service_role";



GRANT ALL ON TABLE "public"."company_specializations" TO "anon";
GRANT ALL ON TABLE "public"."company_specializations" TO "authenticated";
GRANT ALL ON TABLE "public"."company_specializations" TO "service_role";



GRANT ALL ON TABLE "public"."company_translations" TO "anon";
GRANT ALL ON TABLE "public"."company_translations" TO "authenticated";
GRANT ALL ON TABLE "public"."company_translations" TO "service_role";



GRANT ALL ON TABLE "public"."global_messages" TO "anon";
GRANT ALL ON TABLE "public"."global_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."global_messages" TO "service_role";



GRANT ALL ON TABLE "public"."legal_page_translations" TO "anon";
GRANT ALL ON TABLE "public"."legal_page_translations" TO "authenticated";
GRANT ALL ON TABLE "public"."legal_page_translations" TO "service_role";



GRANT ALL ON TABLE "public"."legal_pages" TO "anon";
GRANT ALL ON TABLE "public"."legal_pages" TO "authenticated";
GRANT ALL ON TABLE "public"."legal_pages" TO "service_role";



GRANT ALL ON TABLE "public"."message_target_roles" TO "anon";
GRANT ALL ON TABLE "public"."message_target_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."message_target_roles" TO "service_role";



GRANT ALL ON TABLE "public"."news_banners" TO "anon";
GRANT ALL ON TABLE "public"."news_banners" TO "authenticated";
GRANT ALL ON TABLE "public"."news_banners" TO "service_role";



GRANT ALL ON TABLE "public"."post_categories" TO "anon";
GRANT ALL ON TABLE "public"."post_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."post_categories" TO "service_role";



GRANT ALL ON TABLE "public"."post_category_translations" TO "anon";
GRANT ALL ON TABLE "public"."post_category_translations" TO "authenticated";
GRANT ALL ON TABLE "public"."post_category_translations" TO "service_role";



GRANT ALL ON TABLE "public"."post_display_settings" TO "anon";
GRANT ALL ON TABLE "public"."post_display_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."post_display_settings" TO "service_role";



GRANT ALL ON TABLE "public"."practice_translations" TO "anon";
GRANT ALL ON TABLE "public"."practice_translations" TO "authenticated";
GRANT ALL ON TABLE "public"."practice_translations" TO "service_role";



GRANT ALL ON TABLE "public"."practices" TO "anon";
GRANT ALL ON TABLE "public"."practices" TO "authenticated";
GRANT ALL ON TABLE "public"."practices" TO "service_role";



GRANT ALL ON TABLE "public"."service_translations" TO "anon";
GRANT ALL ON TABLE "public"."service_translations" TO "authenticated";
GRANT ALL ON TABLE "public"."service_translations" TO "service_role";



GRANT ALL ON TABLE "public"."services" TO "anon";
GRANT ALL ON TABLE "public"."services" TO "authenticated";
GRANT ALL ON TABLE "public"."services" TO "service_role";



GRANT ALL ON TABLE "public"."specialist_cities" TO "anon";
GRANT ALL ON TABLE "public"."specialist_cities" TO "authenticated";
GRANT ALL ON TABLE "public"."specialist_cities" TO "service_role";



GRANT ALL ON TABLE "public"."specialist_services" TO "anon";
GRANT ALL ON TABLE "public"."specialist_services" TO "authenticated";
GRANT ALL ON TABLE "public"."specialist_services" TO "service_role";



GRANT ALL ON TABLE "public"."specialist_translations" TO "anon";
GRANT ALL ON TABLE "public"."specialist_translations" TO "authenticated";
GRANT ALL ON TABLE "public"."specialist_translations" TO "service_role";



GRANT ALL ON TABLE "public"."specializations" TO "anon";
GRANT ALL ON TABLE "public"."specializations" TO "authenticated";
GRANT ALL ON TABLE "public"."specializations" TO "service_role";



GRANT ALL ON TABLE "public"."team_members" TO "anon";
GRANT ALL ON TABLE "public"."team_members" TO "authenticated";
GRANT ALL ON TABLE "public"."team_members" TO "service_role";



GRANT ALL ON TABLE "public"."team_section_translations" TO "anon";
GRANT ALL ON TABLE "public"."team_section_translations" TO "authenticated";
GRANT ALL ON TABLE "public"."team_section_translations" TO "service_role";



GRANT ALL ON TABLE "public"."team_sections" TO "anon";
GRANT ALL ON TABLE "public"."team_sections" TO "authenticated";
GRANT ALL ON TABLE "public"."team_sections" TO "service_role";



GRANT ALL ON TABLE "public"."team_translations" TO "anon";
GRANT ALL ON TABLE "public"."team_translations" TO "authenticated";
GRANT ALL ON TABLE "public"."team_translations" TO "service_role";



GRANT ALL ON TABLE "public"."teams" TO "anon";
GRANT ALL ON TABLE "public"."teams" TO "authenticated";
GRANT ALL ON TABLE "public"."teams" TO "service_role";



GRANT ALL ON TABLE "public"."user_read_messages" TO "anon";
GRANT ALL ON TABLE "public"."user_read_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."user_read_messages" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







