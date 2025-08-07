
import React, { useState, useEffect } from 'react';
import { X, Sparkles, TrendingUp, Clock, DollarSign, Shield, Leaf, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { carrierService } from '@/services/CarrierService';
import { toast } from '@/components/ui/sonner';

interface AIRateAnalysisPanelProps {
  selectedRate: any;
  allRates: any[];
  isOpen: boolean;
  onClose: () => void;
  onOptimizationChange: (filter: string) => void;
  customsInfo?: any;
}

const AIRateAnalysisPanel: React.FC<AIRateAnalysisPanelProps> = ({
  selectedRate,
  allRates,
  isOpen,
  onClose,
  onOptimizationChange,
  customsInfo
}) => {
  const [isCreatingLabel, setIsCreatingLabel] = useState(false);
  const [optimization, setOptimization] = useState('balanced');

  const handleCreateLabel = async () => {
    if (!selectedRate) return;
    
    setIsCreatingLabel(true);
    
    try {
      console.log('Creating label with customs info:', customsInfo ? 'Yes' : 'No');
      
      const result = await carrierService.createLabel(
        selectedRate.shipment_id, 
        selectedRate.id,
        customsInfo // Pass customs info to the backend
      );
      
      toast.success('Label created successfully!');
      console.log('Label created:', result);
      
      // Close the panel after successful creation
      onClose();
      
    } catch (error) {
      console.error('Error creating label:', error);
      toast.error('Failed to create label. Please try again.');
    } finally {
      setIsCreatingLabel(false);
    }
  };

  const handleOptimizationChange = (value: string) => {
    setOptimization(value);
    onOptimizationChange(value);
  };

  // Enhanced AI analysis with 7 criteria
  const getAIAnalysis = () => {
    if (!selectedRate || !allRates.length) return null;

    const rate = parseFloat(selectedRate.rate);
    const deliveryDays = selectedRate.delivery_days || 7;
    const carrier = selectedRate.carrier?.toUpperCase() || '';

    // Calculate scores for 7 different criteria (0-100)
    const reliability = getReliabilityScore(carrier);
    const speed = getSpeedScore(deliveryDays);
    const costValue = getCostValueScore(rate, allRates);
    const serviceQuality = getServiceQualityScore(carrier);
    const tracking = getTrackingScore(carrier);
    const carbonImpact = getCarbonImpactScore(carrier, deliveryDays);
    const security = getSecurityScore(carrier);

    const overallScore = Math.round((reliability + speed + costValue + serviceQuality + tracking + carbonImpact + security) / 7);

    return {
      overallScore,
      criteria: [
        { name: 'Reliability', score: reliability, icon: Shield, color: 'text-green-600' },
        { name: 'Speed', score: speed, icon: Clock, color: 'text-blue-600' },
        { name: 'Cost Value', score: costValue, icon: DollarSign, color: 'text-yellow-600' },
        { name: 'Service Quality', score: serviceQuality, icon: TrendingUp, color: 'text-purple-600' },
        { name: 'Tracking', score: tracking, icon: AlertTriangle, color: 'text-red-600' },
        { name: 'Carbon Impact', score: carbonImpact, icon: Leaf, color: 'text-green-500' },
        { name: 'Security', score: security, icon: Shield, color: 'text-indigo-600' }
      ],
      recommendation: getRecommendation(overallScore, carrier, rate, deliveryDays)
    };
  };

  const getReliabilityScore = (carrier: string) => {
    const scores = { 'USPS': 85, 'UPS': 92, 'FEDEX': 88, 'DHL': 90 };
    return scores[carrier] || 75;
  };

  const getSpeedScore = (days: number) => {
    if (days <= 1) return 100;
    if (days <= 2) return 90;
    if (days <= 3) return 80;
    if (days <= 5) return 70;
    return 50;
  };

  const getCostValueScore = (rate: number, allRates: any[]) => {
    const rates = allRates.map(r => parseFloat(r.rate)).filter(r => !isNaN(r));
    if (rates.length === 0) return 75;
    
    const minRate = Math.min(...rates);
    const maxRate = Math.max(...rates);
    
    if (maxRate === minRate) return 100;
    
    // Invert the score - lower cost = higher score
    const normalizedScore = ((maxRate - rate) / (maxRate - minRate)) * 100;
    return Math.round(normalizedScore);
  };

  const getServiceQualityScore = (carrier: string) => {
    const scores = { 'USPS': 78, 'UPS': 95, 'FEDEX': 92, 'DHL': 88 };
    return scores[carrier] || 70;
  };

  const getTrackingScore = (carrier: string) => {
    const scores = { 'USPS': 80, 'UPS': 95, 'FEDEX': 90, 'DHL': 92 };
    return scores[carrier] || 75;
  };

  const getCarbonImpactScore = (carrier: string, days: number) => {
    // Longer delivery times generally mean more carbon-efficient transport
    const baseScore = Math.min(days * 15, 100);
    const carrierMultiplier = { 'USPS': 1.1, 'UPS': 0.9, 'FEDEX': 0.8, 'DHL': 0.85 };
    return Math.round(baseScore * (carrierMultiplier[carrier] || 1));
  };

  const getSecurityScore = (carrier: string) => {
    const scores = { 'USPS': 75, 'UPS': 90, 'FEDEX': 88, 'DHL': 85 };
    return scores[carrier] || 70;
  };

  const getRecommendation = (score: number, carrier: string, rate: number, days: number) => {
    if (score >= 90) return `Excellent choice! This ${carrier} option offers outstanding value with ${days}-day delivery for $${rate}.`;
    if (score >= 80) return `Great option! This ${carrier} service provides good balance of speed and cost at $${rate}.`;
    if (score >= 70) return `Solid choice. This ${carrier} option delivers in ${days} days for $${rate} - reliable but not the fastest.`;
    return `Budget-friendly option. While not the fastest, this ${carrier} service offers good value at $${rate}.`;
  };

  const analysis = getAIAnalysis();

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-xl border-l z-50 overflow-y-auto">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-lg">AI Rate Analysis</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Optimization Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Optimize for:</label>
          <Select value={optimization} onValueChange={handleOptimizationChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cheapest">Lowest Cost</SelectItem>
              <SelectItem value="fastest">Fastest Delivery</SelectItem>
              <SelectItem value="balanced">Best Balance</SelectItem>
              <SelectItem value="most-reliable">Most Reliable</SelectItem>
              <SelectItem value="most-efficient">Most Efficient</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Selected Rate Info */}
        {selectedRate && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Selected Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Carrier:</span>
                  <span className="font-medium">{selectedRate.carrier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Service:</span>
                  <span className="font-medium">{selectedRate.service}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Price:</span>
                  <span className="font-semibold text-green-600">${selectedRate.rate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Delivery:</span>
                  <span className="font-medium">{selectedRate.delivery_days || 'N/A'} days</span>
                </div>
                {customsInfo && (
                  <div className="pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        International
                      </Badge>
                      <span className="text-xs text-muted-foreground">Customs info attached</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Analysis */}
        {analysis && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                AI Score: {analysis.overallScore}/100
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Overall Progress */}
                <div>
                  <Progress value={analysis.overallScore} className="h-2 mb-2" />
                  <p className="text-sm text-muted-foreground">{analysis.recommendation}</p>
                </div>

                {/* Detailed Criteria */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Detailed Analysis</h4>
                  {analysis.criteria.map((criterion, index) => {
                    const Icon = criterion.icon;
                    return (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${criterion.color}`} />
                          <span className="text-sm">{criterion.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 rounded-full transition-all duration-300"
                              style={{ width: `${criterion.score}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium w-8 text-right">{criterion.score}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Create Label Button */}
        <Button 
          onClick={handleCreateLabel} 
          disabled={!selectedRate || isCreatingLabel}
          className="w-full"
          size="lg"
        >
          {isCreatingLabel ? 'Creating Label...' : 'Create Shipping Label'}
        </Button>

        {/* Additional Info */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-700">
            💡 AI analysis considers reliability, speed, cost-effectiveness, service quality, tracking capabilities, environmental impact, and security to help you make the best shipping decision.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIRateAnalysisPanel;
