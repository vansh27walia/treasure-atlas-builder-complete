
-- Add missing columns to shipment_records table for tracking functionality
ALTER TABLE public.shipment_records 
ADD COLUMN IF NOT EXISTS tracking_details JSONB,
ADD COLUMN IF NOT EXISTS est_delivery_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create an index on tracking_code for better performance
CREATE INDEX IF NOT EXISTS idx_shipment_records_tracking_code ON public.shipment_records(tracking_code);
