ALTER TABLE public.merchant_tracking_settings 
ADD COLUMN IF NOT EXISTS tracking_template text NOT NULL DEFAULT 'timeline',
ADD COLUMN IF NOT EXISTS store_name text,
ADD COLUMN IF NOT EXISTS website_url text;