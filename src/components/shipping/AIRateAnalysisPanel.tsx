
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Brain, Star, Clock, DollarSign, Shield, Zap, Truck, Award, MapPin, Globe, Leaf } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import CarrierLogo from './CarrierLogo';

interface AIRateAnalysisPanelProps {
  selectedRate: any;
  allRates: any[];
  isOpen: boolean;
  onClose: () => void;
  onOptimizationChange: (filter: string) => void;
}

interface AIAnalysis {
  overallScore: number;
  reliabilityScore: number;
  speedScore: number;
  costScore: number;
  serviceQualityScore: number;
  trackingScore: number;
  carbonFootprintScore: number;
  securityScore: number;
  recommendation: string;
  labels: {
    isCheapest: boolean;
    isFastest: boolean;
    isMostReliable: boolean;
    isMostEfficient: boolean;
    isAIRecommended: boolean;
    isEcoFriendly: boolean;
    isMostSecure: boolean;
  };
}

const AIRateAnalysisPanel: React.FC<AIRateAnalysisPanelProps> = ({
  selectedRate,
  allRates,
  isOpen,
  onClose,
  onOptimizationChange
}) => {
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const optimizationFilters = [
    { id: 'cheapest', label: 'Cheapest', icon: '💰', color: 'bg-green-100 text-green-800' },
    { id: 'fastest', label: 'Fastest', icon: '⚡', color: 'bg-yellow-100 text-yellow-800' },
    { id: 'balanced', label: 'Most Efficient', icon: '✅', color: 'bg-blue-100 text-blue-800' },
    { id: 'most-reliable', label: 'Most Reliable', icon: '🛡️', color: 'bg-gray-100 text-gray-800' },
    { id: 'eco-friendly', label: 'Eco Friendly', icon: '🌱', color: 'bg-green-100 text-green-800' },
    { id: 'most-secure', label: 'Most Secure', icon: '🔒', color: 'bg-red-100 text-red-800' },
    { id: 'ai-recommended', label: 'AI Recommended', icon: '🧠', color: 'bg-pink-100 text-pink-800' }
  ];

  // Enhanced AI analysis with more scoring criteria
  const analyzeRate = async () => {
    if (!selectedRate || !allRates.length) return;
    
    setIsLoading(true);
    
    try {
      // Enhanced scoring algorithm with 7 criteria
      const price = parseFloat(selectedRate.rate);
      const deliveryDays = selectedRate.delivery_days || 7;
      
      // Calculate scores out of 100 for each criterion
      const minPrice = Math.min(...allRates.map(r => parseFloat(r.rate)));
      const maxPrice = Math.max(...allRates.map(r => parseFloat(r.rate)));
      const costScore = Math.round(((maxPrice - price) / (maxPrice - minPrice)) * 100) || 100;
      
      const minDays = Math.min(...allRates.map(r => r.delivery_days || 7));
      const maxDays = Math.max(...allRates.map(r => r.delivery_days || 7));
      const speedScore = Math.round(((maxDays - deliveryDays) / (maxDays - minDays)) * 100) || 100;
      
      // Enhanced scoring for different criteria
      const reliabilityScore = selectedRate.carrier === 'USPS' ? 98 : 
                              selectedRate.carrier === 'UPS' ? 96 : 
                              selectedRate.carrier === 'FedEx' ? 94 : 85;
      
      const serviceQualityScore = selectedRate.carrier === 'FedEx' ? 95 :
                                 selectedRate.carrier === 'UPS' ? 92 :
                                 selectedRate.carrier === 'USPS' ? 88 : 80;
      
      const trackingScore = selectedRate.carrier === 'FedEx' ? 98 :
                           selectedRate.carrier === 'UPS' ? 96 :
                           selectedRate.carrier === 'USPS' ? 85 : 80;
      
      // New scoring criteria
      const carbonFootprintScore = selectedRate.carrier === 'USPS' ? 92 : // USPS has better carbon efficiency
                                  selectedRate.service?.toLowerCase().includes('ground') ? 88 :
                                  selectedRate.service?.toLowerCase().includes('overnight') ? 45 : 75;
      
      const securityScore = selectedRate.carrier === 'UPS' ? 96 :
                           selectedRate.carrier === 'FedEx' ? 94 :
                           selectedRate.carrier === 'USPS' ? 85 : 80;
      
      // Calculate overall score (weighted average)
      const overallScore = Math.round((
        costScore * 0.2 +
        speedScore * 0.2 +
        reliabilityScore * 0.15 +
        serviceQualityScore * 0.15 +
        trackingScore * 0.1 +
        carbonFootprintScore * 0.1 +
        securityScore * 0.1
      ));
      
      // Determine labels
      const isCheapest = price === minPrice;
      const isFastest = deliveryDays === minDays;
      const isMostReliable = reliabilityScore >= 95;
      const isMostEfficient = overallScore >= 85;
      const isAIRecommended = overallScore >= 80;
      const isEcoFriendly = carbonFootprintScore >= 85;
      const isMostSecure = securityScore >= 94;
      
      // Generate intelligent recommendation
      let recommendation = '';
      if (overallScore >= 90) {
        recommendation = `Excellent choice! This rate offers outstanding value with a ${overallScore}/100 overall score. It provides great balance across all criteria including reliability, cost efficiency, and service quality.`;
      } else if (overallScore >= 75) {
        recommendation = `Good selection with a ${overallScore}/100 score. This rate offers solid performance across multiple criteria and represents good value for your shipping needs.`;
      } else {
        recommendation = `This rate scores ${overallScore}/100. While it may excel in specific areas, consider exploring other options for better overall value.`;
      }
      
      const analysisResult: AIAnalysis = {
        overallScore,
        costScore,
        speedScore,
        reliabilityScore,
        serviceQualityScore,
        trackingScore,
        carbonFootprintScore,
        securityScore,
        recommendation,
        labels: {
          isCheapest,
          isFastest,
          isMostReliable,
          isMostEfficient,
          isAIRecommended,
          isEcoFriendly,
          isMostSecure
        }
      };
      
      setAnalysis(analysisResult);
      
    } catch (error) {
      console.error('Error analyzing rate:', error);
      toast.error('Failed to analyze rate');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptimizationChange = (filter: string) => {
    onOptimizationChange(filter);
    toast.success(`Applied ${optimizationFilters.find(f => f.id === filter)?.label} optimization`);
  };

  // Listen for payment events to auto-close panel
  useEffect(() => {
    const handlePaymentEvent = () => {
      onClose();
    };

    document.addEventListener('payment-start', handlePaymentEvent);
    document.addEventListener('payment-success', handlePaymentEvent);
    document.addEventListener('payment-cancel', handlePaymentEvent);
    
    return () => {
      document.removeEventListener('payment-start', handlePaymentEvent);
      document.removeEventListener('payment-success', handlePaymentEvent);
      document.removeEventListener('payment-cancel', handlePaymentEvent);
    };
  }, [onClose]);

  useEffect(() => {
    if (isOpen && selectedRate) {
      analyzeRate();
    }
  }, [isOpen, selectedRate]);

  if (!isOpen) return null;

  return (
    <div className="fixed top-0 right-0 h-screen w-96 bg-white shadow-2xl z-50 border-l-4 border-blue-500 overflow-hidden flex flex-col">
      <Card className="h-full rounded-none border-0 flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-blue-600 to-purple-600 text-white z-10 flex-shrink-0">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Brain className="w-5 h-5 text-white" />
            AI Rate Analysis
            <Badge className="bg-white/20 text-white">7 Criteria</Badge>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/20">
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Selected Rate Info */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <CarrierLogo carrier={selectedRate.carrier} className="w-8 h-8" />
              <h3 className="font-semibold text-blue-900">{selectedRate.carrier}</h3>
            </div>
            <p className="text-2xl font-bold text-blue-800">${parseFloat(selectedRate.rate || 0).toFixed(2)}</p>
            <p className="text-sm text-blue-600">{selectedRate.service}</p>
            <p className="text-xs text-blue-500">{selectedRate.delivery_days} days delivery</p>
          </div>

          {/* AI Analysis */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3">AI analyzing 7 criteria...</span>
            </div>
          ) : analysis ? (
            <div className="space-y-4">
              {/* Overall Score */}
              <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                <div className="text-3xl font-bold text-blue-800">{analysis.overallScore}/100</div>
                <div className="text-sm text-gray-600">Overall AI Score</div>
                <div className="text-sm text-blue-600 mt-1">✨ 7-Criteria Analysis</div>
              </div>

              {/* Labels */}
              <div className="space-y-2">
                {analysis.labels.isCheapest && (
                  <Badge className="w-full justify-start bg-green-100 text-green-800 border-green-300">
                    💰 Cheapest option
                  </Badge>
                )}
                {analysis.labels.isFastest && (
                  <Badge className="w-full justify-start bg-yellow-100 text-yellow-800 border-yellow-300">
                    ⚡ Fastest delivery
                  </Badge>
                )}
                {analysis.labels.isMostReliable && (
                  <Badge className="w-full justify-start bg-blue-100 text-blue-800 border-blue-300">
                    🛡️ Most reliable
                  </Badge>
                )}
                {analysis.labels.isMostEfficient && (
                  <Badge className="w-full justify-start bg-purple-100 text-purple-800 border-purple-300">
                    ✅ Most efficient
                  </Badge>
                )}
                {analysis.labels.isEcoFriendly && (
                  <Badge className="w-full justify-start bg-green-100 text-green-800 border-green-300">
                    🌱 Eco-friendly
                  </Badge>
                )}
                {analysis.labels.isMostSecure && (
                  <Badge className="w-full justify-start bg-red-100 text-red-800 border-red-300">
                    🔒 Most secure
                  </Badge>
                )}
                {analysis.labels.isAIRecommended && (
                  <Badge className="w-full justify-start bg-pink-100 text-pink-800 border-pink-300">
                    🧠 AI recommended
                  </Badge>
                )}
              </div>

              {/* Enhanced Detailed Scores - 7 Criteria */}
              <div className="space-y-2 p-4 bg-gray-50 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-600" />
                    <span className="text-sm">Reliability</span>
                  </div>
                  <span className="font-semibold text-sm">{analysis.reliabilityScore}/100</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-green-600" />
                    <span className="text-sm">Speed</span>
                  </div>
                  <span className="font-semibold text-sm">{analysis.speedScore}/100</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-purple-600" />
                    <span className="text-sm">Cost Value</span>
                  </div>
                  <span className="font-semibold text-sm">{analysis.costScore}/100</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-orange-600" />
                    <span className="text-sm">Service Quality</span>
                  </div>
                  <span className="font-semibold text-sm">{analysis.serviceQualityScore}/100</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-red-600" />
                    <span className="text-sm">Tracking</span>
                  </div>
                  <span className="font-semibold text-sm">{analysis.trackingScore}/100</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Leaf className="w-4 h-4 text-green-600" />
                    <span className="text-sm">Carbon Impact</span>
                  </div>
                  <span className="font-semibold text-sm">{analysis.carbonFootprintScore}/100</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-gray-600" />
                    <span className="text-sm">Security</span>
                  </div>
                  <span className="font-semibold text-sm">{analysis.securityScore}/100</span>
                </div>
              </div>

              {/* AI Recommendation */}
              <div className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-900">AI Recommendation</span>
                </div>
                <p className="text-sm text-gray-700">{analysis.recommendation}</p>
              </div>
            </div>
          ) : null}

          {/* Quick Optimization Options */}
          <div className="space-y-4 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              Quick Optimizations
            </h3>
            
            <div className="grid grid-cols-1 gap-2">
              {optimizationFilters.map((filter) => (
                <Button
                  key={filter.id}
                  variant="outline"
                  className="justify-start h-auto p-3 border hover:bg-blue-50"
                  onClick={() => handleOptimizationChange(filter.id)}
                >
                  <span className="mr-2">{filter.icon}</span>
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIRateAnalysisPanel;
