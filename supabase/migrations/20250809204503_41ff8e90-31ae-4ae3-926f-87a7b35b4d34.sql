-- Remove the overly permissive service role policy
DROP POLICY IF EXISTS "Service role can manage all payment records" ON public.payment_records;

-- Create more restrictive service role policies for specific operations
-- Allow service role to INSERT payment records (for payment processing)
CREATE POLICY "Service role can insert payment records" 
ON public.payment_records 
FOR INSERT 
TO service_role
WITH CHECK (true);

-- Allow service role to UPDATE payment records (for status updates)
CREATE POLICY "Service role can update payment records" 
ON public.payment_records 
FOR UPDATE 
TO service_role
USING (true);

-- Allow service role to SELECT payment records for verification/processing
-- but only recent records (within last 30 days) to limit exposure
CREATE POLICY "Service role can select recent payment records" 
ON public.payment_records 
FOR SELECT 
TO service_role
USING (created_at >= now() - interval '30 days');

-- Ensure the user_id column is NOT NULL to prevent orphaned payment records
-- First check if there are any NULL user_id records
DO $$
BEGIN
    -- Check for NULL user_id records
    IF EXISTS (SELECT 1 FROM public.payment_records WHERE user_id IS NULL) THEN
        RAISE EXCEPTION 'Cannot make user_id NOT NULL: found records with NULL user_id. Please clean up data first.';
    END IF;
    
    -- Make user_id NOT NULL if no NULL records exist
    ALTER TABLE public.payment_records ALTER COLUMN user_id SET NOT NULL;
END $$;