
-- Create tracking table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.tracking_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  tracking_code TEXT NOT NULL UNIQUE,
  carrier TEXT,
  service TEXT,
  status TEXT DEFAULT 'created',
  recipient_name TEXT,
  recipient_address TEXT,
  label_url TEXT,
  shipment_id TEXT,
  easypost_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tracking_records ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own tracking records"
  ON public.tracking_records
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tracking records"
  ON public.tracking_records
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tracking records"
  ON public.tracking_records
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_tracking_records_user_id ON public.tracking_records(user_id);
CREATE INDEX IF NOT EXISTS idx_tracking_records_tracking_code ON public.tracking_records(tracking_code);
