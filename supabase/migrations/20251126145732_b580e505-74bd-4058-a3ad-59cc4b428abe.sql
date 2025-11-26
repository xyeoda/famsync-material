-- Drop the existing trigger that causes issues with null owner_id
DROP TRIGGER IF EXISTS assign_parent_role_to_household_creator ON public.households;

-- Update the function to only assign role when owner_id is not null
CREATE OR REPLACE FUNCTION public.assign_parent_role_to_creator()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only assign parent role if owner_id is not null
  IF NEW.owner_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, household_id, role)
    VALUES (NEW.owner_id, NEW.id, 'parent')
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER assign_parent_role_to_household_creator
  AFTER INSERT OR UPDATE OF owner_id ON public.households
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_parent_role_to_creator();