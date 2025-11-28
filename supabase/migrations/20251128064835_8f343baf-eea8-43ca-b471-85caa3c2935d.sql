-- Allow anonymous users to read pending invitations by token
CREATE POLICY "Anyone can view invitations by token"
  ON public.pending_invitations
  FOR SELECT
  USING (true);
