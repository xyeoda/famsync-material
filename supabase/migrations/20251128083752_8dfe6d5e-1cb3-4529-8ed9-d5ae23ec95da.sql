-- Fix the RLS policy to use auth.email() instead of querying auth.users
-- The previous policy failed because auth.users table isn't accessible in RLS

DROP POLICY IF EXISTS "Users can insert their own role with valid invitation" ON public.user_roles;

CREATE POLICY "Users can insert their own role with valid invitation"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 
    FROM public.pending_invitations 
    WHERE pending_invitations.household_id = user_roles.household_id
      AND pending_invitations.email = auth.email()
      AND pending_invitations.role = user_roles.role
      AND pending_invitations.expires_at > now()
  )
);