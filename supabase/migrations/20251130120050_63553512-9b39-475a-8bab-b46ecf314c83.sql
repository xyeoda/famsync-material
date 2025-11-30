-- Create activity_locations table
CREATE TABLE public.activity_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  phone_secondary TEXT,
  email TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.activity_locations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for activity_locations
CREATE POLICY "Anyone can view locations by household"
ON public.activity_locations
FOR SELECT
USING (household_id IS NOT NULL);

CREATE POLICY "Parents can insert locations in their household"
ON public.activity_locations
FOR INSERT
WITH CHECK (is_parent_in_household(auth.uid(), household_id));

CREATE POLICY "Parents can update locations in their household"
ON public.activity_locations
FOR UPDATE
USING (is_parent_in_household(auth.uid(), household_id));

CREATE POLICY "Parents can delete locations in their household"
ON public.activity_locations
FOR DELETE
USING (is_parent_in_household(auth.uid(), household_id));

-- Add location_id to family_events table
ALTER TABLE public.family_events
ADD COLUMN location_id UUID REFERENCES public.activity_locations(id) ON DELETE SET NULL;

-- Create trigger for updated_at
CREATE TRIGGER update_activity_locations_updated_at
BEFORE UPDATE ON public.activity_locations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();