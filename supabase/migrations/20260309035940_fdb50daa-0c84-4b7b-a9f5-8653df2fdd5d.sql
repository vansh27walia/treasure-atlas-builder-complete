
-- Merchant tracking page settings
CREATE TABLE public.merchant_tracking_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  logo_url text,
  brand_color text DEFAULT '#3B82F6',
  support_email text,
  custom_message text DEFAULT 'Thank you for your order!',
  banner_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Unique constraint: one settings row per merchant
ALTER TABLE public.merchant_tracking_settings ADD CONSTRAINT merchant_tracking_settings_user_id_key UNIQUE (user_id);

ALTER TABLE public.merchant_tracking_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tracking settings" ON public.merchant_tracking_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own tracking settings" ON public.merchant_tracking_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tracking settings" ON public.merchant_tracking_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Public can read tracking settings by id" ON public.merchant_tracking_settings FOR SELECT TO anon USING (true);

-- Merchant email settings
CREATE TABLE public.merchant_email_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  email_subject text DEFAULT 'Your shipment is on its way!',
  email_message text DEFAULT 'Your order has been shipped. Click the link below to track your package.',
  support_email text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.merchant_email_settings ADD CONSTRAINT merchant_email_settings_user_id_key UNIQUE (user_id);

ALTER TABLE public.merchant_email_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own email settings" ON public.merchant_email_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own email settings" ON public.merchant_email_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own email settings" ON public.merchant_email_settings FOR UPDATE USING (auth.uid() = user_id);

-- Tracking events table
CREATE TABLE public.tracking_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shipment_id text NOT NULL,
  tracking_number text NOT NULL,
  event_date timestamp with time zone NOT NULL DEFAULT now(),
  event_status text NOT NULL,
  event_description text,
  location text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.tracking_events ENABLE ROW LEVEL SECURITY;

-- Public read access for tracking events (customers need to see these)
CREATE POLICY "Public can read tracking events" ON public.tracking_events FOR SELECT TO anon USING (true);
CREATE POLICY "Authenticated can read tracking events" ON public.tracking_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert tracking events" ON public.tracking_events FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Service role can manage tracking events" ON public.tracking_events FOR ALL USING (auth.role() = 'service_role');
