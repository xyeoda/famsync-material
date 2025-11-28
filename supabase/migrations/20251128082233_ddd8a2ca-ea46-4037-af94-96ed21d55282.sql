-- Create function to check if any site admin exists (safe for public use)
CREATE OR REPLACE FUNCTION public.admin_exists()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.system_roles WHERE role = 'site_admin'
  )
$$;

-- Grant execute permission to everyone (including unauthenticated)
GRANT EXECUTE ON FUNCTION public.admin_exists() TO anon, authenticated;