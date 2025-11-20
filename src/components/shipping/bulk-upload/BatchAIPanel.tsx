import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Brain, Star, Clock, DollarSign, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import CarrierLogo from '../CarrierLogo';

interface BatchAIPanelProps {
  selectedShipment: any;
  isOpen: boolean;
  onClose: () => void;
}

interface AIAnalysis {
  overallScore: number;
  reliabilityScore: number;
  speedScore: number;
  costScore: number;
  serviceQualityScore: number;
  trackingScore: number;
  recommendation: string;
  labels: {
    isCheapest: boolean;
    isFastest: boolean;
    isMostReliable: boolean;
    isMostEfficient: boolean;
    isAIRecommended: boolean;
  };
}

const BatchAIPanel: React.FC<BatchAIPanelProps> = ({
  selectedShipment,
  isOpen,
  onClose
}) => {
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const analyzeRate = async () => {
    if (!selectedShipment || !selectedShipment.availableRates || selectedShipment.availableRates.length === 0) {
      toast.error('No rates available to analyze');
      return;
    }
    
    const selectedRate = selectedShipment.availableRates.find((r: any) => r.id === selectedShipment.selectedRateId);
    if (!selectedRate) {
      toast.error('Please select a rate first');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('analyze-shipping-rate', {
        body: {
          selectedRate,
          allRates: selectedShipment.availableRates,
          context: {
            totalRates: selectedShipment.availableRates.length,
            priceRange: {
              min: Math.min(...selectedShipment.availableRates.map((r: any) => parseFloat(r.rate))),
              max: Math.max(...selectedShipment.availableRates.map((r: any) => parseFloat(r.rate)))
            }
          }
        }
      });

      if (error) {
        console.error('Error analyzing rate:', error);
        toast.error('Failed to analyze rate');
        return;
      }

      setAnalysis(data);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to analyze rate');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && selectedShipment) {
      analyzeRate();
    }
  }, [isOpen, selectedShipment?.selectedRateId]);

  if (!isOpen) return null;

  const selectedRate = selectedShipment?.availableRates?.find((r: any) => r.id === selectedShipment.selectedRateId);

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl border-l border-gray-200 z-50 overflow-y-auto">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            <h2 className="text-xl font-bold">AI Analysis</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <div className="animate-pulse bg-gray-200 h-20 rounded-lg"></div>
            <div className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>
            <div className="animate-pulse bg-gray-200 h-20 rounded-lg"></div>
          </div>
        ) : selectedRate && analysis ? (
          <>
            {/* Selected Rate Card */}
            <Card className="border-2 border-blue-500 bg-blue-50/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Selected Rate</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <CarrierLogo carrier={selectedRate.carrier} className="h-8" />
                  <div>
                    <div className="font-semibold">{selectedRate.carrier}</div>
                    <div className="text-sm text-gray-600">{selectedRate.service}</div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-blue-600">${selectedRate.rate}</span>
                  {selectedRate.delivery_days && (
                    <Badge variant="secondary">
                      <Clock className="h-3 w-3 mr-1" />
                      {selectedRate.delivery_days} days
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* AI Scores */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">AI Scores</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ScoreBar label="Overall" score={analysis.overallScore} icon={<Star className="h-4 w-4" />} color="blue" />
                <ScoreBar label="Cost" score={analysis.costScore} icon={<DollarSign className="h-4 w-4" />} color="green" />
                <ScoreBar label="Speed" score={analysis.speedScore} icon={<Clock className="h-4 w-4" />} color="orange" />
                <ScoreBar label="Reliability" score={analysis.reliabilityScore} icon={<Shield className="h-4 w-4" />} color="purple" />
              </CardContent>
            </Card>

            {/* AI Recommendation */}
            <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Brain className="h-4 w-4 text-purple-600" />
                  AI Recommendation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 leading-relaxed">{analysis.recommendation}</p>
              </CardContent>
            </Card>

            {/* Labels */}
            {Object.entries(analysis.labels).some(([_, value]) => value) && (
              <div className="flex flex-wrap gap-2">
                {analysis.labels.isCheapest && <Badge className="bg-green-100 text-green-800">💰 Cheapest</Badge>}
                {analysis.labels.isFastest && <Badge className="bg-yellow-100 text-yellow-800">⚡ Fastest</Badge>}
                {analysis.labels.isMostReliable && <Badge className="bg-blue-100 text-blue-800">🛡️ Most Reliable</Badge>}
                {analysis.labels.isMostEfficient && <Badge className="bg-purple-100 text-purple-800">✅ Most Efficient</Badge>}
                {analysis.labels.isAIRecommended && <Badge className="bg-pink-100 text-pink-800">🧠 AI Recommended</Badge>}
              </div>
            )}
          </>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center text-gray-500">
              <Brain className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>Select a rate to see AI analysis</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

const ScoreBar: React.FC<{ label: string; score: number; icon: React.ReactNode; color: string }> = ({ label, score, icon, color }) => {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
    purple: 'bg-purple-500',
  };

  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <div className="flex items-center gap-1 text-gray-600">
          {icon}
          <span>{label}</span>
        </div>
        <span className="font-semibold">{score}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${colorClasses[color]}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
};

export default BatchAIPanel;
