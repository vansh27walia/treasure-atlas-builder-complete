import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Package, 
  Search, 
  Brain, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  RefreshCw,
  ChevronRight,
  MapPin,
  Truck
} from 'lucide-react';
import { useAILogistics } from '@/hooks/useAILogistics';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

interface ShipmentRecord {
  id: number;
  shipment_id: string;
  tracking_code: string;
  carrier: string;
  service: string;
  status: string;
  from_address_json: any;
  to_address_json: any;
  created_at: string;
  est_delivery_date: string;
  charged_rate: number;
}

const ShipmentIntelligencePage: React.FC = () => {
  const { user } = useAuth();
  const { isLoading, analyzeShipment, insights, fetchInsights } = useAILogistics();
  const [shipments, setShipments] = useState<ShipmentRecord[]>([]);
  const [selectedShipment, setSelectedShipment] = useState<ShipmentRecord | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingShipments, setLoadingShipments] = useState(true);

  useEffect(() => {
    if (user) {
      fetchShipments();
      fetchInsights();
    }
  }, [user]);

  const fetchShipments = async () => {
    setLoadingShipments(true);
    try {
      const { data, error } = await supabase
        .from('shipment_records')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setShipments(data || []);
    } catch (error) {
      console.error('Error fetching shipments:', error);
    } finally {
      setLoadingShipments(false);
    }
  };

  const handleAnalyze = async (shipment: ShipmentRecord) => {
    setSelectedShipment(shipment);
    try {
      const result = await analyzeShipment(shipment.shipment_id, shipment.tracking_code);
      setAnalysis(result);
    } catch (error) {
      console.error('Analysis error:', error);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'high': return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      default: return 'text-green-400 bg-green-500/20 border-green-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'delivered') return <CheckCircle2 className="w-4 h-4 text-green-400" />;
    if (s === 'in_transit' || s === 'in transit') return <Truck className="w-4 h-4 text-blue-400" />;
    return <Clock className="w-4 h-4 text-yellow-400" />;
  };

  const filteredShipments = shipments.filter(s =>
    s.tracking_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.carrier?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.to_address_json?.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const existingInsight = selectedShipment 
    ? insights.find(i => i.shipment_id === selectedShipment.shipment_id)
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Package className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Shipment Intelligence</h1>
            <p className="text-blue-200">AI-powered analysis for every shipment</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Shipment List */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="bg-slate-800/80 border-slate-700 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search shipments..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
                {loadingShipments ? (
                  Array(5).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))
                ) : filteredShipments.length > 0 ? (
                  filteredShipments.map((shipment) => (
                    <div
                      key={shipment.id}
                      onClick={() => handleAnalyze(shipment)}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedShipment?.id === shipment.id
                          ? 'bg-blue-600/30 border-blue-500'
                          : 'bg-slate-700/50 border-slate-600 hover:border-slate-500'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-mono text-sm">
                          {shipment.tracking_code?.slice(0, 15)}...
                        </span>
                        {getStatusIcon(shipment.status)}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Badge variant="outline" className="text-xs">
                          {shipment.carrier}
                        </Badge>
                        <span>→</span>
                        <span>{shipment.to_address_json?.city || 'Unknown'}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No shipments found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Analysis Panel */}
          <div className="lg:col-span-2 space-y-4">
            {selectedShipment ? (
              <>
                {/* Shipment Details */}
                <Card className="bg-slate-800/80 border-slate-700 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Truck className="w-5 h-5 text-blue-400" />
                        Shipment Details
                      </span>
                      <Button 
                        size="sm" 
                        onClick={() => handleAnalyze(selectedShipment)}
                        disabled={isLoading}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Re-analyze
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-slate-400 text-sm">Tracking</p>
                        <p className="text-white font-mono text-sm">{selectedShipment.tracking_code}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-sm">Carrier</p>
                        <p className="text-white">{selectedShipment.carrier}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-sm">Service</p>
                        <p className="text-white">{selectedShipment.service}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-sm">Status</p>
                        <Badge className="mt-1">{selectedShipment.status}</Badge>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                          <MapPin className="w-4 h-4" />
                          <span>From</span>
                        </div>
                        <p className="text-white text-sm">
                          {selectedShipment.from_address_json?.city}, {selectedShipment.from_address_json?.state}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-500" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                          <MapPin className="w-4 h-4" />
                          <span>To</span>
                        </div>
                        <p className="text-white text-sm">
                          {selectedShipment.to_address_json?.city}, {selectedShipment.to_address_json?.state}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* AI Analysis */}
                <Card className="bg-gradient-to-r from-blue-800/50 to-cyan-800/50 border-blue-500/30 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Brain className="w-5 h-5 text-cyan-400" />
                      AI Intelligence
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="space-y-4">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                      </div>
                    ) : analysis || existingInsight ? (
                      <div className="space-y-6">
                        {/* Summary */}
                        <div>
                          <h4 className="text-cyan-300 text-sm font-medium mb-2">AI Summary</h4>
                          <p className="text-white">
                            {analysis?.summary || existingInsight?.ai_summary}
                          </p>
                        </div>

                        {/* Current Interpretation */}
                        {(analysis?.currentInterpretation || existingInsight?.current_interpretation) && (
                          <div>
                            <h4 className="text-cyan-300 text-sm font-medium mb-2">What's Actually Happening</h4>
                            <p className="text-slate-300">
                              {analysis?.currentInterpretation || existingInsight?.current_interpretation}
                            </p>
                          </div>
                        )}

                        {/* Risk & Confidence */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-slate-700/50 rounded-lg p-3">
                            <p className="text-slate-400 text-xs mb-1">Risk Level</p>
                            <Badge className={getRiskColor(analysis?.riskLevel || existingInsight?.risk_level || 'low')}>
                              {analysis?.riskLevel || existingInsight?.risk_level || 'Low'}
                            </Badge>
                          </div>
                          <div className="bg-slate-700/50 rounded-lg p-3">
                            <p className="text-slate-400 text-xs mb-1">Confidence</p>
                            <div className="flex items-center gap-2">
                              <Progress 
                                value={(analysis?.confidenceScore || existingInsight?.confidence_score || 0) * 100} 
                                className="h-2 flex-1"
                              />
                              <span className="text-white text-sm">
                                {Math.round((analysis?.confidenceScore || existingInsight?.confidence_score || 0) * 100)}%
                              </span>
                            </div>
                          </div>
                          <div className="bg-slate-700/50 rounded-lg p-3">
                            <p className="text-slate-400 text-xs mb-1">Delay Probability</p>
                            <div className="flex items-center gap-2">
                              <Progress 
                                value={(analysis?.delayProbability || existingInsight?.delay_probability || 0) * 100} 
                                className="h-2 flex-1"
                              />
                              <span className="text-white text-sm">
                                {Math.round((analysis?.delayProbability || existingInsight?.delay_probability || 0) * 100)}%
                              </span>
                            </div>
                          </div>
                          <div className="bg-slate-700/50 rounded-lg p-3">
                            <p className="text-slate-400 text-xs mb-1">Predicted Delivery</p>
                            <p className="text-white text-sm">
                              {analysis?.predictedDeliveryDate 
                                ? new Date(analysis.predictedDeliveryDate).toLocaleDateString()
                                : existingInsight?.predicted_delivery_date
                                  ? new Date(existingInsight.predicted_delivery_date).toLocaleDateString()
                                  : 'N/A'}
                            </p>
                          </div>
                        </div>

                        {/* Delay Reason */}
                        {(analysis?.delayReason || existingInsight?.delay_reason) && (
                          <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertTriangle className="w-5 h-5 text-orange-400" />
                              <h4 className="text-orange-300 font-medium">Potential Delay Reason</h4>
                            </div>
                            <p className="text-slate-300">
                              {analysis?.delayReason || existingInsight?.delay_reason}
                            </p>
                          </div>
                        )}

                        {/* Recommendations */}
                        {(analysis?.recommendations || existingInsight?.recommendations)?.length > 0 && (
                          <div>
                            <h4 className="text-cyan-300 text-sm font-medium mb-3">Recommendations</h4>
                            <div className="space-y-2">
                              {(analysis?.recommendations || existingInsight?.recommendations || []).map((rec: string, i: number) => (
                                <div key={i} className="flex items-start gap-2 bg-slate-700/50 rounded-lg p-3">
                                  <TrendingUp className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                                  <p className="text-white text-sm">{rec}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-400">
                        <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Click "Re-analyze" to generate AI insights</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="bg-slate-800/80 border-slate-700 backdrop-blur-sm">
                <CardContent className="py-16 text-center text-slate-400">
                  <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-medium text-white mb-2">Select a Shipment</h3>
                  <p>Choose a shipment from the list to view AI intelligence</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShipmentIntelligencePage;
