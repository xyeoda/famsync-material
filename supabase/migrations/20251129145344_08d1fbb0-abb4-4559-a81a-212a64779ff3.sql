-- Allow users to view profiles of members in the same household
CREATE POLICY "Users can view profiles in same household"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT user_id FROM user_roles 
    WHERE household_id IN (
      SELECT household_id FROM user_roles WHERE user_id = auth.uid()
    )
  )
);