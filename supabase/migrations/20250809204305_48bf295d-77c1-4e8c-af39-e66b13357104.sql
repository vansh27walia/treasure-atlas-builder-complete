-- Add RLS policies to oauth_states table to prevent OAuth token exposure
-- Users should only access their own OAuth state records

-- Policy for SELECT: Users can only view their own OAuth states
CREATE POLICY "Users can view their own OAuth states" 
ON public.oauth_states 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy for INSERT: Users can only create OAuth states for themselves
CREATE POLICY "Users can create their own OAuth states" 
ON public.oauth_states 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy for UPDATE: Users can only update their own OAuth states
CREATE POLICY "Users can update their own OAuth states" 
ON public.oauth_states 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Policy for DELETE: Users can only delete their own OAuth states
CREATE POLICY "Users can delete their own OAuth states" 
ON public.oauth_states 
FOR DELETE 
USING (auth.uid() = user_id);