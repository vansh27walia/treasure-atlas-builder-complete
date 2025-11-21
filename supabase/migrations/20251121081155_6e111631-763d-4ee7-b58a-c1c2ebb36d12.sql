-- Fix function search_path for security definer functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Function logic here
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.user_onboarding_status(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  completed BOOLEAN;
BEGIN
  SELECT onboarding_completed INTO completed
  FROM public.user_profiles
  WHERE id = user_id;
  
  RETURN completed;
END;
$$;

-- Add RLS policies for saved_parcels table
CREATE POLICY "Users can view own parcels"
  ON public.saved_parcels FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own parcels"
  ON public.saved_parcels FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own parcels"
  ON public.saved_parcels FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own parcels"
  ON public.saved_parcels FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);