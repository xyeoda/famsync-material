-- Create system_role enum
CREATE TYPE public.system_role AS ENUM ('site_admin', 'user');

-- Create system_roles table
CREATE TABLE public.system_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.system_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS on system_roles
ALTER TABLE public.system_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check site admin status
CREATE OR REPLACE FUNCTION public.is_site_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.system_roles
    WHERE user_id = _user_id
      AND role = 'site_admin'
  )
$$;

-- RLS policies for system_roles
CREATE POLICY "Site admins can view all system roles"
  ON public.system_roles
  FOR SELECT
  USING (public.is_site_admin(auth.uid()));

CREATE POLICY "Users can view their own system role"
  ON public.system_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create admin_audit_log table
CREATE TABLE public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT NOT NULL,
  performed_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  target_household_id UUID REFERENCES public.households(id) ON DELETE SET NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on admin_audit_log
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS policy for admin_audit_log
CREATE POLICY "Only site admins can view audit logs"
  ON public.admin_audit_log
  FOR SELECT
  USING (public.is_site_admin(auth.uid()));

CREATE POLICY "Only site admins can insert audit logs"
  ON public.admin_audit_log
  FOR INSERT
  WITH CHECK (public.is_site_admin(auth.uid()));

-- Update households table to allow site admin deletion
CREATE POLICY "Site admins can delete any household"
  ON public.households
  FOR DELETE
  USING (public.is_site_admin(auth.uid()));

-- Make owner_id nullable temporarily during creation
ALTER TABLE public.households ALTER COLUMN owner_id DROP NOT NULL;

-- Add trigger for system_roles updated_at
CREATE TRIGGER update_system_roles_updated_at
  BEFORE UPDATE ON public.system_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add is_first_parent flag to pending_invitations
ALTER TABLE public.pending_invitations 
  ADD COLUMN is_first_parent BOOLEAN NOT NULL DEFAULT false;