-- Add RLS policies to calendar_tokens table

-- Users can view their own tokens
CREATE POLICY "Users can view own tokens"
ON calendar_tokens FOR SELECT
USING (auth.uid() = user_id);

-- Users can create tokens (must be their own user_id)
CREATE POLICY "Users can create tokens"
ON calendar_tokens FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own tokens
CREATE POLICY "Users can update own tokens"
ON calendar_tokens FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own tokens
CREATE POLICY "Users can delete own tokens"
ON calendar_tokens FOR DELETE
USING (auth.uid() = user_id);