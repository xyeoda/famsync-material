-- Create member_type enum
CREATE TYPE public.member_type AS ENUM ('parent', 'kid', 'helper');

-- Create helper_category enum
CREATE TYPE public.helper_category AS ENUM ('grandparent', 'nanny', 'housekeeper', 'babysitter', 'au_pair', 'other');

-- Create family_members table
CREATE TABLE public.family_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL DEFAULT '217 91% 60%',
  member_type member_type NOT NULL,
  helper_category helper_category,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_family_members_household ON public.family_members(household_id);

-- Enable RLS
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Household members can view family members"
ON public.family_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.household_id = family_members.household_id
  )
);

CREATE POLICY "Parents can insert family members"
ON public.family_members FOR INSERT
WITH CHECK (is_parent_in_household(auth.uid(), household_id));

CREATE POLICY "Parents can update family members"
ON public.family_members FOR UPDATE
USING (is_parent_in_household(auth.uid(), household_id));

CREATE POLICY "Parents can delete family members"
ON public.family_members FOR DELETE
USING (is_parent_in_household(auth.uid(), household_id));

-- Trigger for updated_at
CREATE TRIGGER update_family_members_updated_at
BEFORE UPDATE ON public.family_members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();