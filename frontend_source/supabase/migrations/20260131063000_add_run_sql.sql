-- Create run_sql function for administrative tasks and introspection
-- Access is restricted to service_role only for security.
CREATE OR REPLACE FUNCTION public.run_sql(query_text text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE result jsonb;
BEGIN -- Execute the query and return the result as JSON
EXECUTE 'SELECT jsonb_agg(row_to_json(t)) FROM (' || query_text || ') t' INTO result;
-- Return empty array if result is null (no rows)
IF result IS NULL THEN result := '[]'::jsonb;
END IF;
RETURN result;
EXCEPTION
WHEN OTHERS THEN -- Return the error message as a JSON object
RETURN jsonb_build_object('error', SQLERRM);
END;
$$;
-- Revoke execute from public/anon/authenticated to be safe
REVOKE EXECUTE ON FUNCTION public.run_sql(text)
FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.run_sql(text)
FROM anon;
REVOKE EXECUTE ON FUNCTION public.run_sql(text)
FROM authenticated;
-- Grant execute only to service_role
GRANT EXECUTE ON FUNCTION public.run_sql(text) TO service_role;