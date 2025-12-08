-- Fix profiles_email_exposure: Restrict profile visibility to parents only
-- Drop the overly permissive household-wide visibility policy
DROP POLICY IF EXISTS "Users can view profiles in same household" ON public.profiles;

-- Create a more restrictive policy: Only parents can see other household members' profiles
CREATE POLICY "Parents can view profiles in same household"
ON public.profiles FOR SELECT
USING (
  id = auth.uid() -- Users can always see their own profile
  OR EXISTS (
    -- User must be a parent AND target profile is in a shared household
    SELECT 1 FROM public.user_roles ur_viewer
    JOIN public.user_roles ur_target ON ur_viewer.household_id = ur_target.household_id
    WHERE ur_viewer.user_id = auth.uid()
    AND ur_viewer.role = 'parent'
    AND ur_target.user_id = profiles.id
  )
);