-- Create app_role enum for family member roles
CREATE TYPE public.app_role AS ENUM ('parent', 'helper', 'kid');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, household_id)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Anyone can view roles by household (needed for display mode)
CREATE POLICY "Anyone can view roles by household"
  ON public.user_roles
  FOR SELECT
  USING (true);

-- Only parents can insert/update/delete roles in their household
CREATE POLICY "Parents can manage roles in their household"
  ON public.user_roles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.household_id = user_roles.household_id
        AND ur.role = 'parent'
    )
  );

-- Create security definer function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _household_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND household_id = _household_id
      AND role = _role
  )
$$;

-- Create function to check if user is a parent in any household
CREATE OR REPLACE FUNCTION public.is_parent_in_household(_user_id uuid, _household_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND household_id = _household_id
      AND role = 'parent'
  )
$$;

-- Function to automatically assign parent role to household creator
CREATE OR REPLACE FUNCTION public.assign_parent_role_to_creator()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Assign parent role to the household creator
  INSERT INTO public.user_roles (user_id, household_id, role)
  VALUES (NEW.owner_id, NEW.id, 'parent');
  
  RETURN NEW;
END;
$$;

-- Trigger to assign parent role when household is created
CREATE TRIGGER on_household_created_assign_parent
  AFTER INSERT ON public.households
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_parent_role_to_creator();

-- Update RLS policies for family_events to check parent role for write operations
DROP POLICY IF EXISTS "Users can insert own events" ON public.family_events;
DROP POLICY IF EXISTS "Users can update own events" ON public.family_events;
DROP POLICY IF EXISTS "Users can delete own events" ON public.family_events;

CREATE POLICY "Parents can insert events in their household"
  ON public.family_events
  FOR INSERT
  WITH CHECK (
    public.is_parent_in_household(auth.uid(), household_id)
  );

CREATE POLICY "Parents can update events in their household"
  ON public.family_events
  FOR UPDATE
  USING (
    public.is_parent_in_household(auth.uid(), household_id)
  );

CREATE POLICY "Parents can delete events in their household"
  ON public.family_events
  FOR DELETE
  USING (
    public.is_parent_in_household(auth.uid(), household_id)
  );

-- Update RLS policies for event_instances
DROP POLICY IF EXISTS "Users can insert own instances" ON public.event_instances;
DROP POLICY IF EXISTS "Users can update own instances" ON public.event_instances;
DROP POLICY IF EXISTS "Users can delete own instances" ON public.event_instances;

CREATE POLICY "Parents can insert instances in their household"
  ON public.event_instances
  FOR INSERT
  WITH CHECK (
    public.is_parent_in_household(auth.uid(), household_id)
  );

CREATE POLICY "Parents can update instances in their household"
  ON public.event_instances
  FOR UPDATE
  USING (
    public.is_parent_in_household(auth.uid(), household_id)
  );

CREATE POLICY "Parents can delete instances in their household"
  ON public.event_instances
  FOR DELETE
  USING (
    public.is_parent_in_household(auth.uid(), household_id)
  );

-- Update RLS policies for family_settings
DROP POLICY IF EXISTS "Users can insert own settings" ON public.family_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON public.family_settings;

CREATE POLICY "Parents can insert settings in their household"
  ON public.family_settings
  FOR INSERT
  WITH CHECK (
    public.is_parent_in_household(auth.uid(), household_id)
  );

CREATE POLICY "Parents can update settings in their household"
  ON public.family_settings
  FOR UPDATE
  USING (
    public.is_parent_in_household(auth.uid(), household_id)
  );

-- Create pending_invitations table for email invites
CREATE TABLE public.pending_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  email text NOT NULL,
  role app_role NOT NULL,
  invited_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(household_id, email)
);

-- Enable RLS on pending_invitations
ALTER TABLE public.pending_invitations ENABLE ROW LEVEL SECURITY;

-- Parents can view and manage invitations in their household
CREATE POLICY "Parents can manage invitations in their household"
  ON public.pending_invitations
  FOR ALL
  USING (
    public.is_parent_in_household(auth.uid(), household_id)
  );

-- Add trigger for updated_at on user_roles
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add must_change_password field to profiles for first-time login
ALTER TABLE public.profiles
  ADD COLUMN must_change_password boolean DEFAULT false;