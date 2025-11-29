-- Create invitation_errors table to track all invitation processing errors
CREATE TABLE IF NOT EXISTS public.invitation_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id UUID REFERENCES public.pending_invitations(id) ON DELETE SET NULL,
  household_id UUID REFERENCES public.households(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  error_type TEXT NOT NULL,
  error_message TEXT,
  error_details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.invitation_errors ENABLE ROW LEVEL SECURITY;

-- Site admins can view all errors
CREATE POLICY "Site admins can view all invitation errors"
ON public.invitation_errors
FOR SELECT
USING (is_site_admin(auth.uid()));

-- Service role can insert errors
CREATE POLICY "Service role can insert invitation errors"
ON public.invitation_errors
FOR INSERT
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_invitation_errors_household_id ON public.invitation_errors(household_id);
CREATE INDEX idx_invitation_errors_created_at ON public.invitation_errors(created_at DESC);