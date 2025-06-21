
-- Create storage bucket for shipping labels
INSERT INTO storage.buckets (id, name, public)
VALUES ('shipping-labels', 'shipping-labels', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for the shipping-labels bucket
CREATE POLICY "Allow authenticated users to upload shipping labels"
ON storage.objects FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'shipping-labels');

CREATE POLICY "Allow authenticated users to view shipping labels"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'shipping-labels');

CREATE POLICY "Allow authenticated users to update shipping labels"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'shipping-labels');

CREATE POLICY "Allow authenticated users to delete shipping labels"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'shipping-labels');
