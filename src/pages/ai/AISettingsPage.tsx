import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { 
  Settings, 
  Brain,
  Bell,
  Clock,
  Shield,
  Zap,
  Save,
  RefreshCw
} from 'lucide-react';
import { toast } from '@/components/ui/sonner';

const AISettingsPage: React.FC = () => {
  const [settings, setSettings] = useState({
    autoAnalyze: true,
    delayPrediction: true,
    carrierMonitoring: true,
    customerMessageGeneration: true,
    alertsEnabled: true,
    criticalAlertsOnly: false,
    analysisFrequency: 60,
    confidenceThreshold: 70,
    delayRiskThreshold: 50,
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success('AI settings saved successfully');
    setIsSaving(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-r from-slate-600 to-slate-700 rounded-2xl flex items-center justify-center shadow-lg">
              <Settings className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">AI Settings</h1>
              <p className="text-slate-400">Configure AI Logistics Intelligence behavior</p>
            </div>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSaving ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Settings
          </Button>
        </div>

        {/* AI Features */}
        <Card className="bg-slate-800/80 border-slate-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-400" />
              AI Features
            </CardTitle>
            <CardDescription className="text-slate-400">
              Enable or disable AI-powered features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-white">Automatic Shipment Analysis</Label>
                <p className="text-sm text-slate-400">AI analyzes new shipments automatically</p>
              </div>
              <Switch 
                checked={settings.autoAnalyze}
                onCheckedChange={(checked) => setSettings({...settings, autoAnalyze: checked})}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-white">Delay Prediction</Label>
                <p className="text-sm text-slate-400">Predict delays before they happen</p>
              </div>
              <Switch 
                checked={settings.delayPrediction}
                onCheckedChange={(checked) => setSettings({...settings, delayPrediction: checked})}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-white">Carrier Performance Monitoring</Label>
                <p className="text-sm text-slate-400">Continuously analyze carrier performance</p>
              </div>
              <Switch 
                checked={settings.carrierMonitoring}
                onCheckedChange={(checked) => setSettings({...settings, carrierMonitoring: checked})}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-white">Customer Message Generation</Label>
                <p className="text-sm text-slate-400">Auto-generate customer support responses</p>
              </div>
              <Switch 
                checked={settings.customerMessageGeneration}
                onCheckedChange={(checked) => setSettings({...settings, customerMessageGeneration: checked})}
              />
            </div>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card className="bg-slate-800/80 border-slate-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-red-400" />
              Alert Settings
            </CardTitle>
            <CardDescription className="text-slate-400">
              Configure alert notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-white">Enable Alerts</Label>
                <p className="text-sm text-slate-400">Receive AI-generated alerts</p>
              </div>
              <Switch 
                checked={settings.alertsEnabled}
                onCheckedChange={(checked) => setSettings({...settings, alertsEnabled: checked})}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-white">Critical Alerts Only</Label>
                <p className="text-sm text-slate-400">Only show critical and high severity alerts</p>
              </div>
              <Switch 
                checked={settings.criticalAlertsOnly}
                onCheckedChange={(checked) => setSettings({...settings, criticalAlertsOnly: checked})}
              />
            </div>
          </CardContent>
        </Card>

        {/* Thresholds */}
        <Card className="bg-slate-800/80 border-slate-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              AI Thresholds
            </CardTitle>
            <CardDescription className="text-slate-400">
              Adjust AI sensitivity and thresholds
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-white">Analysis Frequency</Label>
                <span className="text-slate-400">{settings.analysisFrequency} minutes</span>
              </div>
              <Slider
                value={[settings.analysisFrequency]}
                onValueChange={([value]) => setSettings({...settings, analysisFrequency: value})}
                min={15}
                max={240}
                step={15}
                className="w-full"
              />
              <p className="text-xs text-slate-500">How often AI runs background analysis</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-white">Confidence Threshold</Label>
                <span className="text-slate-400">{settings.confidenceThreshold}%</span>
              </div>
              <Slider
                value={[settings.confidenceThreshold]}
                onValueChange={([value]) => setSettings({...settings, confidenceThreshold: value})}
                min={50}
                max={95}
                step={5}
                className="w-full"
              />
              <p className="text-xs text-slate-500">Minimum confidence for AI predictions to be shown</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-white">Delay Risk Threshold</Label>
                <span className="text-slate-400">{settings.delayRiskThreshold}%</span>
              </div>
              <Slider
                value={[settings.delayRiskThreshold]}
                onValueChange={([value]) => setSettings({...settings, delayRiskThreshold: value})}
                min={20}
                max={80}
                step={5}
                className="w-full"
              />
              <p className="text-xs text-slate-500">Minimum delay probability to trigger alerts</p>
            </div>
          </CardContent>
        </Card>

        {/* Data & Privacy */}
        <Card className="bg-slate-800/80 border-slate-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-400" />
              Data & Privacy
            </CardTitle>
            <CardDescription className="text-slate-400">
              AI data handling and privacy settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-slate-700/50 rounded-lg p-4">
              <h4 className="text-white font-medium mb-2">How AI Uses Your Data</h4>
              <ul className="text-slate-400 text-sm space-y-2">
                <li>• AI only reads your shipment and tracking data</li>
                <li>• AI never modifies or updates carrier data</li>
                <li>• All AI analysis is stored in separate tables</li>
                <li>• Your data is never shared with third parties</li>
                <li>• AI predictions are based solely on your historical data</li>
              </ul>
            </div>
            <Button variant="outline" className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10">
              Delete All AI Data
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AISettingsPage;
