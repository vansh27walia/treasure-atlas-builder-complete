
-- Create bulk_shipments table to store processed shipments
CREATE TABLE public.bulk_shipments (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shipment_data JSONB NOT NULL,
  rates JSONB NOT NULL DEFAULT '[]',
  selected_rate_id TEXT,
  insurance_amount DECIMAL(10,2) DEFAULT 0,
  insurance_cost DECIMAL(10,2) DEFAULT 0,
  total_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'rates_fetched', 'ready', 'error')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.bulk_shipments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own bulk shipments"
ON public.bulk_shipments
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bulk shipments"
ON public.bulk_shipments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bulk shipments"
ON public.bulk_shipments
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bulk shipments"
ON public.bulk_shipments
FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_bulk_shipments_user_id ON public.bulk_shipments(user_id);
CREATE INDEX idx_bulk_shipments_status ON public.bulk_shipments(status);
CREATE INDEX idx_bulk_shipments_created_at ON public.bulk_shipments(created_at);

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_bulk_shipments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_bulk_shipments_updated_at
  BEFORE UPDATE ON public.bulk_shipments
  FOR EACH ROW
  EXECUTE FUNCTION update_bulk_shipments_updated_at();
