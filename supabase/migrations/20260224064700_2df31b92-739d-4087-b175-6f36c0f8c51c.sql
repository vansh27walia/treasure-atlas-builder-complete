
-- Persistent Shopify Orders table
CREATE TABLE public.shopify_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  store_id uuid REFERENCES public.shopify_connections(id) ON DELETE CASCADE,
  shopify_order_id text NOT NULL,
  order_number text,
  customer_name text,
  customer_email text,
  shipping_address jsonb,
  shipping_address_text text,
  total_price numeric,
  financial_status text,
  fulfillment_status text DEFAULT 'unfulfilled',
  order_status text DEFAULT 'imported',
  sync_status text DEFAULT 'synced',
  line_items text,
  total_weight numeric DEFAULT 0,
  shop text NOT NULL,
  tracking_number text,
  tracking_url text,
  carrier text,
  label_url text,
  shipment_record_id integer REFERENCES public.shipment_records(id),
  synced_to_shopify boolean DEFAULT false,
  shopify_fulfillment_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, shopify_order_id, shop)
);

-- Returns table
CREATE TABLE public.returns (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  order_id uuid REFERENCES public.shopify_orders(id) ON DELETE CASCADE,
  shopify_order_id text,
  return_label_url text,
  return_tracking_number text,
  return_carrier text,
  return_status text DEFAULT 'requested',
  reason text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Error logs table
CREATE TABLE public.sync_error_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  order_id uuid REFERENCES public.shopify_orders(id) ON DELETE SET NULL,
  shopify_order_id text,
  error_type text NOT NULL,
  error_message text,
  api_response jsonb,
  resolved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- RLS for shopify_orders
ALTER TABLE public.shopify_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own orders" ON public.shopify_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own orders" ON public.shopify_orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own orders" ON public.shopify_orders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own orders" ON public.shopify_orders FOR DELETE USING (auth.uid() = user_id);

-- RLS for returns
ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own returns" ON public.returns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own returns" ON public.returns FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own returns" ON public.returns FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own returns" ON public.returns FOR DELETE USING (auth.uid() = user_id);

-- RLS for sync_error_logs
ALTER TABLE public.sync_error_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own error logs" ON public.sync_error_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own error logs" ON public.sync_error_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Updated_at trigger for shopify_orders
CREATE OR REPLACE FUNCTION public.update_shopify_orders_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER update_shopify_orders_updated_at
  BEFORE UPDATE ON public.shopify_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_shopify_orders_updated_at();

-- Updated_at trigger for returns
CREATE TRIGGER update_returns_updated_at
  BEFORE UPDATE ON public.returns
  FOR EACH ROW EXECUTE FUNCTION public.update_shopify_orders_updated_at();
