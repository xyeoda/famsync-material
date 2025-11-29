-- Enable realtime for email_tracking table
ALTER TABLE public.email_tracking REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.email_tracking;