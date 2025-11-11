import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { X, Brain, Star, Clock, DollarSign, Shield, Zap, Truck, Award, MapPin, MessageCircle, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import CarrierLogo from '../CarrierLogo';
import { formatWeightDisplay } from '@/utils/weightConversion';
interface BulkAIOverviewPanelProps {
  selectedShipment?: any;
  allShipments: any[];
  isOpen: boolean;
  onClose: () => void;
  onRateChange: (shipmentId: string, rateId: string) => void;
  onOptimizationChange: (filter: string, shipmentId?: string) => void;
}
interface AIAnalysis {
  overallScore: number;
  reliabilityScore: number;
  speedScore: number;
  costScore: number;
  coverageScore?: number;
  recommendation: string;
  detailedAnalysis?: string;
  labels: {
    isCheapest: boolean;
    isFastest: boolean;
    isMostReliable: boolean;
    isMostEfficient: boolean;
    isAIRecommended: boolean;
  };
}
interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}
const BulkAIOverviewPanel: React.FC<BulkAIOverviewPanelProps> = ({
  selectedShipment,
  allShipments,
  isOpen,
  onClose,
  onRateChange,
  onOptimizationChange
}) => {
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisMode, setAnalysisMode] = useState<'individual' | 'combined'>('individual');
  const [selectedShipmentId, setSelectedShipmentId] = useState<string>('');

  // Chat functionality
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const optimizationFilters = [{
    id: 'cheapest',
    label: 'Cheapest',
    icon: '💰',
    color: 'bg-green-100 text-green-800'
  }, {
    id: 'fastest',
    label: 'Fastest',
    icon: '⚡',
    color: 'bg-yellow-100 text-yellow-800'
  }, {
    id: 'balanced',
    label: 'Most Efficient',
    icon: '✅',
    color: 'bg-blue-100 text-blue-800'
  }, {
    id: 'door-delivery',
    label: 'Door Delivery',
    icon: '📦',
    color: 'bg-purple-100 text-purple-800'
  }, {
    id: 'po-box',
    label: 'PO Box Delivery',
    icon: '📫',
    color: 'bg-indigo-100 text-indigo-800'
  }, {
    id: 'eco-friendly',
    label: 'Eco Friendly',
    icon: '🌱',
    color: 'bg-green-100 text-green-800'
  }, {
    id: '2-day',
    label: '2-Day Delivery',
    icon: '🕓',
    color: 'bg-orange-100 text-orange-800'
  }, {
    id: 'express',
    label: 'Express Delivery',
    icon: '🚀',
    color: 'bg-red-100 text-red-800'
  }, {
    id: 'most-reliable',
    label: 'Most Reliable',
    icon: '🛡️',
    color: 'bg-gray-100 text-gray-800'
  }, {
    id: 'ai-recommended',
    label: 'AI Recommended',
    icon: '🧠',
    color: 'bg-pink-100 text-pink-800'
  }];
  const analyzeRates = async () => {
    if (!allShipments.length) return;
    setIsLoading(true);
    try {
      const analysisData = analysisMode === 'individual' && selectedShipment ? {
        shipment: selectedShipment,
        allShipments,
        mode: 'individual'
      } : {
        allShipments,
        mode: 'combined'
      };
      const {
        data,
        error
      } = await supabase.functions.invoke('analyze-bulk-shipping-rates', {
        body: analysisData
      });
      if (error) {
        console.error('Error analyzing rates:', error);
        toast.error('Failed to analyze rates');
        return;
      }
      setAnalysis(data);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to analyze rates');
    } finally {
      setIsLoading(false);
    }
  };
  const handleShipmentChange = (shipmentId: string) => {
    setSelectedShipmentId(shipmentId);
    const newSelectedShipment = allShipments.find(s => s.id === shipmentId);
    if (newSelectedShipment) {
      setAnalysisMode('individual');
      analyzeRates();
    }
  };
  const handleRateChangeInternal = (rateId: string) => {
    const targetShipmentId = analysisMode === 'individual' ? selectedShipmentId || selectedShipment?.id : '';
    if (targetShipmentId) {
      onRateChange(targetShipmentId, rateId);
      toast.success('Rate updated successfully');
    }
  };
  const handleQuickChange = (filterId: string) => {
    const targetShipmentId = analysisMode === 'individual' ? selectedShipmentId || selectedShipment?.id : undefined;
    onOptimizationChange(filterId, targetShipmentId);
    toast.success(`Applied ${filterId} optimization`);
  };
  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: chatInput,
      role: 'user',
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsChatLoading(true);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('bulk-shipping-ai-chat', {
        body: {
          message: userMessage.content,
          shipments: allShipments,
          context: {
            selectedShipment: selectedShipment,
            analysisMode: analysisMode,
            totalShipments: allShipments.length
          }
        }
      });
      if (error) {
        throw new Error(error.message);
      }
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        role: 'assistant',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Failed to send message');
    } finally {
      setIsChatLoading(false);
    }
  };

  // Listen for payment or close events to auto-close sidebar
  useEffect(() => {
    const handlePaymentSuccess = () => {
      onClose();
    };
    const handlePaymentStart = () => {
      onClose();
    };
    document.addEventListener('payment-success', handlePaymentSuccess);
    document.addEventListener('payment-start', handlePaymentStart);
    document.addEventListener('payment-cancel', handlePaymentSuccess);
    return () => {
      document.removeEventListener('payment-success', handlePaymentSuccess);
      document.removeEventListener('payment-start', handlePaymentStart);
      document.removeEventListener('payment-cancel', handlePaymentSuccess);
    };
  }, [onClose]);
  useEffect(() => {
    if (isOpen) {
      if (selectedShipment) {
        setSelectedShipmentId(selectedShipment.id);
        setAnalysisMode('individual');
      } else {
        setAnalysisMode('combined');
      }
      analyzeRates();
    }
  }, [isOpen, selectedShipment, analysisMode]);
  if (!isOpen) return null;
  const currentShipment = analysisMode === 'individual' ? allShipments.find(s => s.id === selectedShipmentId) || selectedShipment : null;
  const currentRates = currentShipment?.availableRates || [];
  return <div className="fixed top-0 right-0 h-screen w-72 bg-white shadow-2xl z-50 border-l-4 border-blue-500 overflow-hidden flex flex-col">
      <Card className="h-full rounded-none border-0 flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-blue-600 to-purple-600 text-white z-10 flex-shrink-0 py-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Brain className="w-4 h-4 text-white" />
            AI Bulk Overview
            <Badge className="bg-white/20 text-white text-xs px-1">AI</Badge>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/20 h-6 w-6 p-0">
            <X className="w-3 h-3" />
          </Button>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Analysis Mode Toggle */}
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-900 flex items-center gap-1 text-sm">
              <Award className="w-3 h-3" />
              Analysis Mode
            </h4>
            <Select value={analysisMode} onValueChange={(value: 'individual' | 'combined') => setAnalysisMode(value)}>
              <SelectTrigger className="w-full h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-2 shadow-lg z-50">
                <SelectItem value="individual">Individual Shipment</SelectItem>
                <SelectItem value="combined">Combined Analysis</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Shipment Selector (for individual mode) */}
          {analysisMode === 'individual' && <div className="space-y-2">
              <h4 className="font-semibold text-gray-900 flex items-center gap-1 text-sm">
                <Truck className="w-3 h-3" />
                Select Shipment
              </h4>
              <Select value={selectedShipmentId} onValueChange={handleShipmentChange}>
                <SelectTrigger className="w-full h-8 text-xs">
                  <SelectValue placeholder="Select shipment" />
                </SelectTrigger>
                <SelectContent className="bg-white border-2 shadow-lg z-50">
                  {allShipments.map(shipment => <SelectItem key={shipment.id} value={shipment.id} className="hover:bg-gray-50">
                      <div className="flex items-center gap-2 w-full">
                        <div className="flex-1">
                          <div className="font-medium text-xs">{shipment.recipient}</div>
                          <div className="text-xs text-gray-600">
                            {shipment.carrier} - ${parseFloat(shipment.rate || 0).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>}

          {/* Rate Selector (for individual mode) */}
          {analysisMode === 'individual' && currentRates.length > 0 && <div className="space-y-2">
              <h4 className="font-semibold text-gray-900 flex items-center gap-1 text-sm">
                <Truck className="w-3 h-3" />
                Change Rate
              </h4>
              <Select value={currentShipment?.selectedRateId || ''} onValueChange={handleRateChangeInternal}>
                <SelectTrigger className="w-full h-8 text-xs">
                  <SelectValue placeholder="Select rate" />
                </SelectTrigger>
                <SelectContent className="bg-white border-2 shadow-lg z-50">
                  {currentRates.map(rate => <SelectItem key={rate.id} value={rate.id} className="hover:bg-gray-50">
                      <div className="flex items-center gap-2 w-full">
                        <CarrierLogo carrier={rate.carrier} className="w-4 h-4" />
                        <div className="flex-1">
                          <div className="font-medium text-xs">{rate.carrier} {rate.service}</div>
                          <div className="text-xs text-gray-600">
                            ${parseFloat(rate.rate).toFixed(2)} - {rate.delivery_days} days
                          </div>
                        </div>
                      </div>
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>}

          {/* Selected Rate/Shipment Info */}
          {analysisMode === 'individual' && currentShipment && <div className="p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <CarrierLogo carrier={currentShipment.carrier} className="w-6 h-6" />
                <h3 className="font-semibold text-blue-900 text-sm">{currentShipment.carrier}</h3>
              </div>
              <p className="text-lg font-bold text-blue-800">${parseFloat(currentShipment.rate || 0).toFixed(2)}</p>
              <p className="text-xs text-blue-600">To: {currentShipment.recipient}</p>
            </div>}

          {analysisMode === 'combined' && <div className="p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-6 h-6 text-green-600" />
                <h3 className="font-semibold text-green-900 text-sm">Combined Analysis</h3>
              </div>
              <p className="text-lg font-bold text-green-800">{allShipments.length} Shipments</p>
              <p className="text-xs text-green-600">Total: ${allShipments.reduce((sum, s) => sum + parseFloat(s.rate || 0), 0).toFixed(2)}</p>
            </div>}

          {/* AI Analysis */}
          {isLoading ? <div className="flex items-center justify-center py-6">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-sm">AI analyzing...</span>
            </div> : analysis ? <div className="space-y-3">
              {/* Overall Score */}
              <div className="text-center p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-800">{analysis.overallScore}/100</div>
                <div className="text-xs text-gray-600">Overall AI Score</div>
                <div className="text-xs text-blue-600 mt-1">✨ AI Recommended</div>
              </div>

              {/* Labels */}
              <div className="space-y-1">
                {analysis.labels.isCheapest && <Badge className="w-full justify-start bg-green-100 text-green-800 border-green-300 text-xs py-1">
                    💰 Cheapest option
                  </Badge>}
                {analysis.labels.isFastest && <Badge className="w-full justify-start bg-yellow-100 text-yellow-800 border-yellow-300 text-xs py-1">
                    ⚡ Fastest delivery
                  </Badge>}
                {analysis.labels.isMostReliable && <Badge className="w-full justify-start bg-blue-100 text-blue-800 border-blue-300 text-xs py-1">
                    🛡️ Most reliable
                  </Badge>}
                {analysis.labels.isMostEfficient && <Badge className="w-full justify-start bg-purple-100 text-purple-800 border-purple-300 text-xs py-1">
                    ✅ Most efficient
                  </Badge>}
              </div>

              {/* Detailed Scores */}
              <div className="space-y-2 p-2 bg-gray-50 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Shield className="w-3 h-3 text-blue-600" />
                    <span className="text-xs">Reliability</span>
                  </div>
                  <span className="font-semibold text-xs">{analysis.reliabilityScore}/100</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-green-600" />
                    <span className="text-xs">Speed</span>
                  </div>
                  <span className="font-semibold text-xs">{analysis.speedScore}/100</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-purple-600" />
                    <span className="text-xs">Cost Value</span>
                  </div>
                  <span className="font-semibold text-xs">{analysis.costScore}/100</span>
                </div>
                {analysis.coverageScore && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-orange-600" />
                      <span className="text-xs">Coverage</span>
                    </div>
                    <span className="font-semibold text-xs">{analysis.coverageScore}/100</span>
                  </div>
                )}
              </div>

              {/* AI Recommendation with detailed analysis - 5-6 lines like normal shipping */}
              <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-1 mb-2">
                  <Brain className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-blue-900 text-xs">
                    {analysis.labels.isAIRecommended ? '✨ AI Recommended' : 'AI Analysis'}
                  </span>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed mb-2">
                  {analysis.detailedAnalysis || analysis.recommendation}
                </p>
                {/* Additional context - 5-6 lines explaining shipment scenarios */}
                <p className="text-xs text-gray-600 leading-relaxed mb-2 italic">
                  {analysisMode === 'individual' && currentShipment 
                    ? `This rate is optimized for shipping to ${currentShipment.details?.to_city}, ${currentShipment.details?.to_state}. The carrier's delivery network and service level provide reliable transit with ${currentShipment.delivery_days || 'estimated'} day delivery. Consider package dimensions (${currentShipment.details?.length}"×${currentShipment.details?.width}"×${currentShipment.details?.height}"), weight (${formatWeightDisplay(currentShipment.details?.weight || 16)}), and destination requirements when finalizing your choice.`
                    : `Analyzing ${allShipments.length} shipments across multiple destinations. The recommended optimization balances cost efficiency, delivery speed, and carrier reliability. Consider regional variations, package characteristics, and delivery requirements for optimal results. Total shipping cost: $${allShipments.reduce((sum, s) => sum + parseFloat(s.rate || 0), 0).toFixed(2)}.`
                  }
                </p>
                <Button 
                  variant="default" 
                  size="sm"
                  className="w-full mt-2 h-8 text-xs bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold shadow-md"
                  onClick={() => {
                    const contextMessage = analysisMode === 'individual' && currentShipment 
                      ? `Selected shipment: ${currentShipment.recipient} - ${currentShipment.carrier} ${currentShipment.service} at $${parseFloat(currentShipment.rate || 0).toFixed(2)}, ${currentShipment.service} days. AI Score: ${analysis.overallScore}/100 (Reliability: ${analysis.reliabilityScore}, Speed: ${analysis.speedScore}, Cost: ${analysis.costScore}${analysis.coverageScore ? `, Coverage: ${analysis.coverageScore}` : ''}). Analysis: ${analysis.detailedAnalysis || analysis.recommendation}. Please provide detailed insights about this shipment and compare with other available rates.`
                      : `Bulk shipment analysis for ${allShipments.length} shipments. Total cost: $${allShipments.reduce((sum, s) => sum + parseFloat(s.rate || 0), 0).toFixed(2)}. Average AI score: ${analysis.overallScore}/100. Analysis: ${analysis.detailedAnalysis || analysis.recommendation}. Please provide optimization recommendations for the entire batch.`;
                    
                    sessionStorage.setItem('ai-chat-prefill', contextMessage);
                    document.dispatchEvent(new CustomEvent('open-ai-chatbot'));
                  }}
                >
                  <MessageCircle className="h-4 w-4 mr-1" />
                  Ask AI About This
                </Button>
              </div>
            </div> : null}

          {/* Quick Change Guide */}
          <div className="space-y-3 border border-gray-200 rounded-lg p-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-1 text-sm">
              <Zap className="w-3 h-3 text-yellow-500" />
              Quick Changes
            </h3>
            
            {/* Top 3 Quick Change Options */}
            <div className="grid grid-cols-1 gap-1">
              {optimizationFilters.slice(0, 3).map(filter => <Button key={filter.id} variant="outline" className="justify-start h-auto p-2 border hover:bg-blue-50 text-xs" onClick={() => handleQuickChange(filter.id)}>
                  <span className="mr-1">{filter.icon}</span>
                  {filter.label}
                </Button>)}
            </div>

            {/* Expandable More Options */}
            <details className="group">
              <summary className="cursor-pointer text-blue-600 font-medium hover:text-blue-800 text-xs">
                Show More ({optimizationFilters.length - 3} more)
              </summary>
              <div className="mt-2 grid grid-cols-1 gap-1">
                {optimizationFilters.slice(3).map(filter => <Button key={filter.id} variant="outline" className="justify-start h-auto p-2 text-xs border hover:bg-gray-50" onClick={() => handleQuickChange(filter.id)}>
                    <span className="mr-1">{filter.icon}</span>
                    {filter.label}
                  </Button>)}
              </div>
            </details>
          </div>
        </CardContent>

        {/* AI Chatbot Section - Fixed at bottom */}
        
      </Card>
    </div>;
};
export default BulkAIOverviewPanel;