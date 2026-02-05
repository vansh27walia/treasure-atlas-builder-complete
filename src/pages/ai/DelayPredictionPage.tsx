import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, AlertTriangle, RefreshCw, TrendingUp, Package, Zap, Target, CheckCircle2, XCircle } from 'lucide-react';
import { useAILogistics } from '@/hooks/useAILogistics';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
const DelayPredictionPage: React.FC = () => {
  const {
    user
  } = useAuth();
  const {
    isLoading,
    predictions,
    predictDelays
  } = useAILogistics();
  const [summary, setSummary] = useState<string>('');
  useEffect(() => {
    if (user) {
      handlePredictDelays();
    }
  }, [user]);
  const handlePredictDelays = async () => {
    try {
      const result = await predictDelays();
      if (result.summary) setSummary(result.summary);
    } catch (error) {
      console.error('Prediction error:', error);
    }
  };
  const getDelayTypeIcon = (type: string) => {
    switch (type) {
      case 'customs':
        return '🛃';
      case 'carrier_backlog':
        return '📦';
      case 'weather':
        return '🌧️';
      case 'missed_scan':
        return '📡';
      case 'handoff_failure':
        return '🔄';
      case 'lost_package':
        return '❌';
      default:
        return '⚠️';
    }
  };
  const getDelayTypeLabel = (type: string) => {
    switch (type) {
      case 'customs':
        return 'Customs Hold';
      case 'carrier_backlog':
        return 'Carrier Backlog';
      case 'weather':
        return 'Weather Disruption';
      case 'missed_scan':
        return 'Missed Scan';
      case 'handoff_failure':
        return 'Handoff Failure';
      case 'lost_package':
        return 'Lost Package Risk';
      default:
        return 'Other';
    }
  };
  const getRiskColor = (probability: number) => {
    if (probability >= 0.8) return 'text-red-400 bg-red-500/20';
    if (probability >= 0.6) return 'text-orange-400 bg-orange-500/20';
    if (probability >= 0.4) return 'text-yellow-400 bg-yellow-500/20';
    return 'text-green-400 bg-green-500/20';
  };
  const highRiskCount = predictions.filter(p => p.delay_probability >= 0.6).length;
  const mediumRiskCount = predictions.filter(p => p.delay_probability >= 0.4 && p.delay_probability < 0.6).length;
  return <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/25">
              <Clock className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Delay & Risk Prediction</h1>
              <p className="text-orange-200">Predict delays before they happen</p>
            </div>
          </div>
          <Button onClick={handlePredictDelays} disabled={isLoading} className="bg-orange-600 hover:bg-orange-700">
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Run Prediction
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-slate-800/80 border-slate-700 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">High Risk Shipments</p>
                  <p className="text-3xl font-bold text-red-400">{highRiskCount}</p>
                </div>
                <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/80 border-slate-700 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Medium Risk</p>
                  <p className="text-3xl font-bold text-yellow-400">{mediumRiskCount}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/80 border-slate-700 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Analyzed</p>
                  <p className="text-3xl font-bold text-white">{predictions.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Card */}
        {summary && <Card className="bg-gradient-to-r from-orange-800/50 to-red-800/50 border-orange-500/30 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2 text-black">AI Risk Summary</h3>
                  <p className="text-black">{summary}</p>
                </div>
              </div>
            </CardContent>
          </Card>}

        {/* Predictions List */}
        <Card className="bg-slate-800/80 border-slate-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
              Risk Predictions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <div className="space-y-4">
                {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
              </div> : predictions.length > 0 ? <div className="space-y-4">
                {predictions.sort((a, b) => b.delay_probability - a.delay_probability).map(prediction => <div key={prediction.id} className="bg-slate-700/50 rounded-xl p-5 border border-slate-600">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-2xl">{getDelayTypeIcon(prediction.delay_type)}</span>
                          <div>
                            <p className="text-white font-medium font-mono">
                              {prediction.tracking_code || prediction.shipment_id}
                            </p>
                            <Badge variant="outline" className="text-xs mt-1">
                              {getDelayTypeLabel(prediction.delay_type)}
                            </Badge>
                          </div>
                        </div>

                        {/* Risk Meters */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-slate-400 text-sm">Delay Probability</span>
                              <span className={`text-sm font-bold ${getRiskColor(prediction.delay_probability).split(' ')[0]}`}>
                                {Math.round(prediction.delay_probability * 100)}%
                              </span>
                            </div>
                            <Progress value={prediction.delay_probability * 100} className="h-2" />
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-slate-400 text-sm">Confidence</span>
                              <span className="text-sm font-bold text-blue-400">
                                {Math.round(prediction.confidence_score * 100)}%
                              </span>
                            </div>
                            <Progress value={prediction.confidence_score * 100} className="h-2" />
                          </div>
                        </div>

                        {/* Predicted Delay */}
                        {prediction.predicted_delay_hours > 0 && <div className="flex items-center gap-2 mb-3">
                            <Clock className="w-4 h-4 text-orange-400" />
                            <span className="text-orange-300 text-sm">
                              Predicted delay: ~{prediction.predicted_delay_hours} hours
                            </span>
                          </div>}

                        {/* Root Cause */}
                        {prediction.root_cause && <div className="bg-slate-800/50 rounded-lg p-3 mb-3">
                            <p className="text-slate-300 text-sm">
                              <span className="text-slate-500">Root Cause:</span> {prediction.root_cause}
                            </p>
                          </div>}

                        {/* Reasoning */}
                        {prediction.reasoning && <p className="text-slate-400 text-sm mb-3">{prediction.reasoning}</p>}

                        {/* Suggested Actions */}
                        {prediction.suggested_actions && prediction.suggested_actions.length > 0 && <div className="space-y-2">
                            <p className="text-slate-500 text-xs uppercase tracking-wide">Suggested Actions</p>
                            {prediction.suggested_actions.map((action: string, i: number) => <div key={i} className="flex items-start gap-2">
                                <TrendingUp className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                                <span className="text-white text-sm">{action}</span>
                              </div>)}
                          </div>}
                      </div>

                      {/* Risk Badge */}
                      <div className={`px-4 py-2 rounded-xl ${getRiskColor(prediction.delay_probability)}`}>
                        <p className="text-xs uppercase tracking-wide">Risk</p>
                        <p className="text-2xl font-bold">
                          {prediction.delay_probability >= 0.8 ? 'Critical' : prediction.delay_probability >= 0.6 ? 'High' : prediction.delay_probability >= 0.4 ? 'Medium' : 'Low'}
                        </p>
                      </div>
                    </div>
                  </div>)}
              </div> : <div className="text-center py-12 text-slate-400">
                <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500 opacity-50" />
                <h3 className="text-xl font-medium text-white mb-2">No Delays Predicted</h3>
                <p>All active shipments are on track for on-time delivery</p>
              </div>}
          </CardContent>
        </Card>
      </div>
    </div>;
};
export default DelayPredictionPage;