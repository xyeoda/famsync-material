-- Fix recursive RLS policy on user_roles and replace with safe role-based policies

-- 1) Drop the problematic recursive policy if it exists
DROP POLICY IF EXISTS "Parents can manage roles in their household" ON public.user_roles;

-- 2) Allow any authenticated user to view their own role rows
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 3) Allow parents to view all roles within their households
CREATE POLICY "Parents can view all roles in their household"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), household_id, 'parent'));

-- 4) Allow parents to INSERT roles in their household
CREATE POLICY "Parents can insert roles in their household"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), household_id, 'parent'));

-- 5) Allow parents to UPDATE roles in their household
CREATE POLICY "Parents can update roles in their household"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), household_id, 'parent'))
WITH CHECK (public.has_role(auth.uid(), household_id, 'parent'));

-- 6) Allow parents to DELETE roles in their household
CREATE POLICY "Parents can delete roles in their household"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), household_id, 'parent'));