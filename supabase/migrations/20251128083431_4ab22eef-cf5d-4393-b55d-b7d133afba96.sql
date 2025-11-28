-- Fix user_roles RLS policy to allow accepting invitations
-- The existing policy requires users to already be parents to insert roles,
-- but new users accepting invitations don't have roles yet.

-- Add policy to allow users to insert their own role when they have a valid pending invitation
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
      AND pending_invitations.email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND pending_invitations.role = user_roles.role
      AND pending_invitations.expires_at > now()
  )
);