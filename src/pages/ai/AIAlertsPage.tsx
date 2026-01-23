import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw,
  Clock,
  Package,
  Truck,
  Filter,
  XCircle
} from 'lucide-react';
import { useAILogistics } from '@/hooks/useAILogistics';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

const AIAlertsPage: React.FC = () => {
  const { user } = useAuth();
  const { isLoading, alerts, fetchAlerts, resolveAlert } = useAILogistics();
  const [filter, setFilter] = useState<'all' | 'unresolved' | 'resolved'>('all');

  useEffect(() => {
    if (user) {
      fetchAlerts();
    }
  }, [user]);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="w-5 h-5 text-red-400" />;
      case 'high': return <AlertTriangle className="w-5 h-5 text-orange-400" />;
      case 'medium': return <Clock className="w-5 h-5 text-yellow-400" />;
      default: return <Bell className="w-5 h-5 text-blue-400" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/20 border-red-500/30 text-red-300';
      case 'high': return 'bg-orange-500/20 border-orange-500/30 text-orange-300';
      case 'medium': return 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300';
      default: return 'bg-blue-500/20 border-blue-500/30 text-blue-300';
    }
  };

  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case 'high_delay_risk': return '⏰';
      case 'missing_scans': return '📡';
      case 'carrier_anomaly': return '🚚';
      case 'sla_risk': return '📋';
      case 'lost_package': return '❌';
      case 'customs_hold': return '🛃';
      case 'delivery_exception': return '⚠️';
      default: return '🔔';
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'unresolved') return !alert.is_resolved;
    if (filter === 'resolved') return alert.is_resolved;
    return true;
  });

  const unresolvedCount = alerts.filter(a => !a.is_resolved).length;
  const criticalCount = alerts.filter(a => !a.is_resolved && a.severity === 'critical').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/25">
              <Bell className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Alerts & Automation</h1>
              <p className="text-red-200">AI-triggered alerts and automated responses</p>
            </div>
          </div>
          <Button 
            onClick={fetchAlerts} 
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Alerts
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-slate-800/80 border-slate-700 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Alerts</p>
                  <p className="text-3xl font-bold text-white">{alerts.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <Bell className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/80 border-slate-700 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Unresolved</p>
                  <p className="text-3xl font-bold text-orange-400">{unresolvedCount}</p>
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
                  <p className="text-slate-400 text-sm">Critical</p>
                  <p className="text-3xl font-bold text-red-400">{criticalCount}</p>
                </div>
                <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts List */}
        <Card className="bg-slate-800/80 border-slate-700 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                Alert Feed
              </CardTitle>
              <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
                <TabsList className="bg-slate-700">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="unresolved">Unresolved</TabsTrigger>
                  <TabsTrigger value="resolved">Resolved</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array(5).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : filteredAlerts.length > 0 ? (
              <div className="space-y-3">
                {filteredAlerts.map((alert) => (
                  <div 
                    key={alert.id} 
                    className={`rounded-xl p-5 border transition-all ${
                      alert.is_resolved 
                        ? 'bg-slate-700/30 border-slate-600 opacity-60' 
                        : 'bg-slate-700/50 border-slate-600'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getSeverityColor(alert.severity).replace('text-', 'bg-').split(' ')[0]}`}>
                          <span className="text-xl">{getAlertTypeIcon(alert.alert_type)}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getSeverityColor(alert.severity)}>
                              {alert.severity}
                            </Badge>
                            <span className="text-white font-medium">{alert.title}</span>
                            {alert.is_resolved && (
                              <Badge className="bg-green-500/20 text-green-300">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Resolved
                              </Badge>
                            )}
                          </div>
                          <p className="text-slate-400 text-sm mb-2">{alert.description}</p>
                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            {alert.tracking_code && (
                              <span className="flex items-center gap-1">
                                <Package className="w-3 h-3" />
                                {alert.tracking_code}
                              </span>
                            )}
                            {alert.carrier && (
                              <span className="flex items-center gap-1">
                                <Truck className="w-3 h-3" />
                                {alert.carrier}
                              </span>
                            )}
                            <span>{new Date(alert.created_at).toLocaleString()}</span>
                          </div>
                          {alert.suggested_action && (
                            <div className="mt-3 bg-slate-800/50 rounded-lg p-3">
                              <p className="text-yellow-400 text-sm">
                                💡 {alert.suggested_action}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      {!alert.is_resolved && (
                        <Button 
                          size="sm" 
                          onClick={() => resolveAlert(alert.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500 opacity-50" />
                <h3 className="text-xl font-medium text-white mb-2">No Alerts</h3>
                <p>
                  {filter === 'unresolved' 
                    ? 'All alerts have been resolved' 
                    : 'No alerts to display'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AIAlertsPage;
