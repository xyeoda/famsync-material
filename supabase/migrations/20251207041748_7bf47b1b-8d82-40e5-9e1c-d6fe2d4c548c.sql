-- Fix PUBLIC_DATA_EXPOSURE on activity_locations table
-- Replace permissive "Anyone can view locations by household" with proper membership check
DROP POLICY IF EXISTS "Anyone can view locations by household" ON public.activity_locations;

CREATE POLICY "Household members can view locations"
ON public.activity_locations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.household_id = activity_locations.household_id
  )
);

-- Fix PUBLIC_DATA_EXPOSURE on family_events table
DROP POLICY IF EXISTS "Anyone can view events by household" ON public.family_events;

CREATE POLICY "Household members can view events"
ON public.family_events
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.household_id = family_events.household_id
  )
);

-- Fix PUBLIC_DATA_EXPOSURE on event_instances table
DROP POLICY IF EXISTS "Anyone can view instances by household" ON public.event_instances;

CREATE POLICY "Household members can view instances"
ON public.event_instances
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.household_id = event_instances.household_id
  )
);

-- Fix PUBLIC_DATA_EXPOSURE on family_settings table
DROP POLICY IF EXISTS "Anyone can view settings by household" ON public.family_settings;

CREATE POLICY "Household members can view settings"
ON public.family_settings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.household_id = family_settings.household_id
  )
);