-- Enable pg_net extension for HTTP requests from triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create trigger function to notify admins of new access requests
CREATE OR REPLACE FUNCTION public.notify_admin_on_access_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  supabase_url text;
  service_role_key text;
BEGIN
  -- Get environment variables
  supabase_url := current_setting('app.settings.supabase_url', true);
  service_role_key := current_setting('app.settings.service_role_key', true);
  
  -- If settings not available, try to get from vault or use hardcoded project URL
  IF supabase_url IS NULL OR supabase_url = '' THEN
    supabase_url := 'https://cxiceumycfzofrrbwgwr.supabase.co';
  END IF;

  -- Call the edge function via pg_net (fire and forget)
  PERFORM net.http_post(
    url := supabase_url || '/functions/v1/notify-admin-access-request',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE(service_role_key, current_setting('supabase.service_role_key', true))
    ),
    body := jsonb_build_object(
      'id', NEW.id,
      'household_name', NEW.household_name,
      'requester_name', NEW.requester_name,
      'requester_email', NEW.requester_email,
      'message', NEW.message
    )
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the insert
    RAISE WARNING 'Failed to send admin notification: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Create trigger on access_requests table
DROP TRIGGER IF EXISTS trigger_notify_admin_on_access_request ON public.access_requests;
CREATE TRIGGER trigger_notify_admin_on_access_request
  AFTER INSERT ON public.access_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_on_access_request();