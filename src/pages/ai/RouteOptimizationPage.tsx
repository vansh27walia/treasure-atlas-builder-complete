import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Route, 
  DollarSign, 
  TrendingUp, 
  RefreshCw,
  ArrowRight,
  Zap,
  Target,
  Truck,
  MapPin
} from 'lucide-react';
import { useAILogistics } from '@/hooks/useAILogistics';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

const RouteOptimizationPage: React.FC = () => {
  const { user } = useAuth();
  const { isLoading, optimizeRoutes } = useAILogistics();
  const [optimization, setOptimization] = useState<any>(null);
  const [routeData, setRouteData] = useState<any>(null);

  useEffect(() => {
    if (user) {
      handleOptimize();
    }
  }, [user]);

  const handleOptimize = async () => {
    try {
      const result = await optimizeRoutes();
      if (result.optimization) setOptimization(result.optimization);
      if (result.routeData) setRouteData(result.routeData);
    } catch (error) {
      console.error('Optimization error:', error);
    }
  };

  const routes = optimization?.routes || [];
  const totalSavings = optimization?.totalPotentialSavings || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/25">
              <Route className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Cost & Route Optimization</h1>
              <p className="text-teal-200">AI-powered shipping cost reduction</p>
            </div>
          </div>
          <Button 
            onClick={handleOptimize} 
            disabled={isLoading}
            className="bg-teal-600 hover:bg-teal-700"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Optimize Routes
          </Button>
        </div>

        {/* Savings Summary */}
        {totalSavings > 0 && (
          <Card className="bg-gradient-to-r from-green-600/30 to-emerald-600/30 border-green-500/30 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center">
                    <DollarSign className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <p className="text-green-300 text-sm">Potential Monthly Savings</p>
                    <h2 className="text-4xl font-bold text-white">${totalSavings.toFixed(2)}</h2>
                  </div>
                </div>
                {optimization?.topRecommendation && (
                  <div className="max-w-md text-right">
                    <Badge className="bg-green-500 text-white mb-2">Top Recommendation</Badge>
                    <p className="text-green-200 text-sm">{optimization.topRecommendation}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Route Optimizations */}
        <Card className="bg-slate-800/80 border-slate-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-teal-400" />
              Route Optimization Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array(4).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : routes.length > 0 ? (
              <div className="space-y-4">
                {routes.map((route: any, index: number) => (
                  <div 
                    key={index} 
                    className="bg-slate-700/50 rounded-xl p-5 border border-slate-600"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <MapPin className="w-5 h-5 text-teal-400" />
                          <span className="text-white font-medium text-lg">{route.route}</span>
                        </div>

                        {/* Cost Comparison */}
                        <div className="flex items-center gap-4 mb-4">
                          <div className="bg-red-500/20 rounded-lg px-4 py-2">
                            <p className="text-red-300 text-xs">Current Avg</p>
                            <p className="text-red-400 text-xl font-bold">${route.currentAvgCost?.toFixed(2)}</p>
                          </div>
                          <ArrowRight className="w-5 h-5 text-slate-500" />
                          <div className="bg-green-500/20 rounded-lg px-4 py-2">
                            <p className="text-green-300 text-xs">Optimized</p>
                            <p className="text-green-400 text-xl font-bold">${route.optimizedCost?.toFixed(2)}</p>
                          </div>
                          <Badge className="bg-green-500 text-white h-fit">
                            -{route.savingPercentage?.toFixed(1)}%
                          </Badge>
                        </div>

                        {/* Recommendation */}
                        <p className="text-slate-300 mb-3">{route.recommendation}</p>

                        {/* Carriers */}
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4 text-teal-400" />
                            <span className="text-teal-300 text-sm">Preferred:</span>
                            <Badge variant="outline" className="border-teal-500/50 text-teal-300">
                              {route.preferredCarrier}
                            </Badge>
                          </div>
                          {route.alternativeCarriers?.length > 0 && (
                            <div className="flex items-center gap-2">
                              <span className="text-slate-400 text-sm">Alt:</span>
                              {route.alternativeCarriers.map((c: string, i: number) => (
                                <Badge key={i} variant="outline" className="border-slate-500/50 text-slate-300">
                                  {c}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Volume Opportunity */}
                        {route.volumeOpportunity && (
                          <div className="mt-3 flex items-center gap-2 text-yellow-400 text-sm">
                            <Zap className="w-4 h-4" />
                            <span>{route.volumeOpportunity}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <Route className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-medium text-white mb-2">Analyzing Routes...</h3>
                <p>Click "Optimize Routes" to find cost-saving opportunities</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Route Volume Data */}
        {routeData && Object.keys(routeData).length > 0 && (
          <Card className="bg-slate-800/80 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
                Your Route Volume Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(routeData).slice(0, 9).map(([route, data]: [string, any]) => (
                  <div key={route} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-cyan-400" />
                      <span className="text-white font-medium text-sm">{route}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-slate-400">Shipments</p>
                        <p className="text-white font-bold">{data.count}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Avg Cost</p>
                        <p className="text-white font-bold">${data.avgCost?.toFixed(2) || '0.00'}</p>
                      </div>
                    </div>
                    {data.carriers && Object.keys(data.carriers).length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {Object.entries(data.carriers).map(([carrier, count]: [string, any]) => (
                          <Badge key={carrier} variant="outline" className="text-xs">
                            {carrier}: {count}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default RouteOptimizationPage;
