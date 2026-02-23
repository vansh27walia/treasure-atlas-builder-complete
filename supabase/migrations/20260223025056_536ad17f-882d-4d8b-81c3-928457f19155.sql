
-- Add Shopify fulfillment tracking columns to shipment_records
ALTER TABLE public.shipment_records
  ADD COLUMN IF NOT EXISTS shopify_order_id text,
  ADD COLUMN IF NOT EXISTS shopify_fulfillment_id text,
  ADD COLUMN IF NOT EXISTS synced_to_shopify boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS shopify_sync_timestamp timestamptz,
  ADD COLUMN IF NOT EXISTS shopify_sync_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS shopify_shop text;

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_shipment_records_shopify_order_id ON public.shipment_records(shopify_order_id);
CREATE INDEX IF NOT EXISTS idx_shipment_records_synced_to_shopify ON public.shipment_records(synced_to_shopify);
