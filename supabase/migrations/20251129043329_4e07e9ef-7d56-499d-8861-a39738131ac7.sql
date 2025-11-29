-- Create email tracking table to monitor invitation emails
CREATE TABLE IF NOT EXISTS public.email_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  email_type TEXT NOT NULL CHECK (email_type IN ('invitation', 'password_reset', 'test')),
  role TEXT,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  invitation_id UUID REFERENCES public.pending_invitations(id) ON DELETE SET NULL,
  sent_by UUID REFERENCES public.profiles(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX idx_email_tracking_household ON public.email_tracking(household_id);
CREATE INDEX idx_email_tracking_recipient ON public.email_tracking(recipient_email);
CREATE INDEX idx_email_tracking_sent_at ON public.email_tracking(sent_at DESC);
CREATE INDEX idx_email_tracking_invitation ON public.email_tracking(invitation_id);

-- Enable RLS
ALTER TABLE public.email_tracking ENABLE ROW LEVEL SECURITY;

-- Policy: Site admins can view all tracking
CREATE POLICY "Site admins can view all email tracking"
ON public.email_tracking
FOR SELECT
USING (is_site_admin(auth.uid()));

-- Policy: Parents can view tracking for their household
CREATE POLICY "Parents can view email tracking in their household"
ON public.email_tracking
FOR SELECT
USING (is_parent_in_household(auth.uid(), household_id));

-- Policy: System can insert tracking records (service role)
CREATE POLICY "Service role can insert email tracking"
ON public.email_tracking
FOR INSERT
WITH CHECK (true);

-- Policy: System can update tracking records (service role)
CREATE POLICY "Service role can update email tracking"
ON public.email_tracking
FOR UPDATE
USING (true);

-- Create trigger to update updated_at
CREATE TRIGGER update_email_tracking_updated_at
BEFORE UPDATE ON public.email_tracking
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();