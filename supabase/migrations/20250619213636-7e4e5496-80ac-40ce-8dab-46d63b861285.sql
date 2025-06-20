
-- Ensure proper RLS policies with type safety and security

-- First, make sure user_id columns are properly typed as UUID
-- (The existing tables should already have this, but let's be explicit)

-- Enable RLS on both tables
ALTER TABLE public.shipment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view their own shipment records" ON public.shipment_records;
DROP POLICY IF EXISTS "Users can insert their own shipment records" ON public.shipment_records;
DROP POLICY IF EXISTS "Users can update their own shipment records" ON public.shipment_records;
DROP POLICY IF EXISTS "Users can view their own shipments" ON public.shipments;
DROP POLICY IF EXISTS "Users can insert their own shipments" ON public.shipments;
DROP POLICY IF EXISTS "Users can update their own shipments" ON public.shipments;

-- Create improved RLS policies for shipment_records
CREATE POLICY "Users can view their own shipment records"
  ON public.shipment_records
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own shipment records"
  ON public.shipment_records
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shipment records"
  ON public.shipment_records
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create improved RLS policies for shipments
CREATE POLICY "Users can view their own shipments"
  ON public.shipments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own shipments"
  ON public.shipments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shipments"
  ON public.shipments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Ensure indexes exist for performance
CREATE INDEX IF NOT EXISTS idx_shipment_records_user_id ON public.shipment_records(user_id);
CREATE INDEX IF NOT EXISTS idx_shipments_user_id ON public.shipments(user_id);
