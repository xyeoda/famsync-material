-- Create households table
CREATE TABLE public.households (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on households
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;

-- Households policies
CREATE POLICY "Anyone can view households by ID"
  ON public.households
  FOR SELECT
  USING (true);

CREATE POLICY "Owners can insert their household"
  ON public.households
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their household"
  ON public.households
  FOR UPDATE
  USING (auth.uid() = owner_id);

-- Add household_id to family_settings
ALTER TABLE public.family_settings 
  ADD COLUMN household_id uuid REFERENCES public.households(id) ON DELETE CASCADE;

-- Add household_id to family_events
ALTER TABLE public.family_events 
  ADD COLUMN household_id uuid REFERENCES public.households(id) ON DELETE CASCADE;

-- Add household_id to event_instances
ALTER TABLE public.event_instances 
  ADD COLUMN household_id uuid REFERENCES public.households(id) ON DELETE CASCADE;

-- Function to create household for new user
CREATE OR REPLACE FUNCTION public.create_household_for_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_household_id uuid;
BEGIN
  -- Create household for the new user
  INSERT INTO public.households (owner_id, name)
  VALUES (NEW.id, 'My Family')
  RETURNING id INTO new_household_id;
  
  -- Update the family_settings with the household_id
  UPDATE public.family_settings
  SET household_id = new_household_id
  WHERE user_id = NEW.id;
  
  RETURN NEW;
END;
$$;

-- Trigger to create household after profile is created
CREATE TRIGGER on_profile_created_create_household
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_household_for_user();

-- Update RLS policies for family_settings
DROP POLICY IF EXISTS "Users can view own settings" ON public.family_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON public.family_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON public.family_settings;

CREATE POLICY "Anyone can view settings by household"
  ON public.family_settings
  FOR SELECT
  USING (household_id IS NOT NULL);

CREATE POLICY "Users can insert own settings"
  ON public.family_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON public.family_settings
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Update RLS policies for family_events
DROP POLICY IF EXISTS "Users can view own events" ON public.family_events;
DROP POLICY IF EXISTS "Users can insert own events" ON public.family_events;
DROP POLICY IF EXISTS "Users can update own events" ON public.family_events;
DROP POLICY IF EXISTS "Users can delete own events" ON public.family_events;

CREATE POLICY "Anyone can view events by household"
  ON public.family_events
  FOR SELECT
  USING (household_id IS NOT NULL);

CREATE POLICY "Users can insert own events"
  ON public.family_events
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own events"
  ON public.family_events
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own events"
  ON public.family_events
  FOR DELETE
  USING (auth.uid() = user_id);

-- Update RLS policies for event_instances
DROP POLICY IF EXISTS "Users can view own instances" ON public.event_instances;
DROP POLICY IF EXISTS "Users can insert own instances" ON public.event_instances;
DROP POLICY IF EXISTS "Users can update own instances" ON public.event_instances;
DROP POLICY IF EXISTS "Users can delete own instances" ON public.event_instances;

CREATE POLICY "Anyone can view instances by household"
  ON public.event_instances
  FOR SELECT
  USING (household_id IS NOT NULL);

CREATE POLICY "Users can insert own instances"
  ON public.event_instances
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own instances"
  ON public.event_instances
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own instances"
  ON public.event_instances
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add trigger for households updated_at
CREATE TRIGGER update_households_updated_at
  BEFORE UPDATE ON public.households
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();