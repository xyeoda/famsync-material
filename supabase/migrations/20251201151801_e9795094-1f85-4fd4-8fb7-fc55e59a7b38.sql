-- Add calendar_app_type column to calendar_tokens table
ALTER TABLE public.calendar_tokens 
ADD COLUMN calendar_app_type TEXT DEFAULT 'other';