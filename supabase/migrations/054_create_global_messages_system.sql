-- ============================================================================
-- Global Messages System
-- ============================================================================
-- SuperAdmin-ს შეეძლება გაგზავნოს global შეტყობინებები სხვადასხვა როლებზე
-- Message მიდის მომხმარებლებთან მათი role-ის მიხედვით
-- შეტყობინებები არის multilingual (ka, en, ru)
-- ============================================================================

-- ============================================================================
-- 1. global_messages - მთავარი შეტყობინებების ცხრილი
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.global_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- შეტყობინების შინაარსი სამ ენაზე
  title_ka TEXT NOT NULL,
  title_en TEXT NOT NULL,
  title_ru TEXT NOT NULL,
  
  content_ka TEXT NOT NULL,
  content_en TEXT NOT NULL,
  content_ru TEXT NOT NULL,
  
  -- მეტა ინფორმაცია
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ -- Optional: შეტყობინება შეიძლება ვადა გავიდეს
);

-- Indexes
CREATE INDEX idx_global_messages_created_by ON public.global_messages(created_by);
CREATE INDEX idx_global_messages_created_at ON public.global_messages(created_at DESC);
CREATE INDEX idx_global_messages_is_active ON public.global_messages(is_active);
CREATE INDEX idx_global_messages_expires_at ON public.global_messages(expires_at) WHERE expires_at IS NOT NULL;

-- Comment
COMMENT ON TABLE public.global_messages IS 'Global messages sent by SuperAdmin to specific user roles';
COMMENT ON COLUMN public.global_messages.priority IS 'Message priority: low, normal, high, urgent';
COMMENT ON COLUMN public.global_messages.expires_at IS 'Optional expiration date for the message';


-- ============================================================================
-- 2. message_target_roles - რომელ როლებს ეგზავნება შეტყობინება
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.message_target_roles (
  message_id UUID NOT NULL REFERENCES public.global_messages(id) ON DELETE CASCADE,
  target_role TEXT NOT NULL CHECK (target_role IN (
    'USER',
    'AUTHOR', 
    'SPECIALIST', 
    'SOLO_SPECIALIST', 
    'COMPANY', 
    'MODERATOR'
    -- SUPER_ADMIN არ შედის, რადგან ისინი აგზავნიან შეტყობინებებს
  )),
  
  PRIMARY KEY (message_id, target_role)
);

-- Indexes
CREATE INDEX idx_message_target_roles_message ON public.message_target_roles(message_id);
CREATE INDEX idx_message_target_roles_role ON public.message_target_roles(target_role);

-- Comment
COMMENT ON TABLE public.message_target_roles IS 'Defines which user roles should receive each global message';


-- ============================================================================
-- 3. user_read_messages - ვინ წაიკითხა რა შეტყობინება
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_read_messages (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES public.global_messages(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  PRIMARY KEY (user_id, message_id)
);

-- Indexes
CREATE INDEX idx_user_read_messages_user ON public.user_read_messages(user_id);
CREATE INDEX idx_user_read_messages_message ON public.user_read_messages(message_id);
CREATE INDEX idx_user_read_messages_read_at ON public.user_read_messages(read_at DESC);

-- Comment
COMMENT ON TABLE public.user_read_messages IS 'Tracks which users have read which messages';


-- ============================================================================
-- 4. RLS Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.global_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_target_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_read_messages ENABLE ROW LEVEL SECURITY;


-- ============================================================================
-- 4.1 global_messages RLS Policies
-- ============================================================================

-- SuperAdmin-ს შეუძლია ყველაფერი
CREATE POLICY "SuperAdmin can manage all messages"
  ON public.global_messages
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
    )
  );

-- მომხმარებლებს ხედავთ მხოლოდ აქტიურ შეტყობინებებს რომლებიც მათთვისაა განკუთვნილი
CREATE POLICY "Users can view messages for their role"
  ON public.global_messages
  FOR SELECT
  USING (
    is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
    AND EXISTS (
      SELECT 1 FROM public.message_target_roles mtr
      INNER JOIN public.profiles p ON p.id = auth.uid()
      WHERE mtr.message_id = global_messages.id
        AND mtr.target_role = p.role
    )
  );


-- ============================================================================
-- 4.2 message_target_roles RLS Policies
-- ============================================================================

-- SuperAdmin-ს შეუძლია ყველაფერი
CREATE POLICY "SuperAdmin can manage target roles"
  ON public.message_target_roles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
    )
  );

-- მომხმარებლებს ხედავთ target roles მხოლოდ იმ შეტყობინებებისთვის რომლებიც მათთვისაა
CREATE POLICY "Users can view target roles for their messages"
  ON public.message_target_roles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
        AND p.role = message_target_roles.target_role
    )
  );


-- ============================================================================
-- 4.3 user_read_messages RLS Policies
-- ============================================================================

-- SuperAdmin-ს ხედავს ყველაფერს
CREATE POLICY "SuperAdmin can view all read statuses"
  ON public.user_read_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
    )
  );

-- მომხმარებლებს ხედავთ საკუთარ read status-ს
CREATE POLICY "Users can view own read status"
  ON public.user_read_messages
  FOR SELECT
  USING (auth.uid() = user_id);

-- მომხმარებლებს შეუძლიათ მონიშვნონ შეტყობინება წაკითხულად
CREATE POLICY "Users can mark messages as read"
  ON public.user_read_messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      -- შეამოწმე რომ შეტყობინება ნამდვილად ამ მომხმარებლისთვისაა
      SELECT 1 FROM public.global_messages gm
      INNER JOIN public.message_target_roles mtr ON mtr.message_id = gm.id
      INNER JOIN public.profiles p ON p.id = auth.uid()
      WHERE gm.id = user_read_messages.message_id
        AND mtr.target_role = p.role
        AND gm.is_active = true
        AND (gm.expires_at IS NULL OR gm.expires_at > NOW())
    )
  );


-- ============================================================================
-- 5. Helper Functions
-- ============================================================================

-- ============================================================================
-- 5.1 Function: get_unread_messages_count
-- აბრუნებს წაუკითხავი შეტყობინებების რაოდენობას მომხმარებლისთვის
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_unread_messages_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
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

COMMENT ON FUNCTION public.get_unread_messages_count IS 'Returns count of unread messages for a user based on their role';


-- ============================================================================
-- 5.2 Function: mark_message_as_read
-- მონიშნავს შეტყობინებას წაკითხულად
-- ============================================================================
CREATE OR REPLACE FUNCTION public.mark_message_as_read(
  p_user_id UUID,
  p_message_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
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

COMMENT ON FUNCTION public.mark_message_as_read IS 'Marks a message as read for a specific user';


-- ============================================================================
-- 5.3 Function: get_messages_for_user
-- აბრუნებს ყველა შეტყობინებას მომხმარებლისთვის
-- ============================================================================
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


-- ============================================================================
-- 5.4 Trigger: Auto update updated_at
-- ============================================================================
CREATE TRIGGER update_global_messages_updated_at
  BEFORE UPDATE ON public.global_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();


-- ============================================================================
-- 6. Grant Permissions
-- ============================================================================

-- Grant execute permissions on functions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_unread_messages_count TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_message_as_read TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_messages_for_user TO authenticated;

