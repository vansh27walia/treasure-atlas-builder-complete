-- Add unique constraint on shopify_order_id + user_id for upsert support
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'shopify_orders_shopify_order_id_user_id_key'
  ) THEN
    ALTER TABLE public.shopify_orders 
      ADD CONSTRAINT shopify_orders_shopify_order_id_user_id_key 
      UNIQUE (shopify_order_id, user_id);
  END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_shopify_orders_user_fulfillment 
  ON public.shopify_orders (user_id, fulfillment_status);
CREATE INDEX IF NOT EXISTS idx_shopify_orders_shopify_order_id 
  ON public.shopify_orders (shopify_order_id);
CREATE INDEX IF NOT EXISTS idx_shipment_records_shopify_order 
  ON public.shipment_records (shopify_order_id);
