
-- Create shipments table for user-created labels
CREATE TABLE IF NOT EXISTS public.shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  shipment_id TEXT,
  tracking_code TEXT NOT NULL,
  carrier TEXT,
  service TEXT,
  label_url TEXT,
  recipient_name TEXT,
  recipient_address TEXT,
  status TEXT DEFAULT 'created',
  eta TIMESTAMPTZ,
  tracking_history JSONB DEFAULT '{}'::jsonb,
  package_details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create external_trackings table for searched tracking numbers
CREATE TABLE IF NOT EXISTS public.external_trackings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_code TEXT UNIQUE NOT NULL,
  carrier TEXT,
  status TEXT,
  last_fetched TIMESTAMPTZ DEFAULT now(),
  tracking_data JSONB DEFAULT '{}'::jsonb,
  estimated_delivery JSONB,
  tracking_events JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on shipments table
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;

-- RLS policies for shipments - users can only see their own shipments
CREATE POLICY "Users can view their own shipments" 
  ON public.shipments 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own shipments" 
  ON public.shipments 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shipments" 
  ON public.shipments 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shipments" 
  ON public.shipments 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Enable RLS on external_trackings table (public read access for searched trackings)
ALTER TABLE public.external_trackings ENABLE ROW LEVEL SECURITY;

-- Allow public read access to external trackings (anyone can search)
CREATE POLICY "Anyone can view external trackings" 
  ON public.external_trackings 
  FOR SELECT 
  TO PUBLIC 
  USING (true);

-- Only service role can insert/update external trackings (via Edge Functions)
CREATE POLICY "Service role can manage external trackings" 
  ON public.external_trackings 
  FOR ALL 
  TO service_role 
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shipments_user_id ON public.shipments(user_id);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking_code ON public.shipments(tracking_code);
CREATE INDEX IF NOT EXISTS idx_external_trackings_code ON public.external_trackings(tracking_code);
CREATE INDEX IF NOT EXISTS idx_shipments_created_at ON public.shipments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_external_trackings_last_fetched ON public.external_trackings(last_fetched DESC);

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update the updated_at column
CREATE TRIGGER update_shipments_updated_at 
  BEFORE UPDATE ON public.shipments 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_external_trackings_updated_at 
  BEFORE UPDATE ON public.external_trackings 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
