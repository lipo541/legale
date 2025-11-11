-- Fix ambiguous column reference in get_messages_for_user function
-- Change return column name from 'id' to 'message_id' to avoid ambiguity

DROP FUNCTION IF EXISTS public.get_messages_for_user(UUID, TEXT, BOOLEAN);

CREATE OR REPLACE FUNCTION public.get_messages_for_user(
  p_user_id UUID,
  p_locale TEXT DEFAULT 'ka',
  p_include_read BOOLEAN DEFAULT true
)
RETURNS TABLE (
  message_id UUID,
  title TEXT,
  content TEXT,
  priority TEXT,
  created_at TIMESTAMPTZ,
  is_read BOOLEAN,
  read_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
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

COMMENT ON FUNCTION public.get_messages_for_user IS 'Returns all messages for a user in specified locale, optionally filtered by read status';

GRANT EXECUTE ON FUNCTION public.get_messages_for_user TO authenticated;
