-- Add function to get message read statistics
-- Shows who has read a specific message

CREATE OR REPLACE FUNCTION public.get_message_read_stats(p_message_id UUID)
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  email TEXT,
  role TEXT,
  read_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
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

COMMENT ON FUNCTION public.get_message_read_stats IS 'Returns list of users who have read a specific message with their details';

GRANT EXECUTE ON FUNCTION public.get_message_read_stats TO authenticated;


-- Add function to get total target users count for a message
CREATE OR REPLACE FUNCTION public.get_message_target_count(p_message_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
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

COMMENT ON FUNCTION public.get_message_target_count IS 'Returns total count of users who should receive this message based on their role';

GRANT EXECUTE ON FUNCTION public.get_message_target_count TO authenticated;
