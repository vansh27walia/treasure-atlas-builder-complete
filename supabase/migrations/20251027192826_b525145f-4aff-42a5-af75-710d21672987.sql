-- Fix 1: Add RLS policy for users table so users can view their own record
CREATE POLICY "Users can view own record" 
ON public.users 
FOR SELECT 
USING (auth.uid() = id);

-- Fix 2: Secure external_trackings table
-- First, add user_id column to link tracking to users
ALTER TABLE public.external_trackings 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Drop the overly permissive public access policy
DROP POLICY IF EXISTS "Anyone can view external trackings" ON public.external_trackings;
DROP POLICY IF EXISTS "Service role can manage external trackings" ON public.external_trackings;

-- Add user-scoped policies
CREATE POLICY "Users can view their own trackings" 
ON public.external_trackings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trackings" 
ON public.external_trackings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trackings" 
ON public.external_trackings 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Service role needs access for webhook updates
CREATE POLICY "Service role can manage all trackings" 
ON public.external_trackings 
FOR ALL 
USING (auth.role() = 'service_role');

-- Fix 3: Make storage buckets private and add RLS policies
-- Update shipping-labels bucket to be private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'shipping-labels';

-- Update shipping-labels-2 bucket to be private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'shipping-labels-2';

-- Add RLS policies for storage access
CREATE POLICY "Users can view their own shipping labels" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id IN ('shipping-labels', 'shipping-labels-2') 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can insert their own shipping labels" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id IN ('shipping-labels', 'shipping-labels-2') 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Service role can manage all shipping labels" 
ON storage.objects 
FOR ALL 
USING (
  bucket_id IN ('shipping-labels', 'shipping-labels-2') 
  AND auth.role() = 'service_role'
);