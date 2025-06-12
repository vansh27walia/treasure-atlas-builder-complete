
-- Create the shipping-labels storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'shipping-labels',
  'shipping-labels', 
  true,
  52428800, -- 50MB limit
  ARRAY['image/png', 'application/pdf', 'text/plain', 'application/zip']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Authenticated users can upload shipping labels" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own shipping labels" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own shipping labels" ON storage.objects;

-- Create the storage policies
CREATE POLICY "Authenticated users can upload shipping labels"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'shipping-labels' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own shipping labels"
ON storage.objects FOR UPDATE
USING (bucket_id = 'shipping-labels' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own shipping labels"
ON storage.objects FOR DELETE
USING (bucket_id = 'shipping-labels' AND auth.role() = 'authenticated');
