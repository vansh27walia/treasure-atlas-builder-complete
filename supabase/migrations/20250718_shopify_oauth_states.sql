
-- Create table for temporary OAuth state storage
CREATE TABLE IF NOT EXISTS public.shopify_oauth_states (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  state TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- Add RLS
ALTER TABLE public.shopify_oauth_states ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own OAuth states"
  ON public.shopify_oauth_states
  FOR ALL
  USING (auth.uid() = user_id);

-- Create index for cleanup
CREATE INDEX IF NOT EXISTS idx_shopify_oauth_states_expires_at 
  ON public.shopify_oauth_states(expires_at);

-- Create function to clean up expired states
CREATE OR REPLACE FUNCTION cleanup_expired_oauth_states()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM public.shopify_oauth_states 
  WHERE expires_at < now();
END;
$$;
