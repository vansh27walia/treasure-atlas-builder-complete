
-- Create table to track label files and metadata
CREATE TABLE IF NOT EXISTS public.shipping_label_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shipment_id TEXT NOT NULL,
  tracking_code TEXT,
  order_reference TEXT,
  label_type TEXT NOT NULL CHECK (label_type IN ('png', 'pdf', 'zpl')),
  supabase_url TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  easypost_shipment_id TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for bulk label batches
CREATE TABLE IF NOT EXISTS public.bulk_label_batches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_reference TEXT NOT NULL UNIQUE,
  total_labels INTEGER NOT NULL DEFAULT 0,
  zip_file_url TEXT,
  zip_file_path TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE public.shipping_label_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulk_label_batches ENABLE ROW LEVEL SECURITY;

-- RLS policies for shipping_label_files
CREATE POLICY "Users can view their own label files"
ON public.shipping_label_files FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own label files"
ON public.shipping_label_files FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS policies for bulk_label_batches
CREATE POLICY "Users can view their own bulk batches"
ON public.bulk_label_batches FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bulk batches"
ON public.bulk_label_batches FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_shipping_label_files_shipment_id ON public.shipping_label_files(shipment_id);
CREATE INDEX idx_shipping_label_files_tracking_code ON public.shipping_label_files(tracking_code);
CREATE INDEX idx_shipping_label_files_user_id ON public.shipping_label_files(user_id);
CREATE INDEX idx_bulk_label_batches_user_id ON public.bulk_label_batches(user_id);
CREATE INDEX idx_bulk_label_batches_batch_reference ON public.bulk_label_batches(batch_reference);
