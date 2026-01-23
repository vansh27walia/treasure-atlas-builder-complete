-- AI Logistics Intelligence Tables
-- These tables store AI-generated insights, predictions, and analytics

-- AI Shipment Insights - AI interpretation of each shipment
CREATE TABLE public.ai_shipment_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  shipment_id TEXT NOT NULL,
  tracking_code TEXT,
  ai_summary TEXT NOT NULL,
  confidence_score NUMERIC(3,2) DEFAULT 0.00,
  risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  predicted_delivery_date TIMESTAMP WITH TIME ZONE,
  delay_probability NUMERIC(3,2) DEFAULT 0.00,
  delay_reason TEXT,
  current_interpretation TEXT,
  recommendations JSONB DEFAULT '[]'::jsonb,
  raw_analysis JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- AI Delay Predictions - Predictive delay analysis
CREATE TABLE public.ai_delay_predictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  shipment_id TEXT NOT NULL,
  tracking_code TEXT,
  delay_probability NUMERIC(3,2) NOT NULL DEFAULT 0.00,
  predicted_delay_hours INTEGER DEFAULT 0,
  delay_type TEXT CHECK (delay_type IN ('customs', 'carrier_backlog', 'weather', 'missed_scan', 'handoff_failure', 'lost_package', 'other')),
  root_cause TEXT,
  confidence_score NUMERIC(3,2) DEFAULT 0.00,
  similar_shipments_analyzed INTEGER DEFAULT 0,
  reasoning TEXT,
  suggested_actions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days')
);

-- AI Carrier Scores - Carrier performance analytics
CREATE TABLE public.ai_carrier_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  carrier TEXT NOT NULL,
  service TEXT,
  reliability_score NUMERIC(3,2) DEFAULT 0.00,
  speed_score NUMERIC(3,2) DEFAULT 0.00,
  cost_efficiency_score NUMERIC(3,2) DEFAULT 0.00,
  overall_score NUMERIC(3,2) DEFAULT 0.00,
  total_shipments_analyzed INTEGER DEFAULT 0,
  on_time_percentage NUMERIC(5,2) DEFAULT 0.00,
  average_delay_hours NUMERIC(6,2) DEFAULT 0.00,
  best_lanes JSONB DEFAULT '[]'::jsonb,
  worst_lanes JSONB DEFAULT '[]'::jsonb,
  ai_recommendation TEXT,
  performance_trend TEXT CHECK (performance_trend IN ('improving', 'stable', 'declining')),
  analysis_period_start TIMESTAMP WITH TIME ZONE,
  analysis_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- AI Customer Messages - Auto-generated customer support responses
CREATE TABLE public.ai_customer_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  shipment_id TEXT,
  tracking_code TEXT,
  message_type TEXT DEFAULT 'status_update' CHECK (message_type IN ('status_update', 'delay_notification', 'delivery_confirmation', 'issue_resolution', 'proactive_update')),
  customer_ready_message TEXT NOT NULL,
  internal_notes TEXT,
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'concerned', 'urgent')),
  escalation_needed BOOLEAN DEFAULT false,
  escalation_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  used_at TIMESTAMP WITH TIME ZONE
);

-- AI Alerts - Automated intelligence alerts
CREATE TABLE public.ai_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('high_delay_risk', 'missing_scans', 'carrier_anomaly', 'sla_risk', 'lost_package', 'customs_hold', 'delivery_exception')),
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  shipment_id TEXT,
  tracking_code TEXT,
  carrier TEXT,
  suggested_action TEXT,
  is_read BOOLEAN DEFAULT false,
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- AI Decision Logs - Audit trail of AI decisions
CREATE TABLE public.ai_decision_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  decision_type TEXT NOT NULL,
  input_data JSONB NOT NULL,
  output_data JSONB NOT NULL,
  model_used TEXT DEFAULT 'gemini-flash',
  tokens_used INTEGER DEFAULT 0,
  processing_time_ms INTEGER DEFAULT 0,
  confidence_score NUMERIC(3,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.ai_shipment_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_delay_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_carrier_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_customer_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_decision_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_shipment_insights
CREATE POLICY "Users can view their own AI insights" ON public.ai_shipment_insights FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own AI insights" ON public.ai_shipment_insights FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own AI insights" ON public.ai_shipment_insights FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own AI insights" ON public.ai_shipment_insights FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for ai_delay_predictions
CREATE POLICY "Users can view their own delay predictions" ON public.ai_delay_predictions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own delay predictions" ON public.ai_delay_predictions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own delay predictions" ON public.ai_delay_predictions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own delay predictions" ON public.ai_delay_predictions FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for ai_carrier_scores
CREATE POLICY "Users can view their own carrier scores" ON public.ai_carrier_scores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own carrier scores" ON public.ai_carrier_scores FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own carrier scores" ON public.ai_carrier_scores FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own carrier scores" ON public.ai_carrier_scores FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for ai_customer_messages
CREATE POLICY "Users can view their own customer messages" ON public.ai_customer_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own customer messages" ON public.ai_customer_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own customer messages" ON public.ai_customer_messages FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own customer messages" ON public.ai_customer_messages FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for ai_alerts
CREATE POLICY "Users can view their own alerts" ON public.ai_alerts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own alerts" ON public.ai_alerts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own alerts" ON public.ai_alerts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own alerts" ON public.ai_alerts FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for ai_decision_logs
CREATE POLICY "Users can view their own decision logs" ON public.ai_decision_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own decision logs" ON public.ai_decision_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_ai_insights_user_shipment ON public.ai_shipment_insights(user_id, shipment_id);
CREATE INDEX idx_ai_insights_tracking ON public.ai_shipment_insights(tracking_code);
CREATE INDEX idx_ai_predictions_user ON public.ai_delay_predictions(user_id);
CREATE INDEX idx_ai_carrier_scores_user_carrier ON public.ai_carrier_scores(user_id, carrier);
CREATE INDEX idx_ai_alerts_user_unread ON public.ai_alerts(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_ai_alerts_severity ON public.ai_alerts(severity);

-- Trigger for updated_at
CREATE TRIGGER update_ai_shipment_insights_updated_at BEFORE UPDATE ON public.ai_shipment_insights FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ai_carrier_scores_updated_at BEFORE UPDATE ON public.ai_carrier_scores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();