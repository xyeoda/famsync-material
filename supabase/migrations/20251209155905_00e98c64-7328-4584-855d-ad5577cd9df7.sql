-- Create enum for access request status
CREATE TYPE public.access_request_status AS ENUM ('pending', 'approved', 'rejected');

-- Create access_requests table
CREATE TABLE public.access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_name TEXT NOT NULL,
  requester_name TEXT NOT NULL,
  requester_email TEXT NOT NULL,
  message TEXT,
  status access_request_status NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (public sign-up)
CREATE POLICY "Anyone can submit access requests"
ON public.access_requests
FOR INSERT
WITH CHECK (true);

-- Only site admins can view requests
CREATE POLICY "Site admins can view all access requests"
ON public.access_requests
FOR SELECT
USING (is_site_admin(auth.uid()));

-- Only site admins can update requests
CREATE POLICY "Site admins can update access requests"
ON public.access_requests
FOR UPDATE
USING (is_site_admin(auth.uid()));

-- Only site admins can delete requests
CREATE POLICY "Site admins can delete access requests"
ON public.access_requests
FOR DELETE
USING (is_site_admin(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_access_requests_updated_at
BEFORE UPDATE ON public.access_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();