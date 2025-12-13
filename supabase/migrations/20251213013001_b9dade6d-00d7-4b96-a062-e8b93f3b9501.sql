-- Security Fix: Remove parent access to email_tracking, only site admins should see
DROP POLICY IF EXISTS "Parents can view email tracking in their household" ON public.email_tracking;