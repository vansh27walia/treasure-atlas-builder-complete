-- Create payment_records table for tracking payments
CREATE TABLE public.payment_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  stripe_payment_intent_id TEXT UNIQUE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL,
  transaction_type TEXT NOT NULL,
  shipping_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;

-- Create policies for payment records
CREATE POLICY "Users can view their own payment records" 
ON public.payment_records 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payment records" 
ON public.payment_records 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage all payment records" 
ON public.payment_records 
FOR ALL 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_payment_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_payment_records_updated_at
BEFORE UPDATE ON public.payment_records
FOR EACH ROW
EXECUTE FUNCTION public.update_payment_records_updated_at();