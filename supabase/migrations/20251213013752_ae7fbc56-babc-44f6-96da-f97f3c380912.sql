-- Rate limiting trigger for access requests
-- Enforces 24-hour cooldown per email at database level (cannot be bypassed)

CREATE OR REPLACE FUNCTION public.check_access_request_rate_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.access_requests
    WHERE LOWER(requester_email) = LOWER(NEW.requester_email)
    AND created_at > NOW() - INTERVAL '24 hours'
  ) THEN
    RAISE EXCEPTION 'Rate limit exceeded: You have already submitted a request within the last 24 hours.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS enforce_access_request_rate_limit ON public.access_requests;

CREATE TRIGGER enforce_access_request_rate_limit
BEFORE INSERT ON public.access_requests
FOR EACH ROW
EXECUTE FUNCTION public.check_access_request_rate_limit();