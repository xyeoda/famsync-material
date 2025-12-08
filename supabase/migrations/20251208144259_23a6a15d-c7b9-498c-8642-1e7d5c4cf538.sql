-- Fix pending_invitations_token_exposure: Restrict token visibility to invitation creator only
-- Drop the overly permissive ALL policy that exposes tokens to all parents
DROP POLICY IF EXISTS "Parents can manage invitations in their household" ON public.pending_invitations;

-- SELECT: Only the invitation creator can view their invitations (protects tokens)
CREATE POLICY "Inviters can view their own invitations"
ON public.pending_invitations FOR SELECT
USING (auth.uid() = invited_by);

-- INSERT: Parents can create invitations in their household
CREATE POLICY "Parents can create invitations in their household"
ON public.pending_invitations FOR INSERT
WITH CHECK (is_parent_in_household(auth.uid(), household_id) AND auth.uid() = invited_by);

-- UPDATE: Only the invitation creator can update their invitations
CREATE POLICY "Inviters can update their own invitations"
ON public.pending_invitations FOR UPDATE
USING (auth.uid() = invited_by);

-- DELETE: Only the invitation creator can delete their invitations
CREATE POLICY "Inviters can delete their own invitations"
ON public.pending_invitations FOR DELETE
USING (auth.uid() = invited_by);