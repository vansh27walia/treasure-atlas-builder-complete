import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Truck, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  RefreshCw,
  Star,
  Clock,
  DollarSign,
  Shield,
  Zap,
  Award
} from 'lucide-react';
import { useAILogistics } from '@/hooks/useAILogistics';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

const CarrierPerformancePage: React.FC = () => {
  const { user } = useAuth();
  const { isLoading, carrierScores, analyzeCarriers } = useAILogistics();
  const [recommendation, setRecommendation] = useState<string>('');

  useEffect(() => {
    if (user) {
      handleAnalyzeCarriers();
    }
  }, [user]);

  const handleAnalyzeCarriers = async () => {
    try {
      const result = await analyzeCarriers();
      if (result.overallRecommendation) {
        setRecommendation(result.overallRecommendation);
      }
    } catch (error) {
      console.error('Analysis error:', error);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'declining': return <TrendingDown className="w-4 h-4 text-red-400" />;
      default: return <Minus className="w-4 h-4 text-slate-400" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return 'text-green-400 bg-green-500/20';
      case 'declining': return 'text-red-400 bg-red-500/20';
      default: return 'text-slate-400 bg-slate-500/20';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-400';
    if (score >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const topCarrier = carrierScores.length > 0 
    ? carrierScores.reduce((a, b) => a.overall_score > b.overall_score ? a : b)
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/25">
              <Truck className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Carrier Performance AI</h1>
              <p className="text-green-200">AI-powered carrier analytics & optimization</p>
            </div>
          </div>
          <Button 
            onClick={handleAnalyzeCarriers} 
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Analyze Carriers
          </Button>
        </div>

        {/* Top Performer */}
        {topCarrier && (
          <Card className="bg-gradient-to-r from-yellow-600/30 to-amber-600/30 border-yellow-500/30 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-yellow-500 rounded-2xl flex items-center justify-center">
                  <Award className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-yellow-500 text-white">Top Performer</Badge>
                  </div>
                  <h2 className="text-2xl font-bold text-white">{topCarrier.carrier}</h2>
                  <p className="text-yellow-200">
                    Overall Score: {Math.round(topCarrier.overall_score * 100)}% | 
                    {topCarrier.total_shipments_analyzed} shipments analyzed
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-bold text-yellow-400">
                    {Math.round(topCarrier.on_time_percentage)}%
                  </p>
                  <p className="text-yellow-200 text-sm">On-Time Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recommendation */}
        {recommendation && (
          <Card className="bg-gradient-to-r from-green-800/50 to-emerald-800/50 border-green-500/30 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-2">AI Recommendation</h3>
                  <p className="text-green-200">{recommendation}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Carrier Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {isLoading ? (
            Array(4).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))
          ) : carrierScores.length > 0 ? (
            carrierScores.map((carrier) => (
              <Card key={carrier.id} className="bg-slate-800/80 border-slate-700 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Truck className="w-5 h-5 text-green-400" />
                      {carrier.carrier}
                    </span>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${getTrendColor(carrier.performance_trend)}`}>
                      {getTrendIcon(carrier.performance_trend)}
                      <span className="text-xs capitalize">{carrier.performance_trend}</span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Score Meters */}
                  <div className="grid grid-cols-4 gap-3">
                    <div className="text-center">
                      <div className="w-12 h-12 mx-auto rounded-full bg-slate-700 flex items-center justify-center mb-1">
                        <Shield className={`w-5 h-5 ${getScoreColor(carrier.reliability_score)}`} />
                      </div>
                      <p className={`text-lg font-bold ${getScoreColor(carrier.reliability_score)}`}>
                        {Math.round(carrier.reliability_score * 100)}
                      </p>
                      <p className="text-slate-400 text-xs">Reliability</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 mx-auto rounded-full bg-slate-700 flex items-center justify-center mb-1">
                        <Clock className={`w-5 h-5 ${getScoreColor(carrier.speed_score)}`} />
                      </div>
                      <p className={`text-lg font-bold ${getScoreColor(carrier.speed_score)}`}>
                        {Math.round(carrier.speed_score * 100)}
                      </p>
                      <p className="text-slate-400 text-xs">Speed</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 mx-auto rounded-full bg-slate-700 flex items-center justify-center mb-1">
                        <DollarSign className={`w-5 h-5 ${getScoreColor(carrier.cost_efficiency_score)}`} />
                      </div>
                      <p className={`text-lg font-bold ${getScoreColor(carrier.cost_efficiency_score)}`}>
                        {Math.round(carrier.cost_efficiency_score * 100)}
                      </p>
                      <p className="text-slate-400 text-xs">Cost</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 mx-auto rounded-full bg-slate-700 flex items-center justify-center mb-1">
                        <Star className={`w-5 h-5 ${getScoreColor(carrier.overall_score)}`} />
                      </div>
                      <p className={`text-lg font-bold ${getScoreColor(carrier.overall_score)}`}>
                        {Math.round(carrier.overall_score * 100)}
                      </p>
                      <p className="text-slate-400 text-xs">Overall</p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3 bg-slate-700/50 rounded-lg p-3">
                    <div className="text-center">
                      <p className="text-xl font-bold text-white">{carrier.total_shipments_analyzed}</p>
                      <p className="text-slate-400 text-xs">Shipments</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-green-400">{Math.round(carrier.on_time_percentage)}%</p>
                      <p className="text-slate-400 text-xs">On-Time</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-orange-400">{carrier.average_delay_hours.toFixed(1)}h</p>
                      <p className="text-slate-400 text-xs">Avg Delay</p>
                    </div>
                  </div>

                  {/* Best For / Weaknesses */}
                  <div className="grid grid-cols-2 gap-3">
                    {carrier.best_lanes && carrier.best_lanes.length > 0 && (
                      <div>
                        <p className="text-green-400 text-xs mb-1">Best For</p>
                        <div className="flex flex-wrap gap-1">
                          {carrier.best_lanes.slice(0, 2).map((lane: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs bg-green-500/10 border-green-500/30 text-green-300">
                              {lane}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {carrier.worst_lanes && carrier.worst_lanes.length > 0 && (
                      <div>
                        <p className="text-red-400 text-xs mb-1">Weaknesses</p>
                        <div className="flex flex-wrap gap-1">
                          {carrier.worst_lanes.slice(0, 2).map((lane: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs bg-red-500/10 border-red-500/30 text-red-300">
                              {lane}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* AI Recommendation */}
                  {carrier.ai_recommendation && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                      <p className="text-green-300 text-sm">{carrier.ai_recommendation}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="lg:col-span-2 bg-slate-800/80 border-slate-700 backdrop-blur-sm">
              <CardContent className="py-12 text-center text-slate-400">
                <Truck className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-medium text-white mb-2">No Carrier Data</h3>
                <p>Click "Analyze Carriers" to generate performance insights</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default CarrierPerformancePage;
