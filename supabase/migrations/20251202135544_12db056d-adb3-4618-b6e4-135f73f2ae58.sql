-- Drop the overly permissive policy that exposes invitation tokens to all users
-- Token lookup happens in edge functions using service role, so client-side SELECT is unnecessary
DROP POLICY IF EXISTS "Anyone can view invitations by token" ON pending_invitations;