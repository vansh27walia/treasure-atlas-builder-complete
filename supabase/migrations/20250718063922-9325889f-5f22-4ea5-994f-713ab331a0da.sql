
-- Create table for Shopify connections linked to authenticated users
CREATE TABLE IF NOT EXISTS public.shopify_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shop TEXT NOT NULL,
  access_token TEXT NOT NULL,
  scopes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, shop)
);

-- Add RLS policies
ALTER TABLE public.shopify_connections ENABLE ROW LEVEL SECURITY;

-- Users can only access their own Shopify connections
CREATE POLICY "Users can view their own Shopify connections"
  ON public.shopify_connections
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own Shopify connections"
  ON public.shopify_connections
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Shopify connections"
  ON public.shopify_connections
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Shopify connections"
  ON public.shopify_connections
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_shopify_connections_user_id 
  ON public.shopify_connections(user_id);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_shopify_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER shopify_connections_updated_at
  BEFORE UPDATE ON public.shopify_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_shopify_connections_updated_at();

-- Remove the old shopify_oauth_states table if it exists since we'll use a simpler approach
DROP TABLE IF EXISTS public.shopify_oauth_states CASCADE;
