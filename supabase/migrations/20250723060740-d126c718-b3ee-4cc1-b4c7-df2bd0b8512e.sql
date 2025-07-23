
-- Create bulk_shipments table for storing processed bulk shipping data
CREATE TABLE public.bulk_shipments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  shipment_data JSONB NOT NULL,
  rates JSONB NOT NULL DEFAULT '[]'::jsonb,
  selected_rate_id TEXT,
  insurance_amount NUMERIC DEFAULT 0,
  insurance_cost NUMERIC DEFAULT 0,
  total_cost NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bulk_shipments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own bulk shipments"
  ON public.bulk_shipments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bulk shipments"
  ON public.bulk_shipments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bulk shipments"
  ON public.bulk_shipments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bulk shipments"
  ON public.bulk_shipments FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_bulk_shipments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bulk_shipments_updated_at
  BEFORE UPDATE ON public.bulk_shipments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_bulk_shipments_updated_at();
