CREATE OR REPLACE FUNCTION public.get_server_time() RETURNS timestamp with time zone LANGUAGE sql SECURITY DEFINER AS $$
SELECT NOW();
$$;