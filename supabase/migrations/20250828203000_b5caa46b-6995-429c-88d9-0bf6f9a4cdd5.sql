-- Add the missing markup_percentage column to shipment_records table
ALTER TABLE public.shipment_records ADD COLUMN IF NOT EXISTS markup_percentage NUMERIC DEFAULT 5.0;