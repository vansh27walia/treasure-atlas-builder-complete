import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  AlertTriangle, 
  TrendingUp, 
  Package, 
  Clock, 
  RefreshCw,
  CheckCircle2,
  XCircle,
  Zap,
  Target,
  Shield,
  Activity
} from 'lucide-react';
import { useAILogistics } from '@/hooks/useAILogistics';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

const AICommandCenterPage: React.FC = () => {
  const { user } = useAuth();
  const { 
    isLoading, 
    rateLimited,
    overview, 
    alerts, 
    stats, 
    predictions,
    fetchOverview,
    resolveAlert
  } = useAILogistics();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      let cancelled = false;
      (async () => {
        try {
          setLoadError(null);
          await fetchOverview();
        } catch (e: any) {
          if (cancelled) return;
          if (e?.message === 'RATE_LIMITED') {
            setLoadError('Rate limit exceeded. Please wait ~30 seconds and try again.');
          } else if (e?.message === 'PAYMENT_REQUIRED') {
            setLoadError('AI credits exhausted. Please add funds to continue.');
          } else {
            setLoadError('Failed to load AI intelligence. Please try again.');
          }
        }
      })();

      return () => {
        cancelled = true;
      };
    }
  }, [user, fetchOverview]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      setLoadError(null);
      await fetchOverview();
    } catch (e: any) {
      if (e?.message === 'RATE_LIMITED') {
        setLoadError('Rate limit exceeded. Please wait ~30 seconds and try again.');
      } else if (e?.message === 'PAYMENT_REQUIRED') {
        setLoadError('AI credits exhausted. Please add funds to continue.');
      } else {
        setLoadError('Failed to refresh AI intelligence. Please try again.');
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  const unresolvedAlerts = alerts.filter(a => !a.is_resolved);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">AI Command Center</h1>
              <p className="text-purple-200">Real-time logistics intelligence & predictions</p>
            </div>
          </div>
          <Button 
            onClick={handleRefresh} 
            disabled={isRefreshing || isLoading || rateLimited}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Intelligence
          </Button>
        </div>

        {(loadError || rateLimited) && (
          <Card className="bg-slate-800/80 border-slate-700 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-white font-medium">AI temporarily unavailable</p>
                  <p className="text-slate-400 text-sm mt-1">
                    {loadError || 'Rate limit exceeded. Please wait ~30 seconds and try again.'}
                  </p>
                </div>
                <Button
                  onClick={handleRefresh}
                  disabled={isRefreshing || isLoading}
                  variant="outline"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Health Score & Headline */}
        <Card className="bg-gradient-to-r from-purple-800/50 to-pink-800/50 border-purple-500/30 backdrop-blur-sm">
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="flex items-center gap-6">
                <Skeleton className="w-24 h-24 rounded-full" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-5 w-1/2" />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg">
                    <span className="text-3xl font-bold text-white">
                      {overview?.metrics?.healthScore || 85}
                    </span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {overview?.headline || 'Operations running smoothly'}
                  </h2>
                  <p className="text-purple-200">
                    {overview?.riskSummary || 'All systems operational with no major issues detected'}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-slate-800/80 border-slate-700 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Active Shipments</p>
                  <p className="text-3xl font-bold text-white">{stats.activeShipments}</p>
                </div>
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/80 border-slate-700 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">At Risk</p>
                  <p className="text-3xl font-bold text-orange-400">
                    {overview?.metrics?.atRiskShipments || predictions.filter(p => p.delay_probability > 0.5).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/80 border-slate-700 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Predicted Delays (24h)</p>
                  <p className="text-3xl font-bold text-yellow-400">
                    {overview?.metrics?.predictedDelays24h || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/80 border-slate-700 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Unresolved Alerts</p>
                  <p className="text-3xl font-bold text-red-400">{unresolvedAlerts.length}</p>
                </div>
                <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                  <Activity className="w-6 h-6 text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Priorities */}
          <Card className="bg-slate-800/80 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-400" />
                Top Priorities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                Array(3).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))
              ) : overview?.topPriorities?.length ? (
                overview.topPriorities.map((priority, index) => (
                  <div key={index} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {priority.priority}
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">{priority.issue}</p>
                        <p className="text-slate-400 text-sm mt-1">{priority.action}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No priority issues detected</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Alerts */}
          <Card className="bg-slate-800/80 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-400" />
                Active Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-80 overflow-y-auto">
              {isLoading ? (
                Array(3).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))
              ) : unresolvedAlerts.length > 0 ? (
                unresolvedAlerts.slice(0, 5).map((alert) => (
                  <div key={alert.id} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={`${getSeverityColor(alert.severity)} text-white text-xs`}>
                            {alert.severity}
                          </Badge>
                          <span className="text-white font-medium text-sm">{alert.title}</span>
                        </div>
                        <p className="text-slate-400 text-xs line-clamp-2">{alert.description}</p>
                        {alert.suggested_action && (
                          <p className="text-purple-400 text-xs mt-2">
                            <Zap className="w-3 h-3 inline mr-1" />
                            {alert.suggested_action}
                          </p>
                        )}
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => resolveAlert(alert.id)}
                        className="text-green-400 hover:text-green-300 hover:bg-green-500/10"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500 opacity-50" />
                  <p>No active alerts</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* AI Recommendations */}
        <Card className="bg-slate-800/80 border-slate-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              AI Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isLoading ? (
                Array(4).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))
              ) : overview?.recommendations?.length ? (
                overview.recommendations.map((rec, index) => (
                  <div key={index} className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-lg p-4 border border-purple-500/30">
                    <div className="flex items-start gap-3">
                      <TrendingUp className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                      <p className="text-white text-sm">{rec}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center py-8 text-slate-400">
                  <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>AI is analyzing your data for recommendations...</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Insights */}
        {overview?.insights && overview.insights.length > 0 && (
          <Card className="bg-slate-800/80 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Brain className="w-5 h-5 text-blue-400" />
                Key Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {overview.insights.map((insight, index) => (
                  <Badge 
                    key={index} 
                    variant="outline" 
                    className="bg-blue-500/10 border-blue-500/30 text-blue-300 px-3 py-2"
                  >
                    {insight}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AICommandCenterPage;
