-- Create RPC function to perform automatic data cleanup efficiently in a single query
CREATE OR REPLACE FUNCTION run_automatic_cleanup()
RETURNS TABLE (
  user_id UUID,
  conversation_id UUID,
  deleted_count INT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  setting RECORD;
  cutoff_date TIMESTAMP WITH TIME ZONE;
  total_deleted INT;
  learning_deleted INT;
  filters_deleted INT;
  sessions_deleted INT;
BEGIN
  -- Process each user with auto_delete_enabled and consent_given = true
  FOR setting IN
    SELECT ps.user_id, ps.conversation_id, ps.data_retention_days
    FROM privacy_settings ps
    WHERE ps.auto_delete_enabled = true AND ps.consent_given = true
  LOOP
    cutoff_date := NOW() - (setting.data_retention_days || ' days')::INTERVAL;
    total_deleted := 0;

    -- Delete old learning data
    WITH deleted AS (
      DELETE FROM user_feedback_learning ufl
      WHERE ufl.user_id = setting.user_id
        AND ufl.created_at < cutoff_date
      RETURNING 1
    )
    SELECT COUNT(*) INTO learning_deleted FROM deleted;
    total_deleted := total_deleted + learning_deleted;

    -- Delete old adaptive filters
    WITH deleted AS (
      DELETE FROM adaptive_filters af
      WHERE af.user_id = setting.user_id
        AND af.created_at < cutoff_date
      RETURNING 1
    )
    SELECT COUNT(*) INTO filters_deleted FROM deleted;
    total_deleted := total_deleted + filters_deleted;

    -- Delete old search sessions
    WITH deleted AS (
      DELETE FROM search_sessions ss
      WHERE ss.user_id = setting.user_id
        AND ss.created_at < cutoff_date
      RETURNING 1
    )
    SELECT COUNT(*) INTO sessions_deleted FROM deleted;
    total_deleted := total_deleted + sessions_deleted;

    -- Add to output table if anything was deleted
    IF total_deleted > 0 THEN
      user_id := setting.user_id;
      conversation_id := setting.conversation_id;
      deleted_count := total_deleted;
      RETURN NEXT;
    END IF;
  END LOOP;
END;
$$;
