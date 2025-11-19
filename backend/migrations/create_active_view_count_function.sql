-- Create PostgreSQL function for efficient active view counting
-- This solves the N+1 problem by using GROUP BY aggregation in the database

CREATE OR REPLACE FUNCTION get_active_view_counts(post_ids UUID[])
RETURNS TABLE (
    post_id UUID,
    count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        pav.post_id,
        COUNT(*) as count
    FROM product_active_views pav
    WHERE pav.post_id = ANY(post_ids)
    GROUP BY pav.post_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_active_view_counts(UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_view_counts(UUID[]) TO anon;

-- Example usage:
-- SELECT * FROM get_active_view_counts(ARRAY['uuid1'::uuid, 'uuid2'::uuid, 'uuid3'::uuid]);
