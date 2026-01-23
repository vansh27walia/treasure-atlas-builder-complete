import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface AIOverview {
  headline: string;
  riskSummary: string;
  topPriorities: Array<{ priority: number; issue: string; action: string }>;
  metrics: {
    healthScore: number;
    atRiskShipments: number;
    predictedDelays24h: number;
    carrierIssues: number;
  };
  recommendations: string[];
  insights: string[];
}

interface AIAlert {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  description: string;
  shipment_id?: string;
  tracking_code?: string;
  carrier?: string;
  suggested_action?: string;
  is_read: boolean;
  is_resolved: boolean;
  created_at: string;
}

interface DelayPrediction {
  id: string;
  shipment_id: string;
  tracking_code?: string;
  delay_probability: number;
  predicted_delay_hours: number;
  delay_type: string;
  root_cause?: string;
  confidence_score: number;
  reasoning?: string;
  suggested_actions: string[];
}

interface CarrierScore {
  id: string;
  carrier: string;
  service?: string;
  reliability_score: number;
  speed_score: number;
  cost_efficiency_score: number;
  overall_score: number;
  total_shipments_analyzed: number;
  on_time_percentage: number;
  average_delay_hours: number;
  ai_recommendation?: string;
  performance_trend: string;
  best_lanes: string[];
  worst_lanes: string[];
}

interface ShipmentInsight {
  id: string;
  shipment_id: string;
  tracking_code?: string;
  ai_summary: string;
  confidence_score: number;
  risk_level: string;
  predicted_delivery_date?: string;
  delay_probability: number;
  delay_reason?: string;
  current_interpretation?: string;
  recommendations: string[];
}

export const useAILogistics = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [overview, setOverview] = useState<AIOverview | null>(null);
  const [alerts, setAlerts] = useState<AIAlert[]>([]);
  const [predictions, setPredictions] = useState<DelayPrediction[]>([]);
  const [carrierScores, setCarrierScores] = useState<CarrierScore[]>([]);
  const [insights, setInsights] = useState<ShipmentInsight[]>([]);
  const [stats, setStats] = useState({
    activeShipments: 0,
    totalShipments: 0,
    unresolvedAlerts: 0,
    recentInsights: 0
  });

  const callAIFunction = useCallback(async (action: string, params: any = {}) => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-logistics-intelligence', {
        body: { action, ...params }
      });

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('AI Logistics error:', error);
      throw error;
    }
  }, []);

  const fetchOverview = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await callAIFunction('get_overview');
      if (data.overview) setOverview(data.overview);
      if (data.stats) setStats(data.stats);
      if (data.alerts) setAlerts(data.alerts);
      if (data.predictions) setPredictions(data.predictions);
      if (data.carrierScores) setCarrierScores(data.carrierScores);
      return data;
    } catch (error: any) {
      toast.error('Failed to fetch AI overview');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [callAIFunction]);

  const analyzeShipment = useCallback(async (shipmentId: string, trackingCode?: string) => {
    setIsLoading(true);
    try {
      const data = await callAIFunction('analyze_shipment', { shipmentId, trackingCode });
      toast.success('Shipment analyzed successfully');
      return data.analysis;
    } catch (error: any) {
      toast.error('Failed to analyze shipment');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [callAIFunction]);

  const predictDelays = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await callAIFunction('predict_delays');
      if (data.predictions) setPredictions(data.predictions);
      toast.success(`Analyzed ${data.predictions?.length || 0} shipments for delay risk`);
      return data;
    } catch (error: any) {
      toast.error('Failed to predict delays');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [callAIFunction]);

  const analyzeCarriers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await callAIFunction('analyze_carriers');
      if (data.carriers) setCarrierScores(data.carriers);
      toast.success('Carrier performance analyzed');
      return data;
    } catch (error: any) {
      toast.error('Failed to analyze carriers');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [callAIFunction]);

  const generateCustomerMessage = useCallback(async (shipmentId: string, trackingCode?: string) => {
    setIsLoading(true);
    try {
      const data = await callAIFunction('generate_customer_message', { shipmentId, trackingCode });
      toast.success('Customer message generated');
      return data.message;
    } catch (error: any) {
      toast.error('Failed to generate message');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [callAIFunction]);

  const fetchAlerts = useCallback(async () => {
    try {
      const data = await callAIFunction('get_alerts');
      if (data.alerts) setAlerts(data.alerts);
      return data.alerts;
    } catch (error: any) {
      toast.error('Failed to fetch alerts');
      throw error;
    }
  }, [callAIFunction]);

  const resolveAlert = useCallback(async (alertId: string) => {
    try {
      await callAIFunction('resolve_alert', { shipmentId: alertId });
      setAlerts(prev => prev.map(a => 
        a.id === alertId ? { ...a, is_resolved: true } : a
      ));
      toast.success('Alert resolved');
    } catch (error: any) {
      toast.error('Failed to resolve alert');
      throw error;
    }
  }, [callAIFunction]);

  const optimizeRoutes = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await callAIFunction('optimize_routes');
      toast.success('Route optimization complete');
      return data;
    } catch (error: any) {
      toast.error('Failed to optimize routes');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [callAIFunction]);

  const fetchInsights = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('ai_shipment_insights')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setInsights((data || []) as ShipmentInsight[]);
      return data;
    } catch (error: any) {
      toast.error('Failed to fetch insights');
      throw error;
    }
  }, []);

  return {
    isLoading,
    overview,
    alerts,
    predictions,
    carrierScores,
    insights,
    stats,
    fetchOverview,
    analyzeShipment,
    predictDelays,
    analyzeCarriers,
    generateCustomerMessage,
    fetchAlerts,
    resolveAlert,
    optimizeRoutes,
    fetchInsights
  };
};
