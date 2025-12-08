-- Fix PUBLIC_DATA_EXPOSURE: Household Names and Owner IDs Publicly Visible
-- Drop the overly permissive policy that exposes all household data
DROP POLICY IF EXISTS "Anyone can view households by ID" ON public.households;

-- Create a proper policy requiring authenticated household membership
CREATE POLICY "Household members can view their household"
ON public.households FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.household_id = households.id
  )
  OR auth.uid() = owner_id
  OR is_site_admin(auth.uid())
);

-- Fix PUBLIC_DATA_EXPOSURE: User-Household Relationships Publicly Visible
-- Drop the overly permissive policy that exposes all user role assignments
DROP POLICY IF EXISTS "Anyone can view roles by household" ON public.user_roles;