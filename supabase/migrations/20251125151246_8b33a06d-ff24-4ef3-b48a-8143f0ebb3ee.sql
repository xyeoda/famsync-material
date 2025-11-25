-- Drop the trigger that auto-creates households
-- We'll let the create-admin edge function handle this with custom names
DROP TRIGGER IF EXISTS on_profile_created_create_household ON public.profiles;
DROP FUNCTION IF EXISTS public.create_household_for_user() CASCADE;