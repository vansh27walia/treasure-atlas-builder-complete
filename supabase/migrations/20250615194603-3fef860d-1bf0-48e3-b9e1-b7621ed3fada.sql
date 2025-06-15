
-- Create table for secure API key storage
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  service_name TEXT NOT NULL,
  encrypted_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for batch processing logs
CREATE TABLE IF NOT EXISTS public.batch_processing_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  filename TEXT NOT NULL,
  original_row_count INTEGER NOT NULL,
  processed_row_count INTEGER NOT NULL,
  failed_row_count INTEGER DEFAULT 0,
  processing_status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  download_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_processing_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for api_keys
CREATE POLICY "Users can manage their own API keys" 
  ON public.api_keys 
  FOR ALL 
  USING (auth.uid() = user_id);

-- Create RLS policies for batch_processing_logs
CREATE POLICY "Users can view their own processing logs" 
  ON public.batch_processing_logs 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own processing logs" 
  ON public.batch_processing_logs 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own processing logs" 
  ON public.batch_processing_logs 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_service_name ON public.api_keys(service_name);
CREATE INDEX IF NOT EXISTS idx_batch_logs_user_id ON public.batch_processing_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_batch_logs_status ON public.batch_processing_logs(processing_status);
