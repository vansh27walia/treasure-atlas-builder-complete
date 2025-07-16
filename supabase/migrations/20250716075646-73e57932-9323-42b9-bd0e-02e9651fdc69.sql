
-- Add shopify_store_url column to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN shopify_store_url TEXT;

-- Add shopify_access_token column to securely store the OAuth token
ALTER TABLE public.user_profiles 
ADD COLUMN shopify_access_token TEXT;
