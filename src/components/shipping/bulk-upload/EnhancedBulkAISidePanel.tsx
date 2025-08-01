
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { X, Brain, MessageCircle, Clock, DollarSign, Shield, Zap, Truck, Star, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import CarrierLogo from '../CarrierLogo';
import { BulkShipment } from '@/types/shipping';

interface EnhancedBulkAISidePanelProps {
  selectedShipment: BulkShipment;
  allShipments: BulkShipment[];
  isOpen: boolean;
  onClose: () => void;
  onShipmentUpdate: (shipmentId: string, updates: any) => void;
  onOptimizationChange: (filter: string) => void;
}

interface AIAnalysis {
  overallScore: number;
  reliabilityScore: number;
  speedScore: number;
  costScore: number;
  serviceQualityScore: number;
  trackingScore: number;
  recommendation: string;
  originalRate: number;
  discountPercentage: number;
  labels: {
    isCheapest: boolean;
    isFastest: boolean;
    isMostReliable: boolean;
    isMostEfficient: boolean;
    isAIRecommended: boolean;
  };
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const EnhancedBulkAISidePanel: React.FC<EnhancedBulkAISidePanelProps> = ({
  selectedShipment,
  allShipments,
  isOpen,
  onClose,
  onShipmentUpdate,
  onOptimizationChange
}) => {
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRateId, setSelectedRateId] = useState<string>('');
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  const optimizationFilters = [
    { id: 'cheapest', label: 'Cheapest', icon: '💰' },
    { id: 'fastest', label: 'Fastest', icon: '⚡' },
    { id: 'balanced', label: 'Most Efficient', icon: '✅' },
    { id: 'door-delivery', label: 'Door Delivery', icon: '📦' },
    { id: 'po-box', label: 'PO Box Delivery', icon: '📫' },
    { id: 'eco-friendly', label: 'Eco Friendly', icon: '🌱' }
  ];

  const analyzeShipmentRate = async () => {
    if (!selectedShipment || !selectedShipment.availableRates) return;
    
    setIsLoading(true);
    
    try {
      const selectedRate = selectedShipment.availableRates.find(rate => rate.id === selectedShipment.selectedRateId);
      
      const { data, error } = await supabase.functions.invoke('analyze-bulk-shipment-rate', {
        body: {
          selectedRate,
          allRates: selectedShipment.availableRates,
          shipment: selectedShipment,
          context: {
            totalRates: selectedShipment.availableRates.length,
            priceRange: {
              min: Math.min(...selectedShipment.availableRates.map(r => parseFloat(r.rate.toString()))),
              max: Math.max(...selectedShipment.availableRates.map(r => parseFloat(r.rate.toString())))
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

  const handleRateChange = (rateId: string) => {
    setSelectedRateId(rateId);
    const selectedRate = selectedShipment.availableRates?.find(rate => rate.id === rateId);
    
    if (selectedRate) {
      onShipmentUpdate(selectedShipment.id, {
        selectedRateId: rateId,
        carrier: selectedRate.carrier,
        service: selectedRate.service,
        rate: parseFloat(selectedRate.rate.toString())
      });
    }
  };

  const handleQuickChange = (filterId: string) => {
    onOptimizationChange(filterId);
    toast.success(`Applied ${filterId} optimization`);
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;
    
    const userMessage: ChatMessage = {
      role: 'user',
      content: chatInput,
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsChatLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('bulk-shipping-ai-chat', {
        body: {
          message: chatInput,
          shipment: selectedShipment,
          allShipments: allShipments,
          context: {
            currentAnalysis: analysis,
            availableRates: selectedShipment.availableRates
          }
        }
      });

      if (error) {
        throw error;
      }

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.response,
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
    if (isOpen && selectedShipment) {
      setSelectedRateId(selectedShipment.selectedRateId || '');
      analyzeShipmentRate();
    }
  }, [isOpen, selectedShipment, selectedShipment?.selectedRateId]);

  if (!isOpen) return null;

  const selectedRate = selectedShipment.availableRates?.find(rate => rate.id === selectedShipment.selectedRateId);

  return (
    <div className="fixed bottom-0 right-0 h-[600px] w-80 bg-white shadow-2xl z-50 border-l-4 border-t-4 border-blue-500 overflow-hidden flex flex-col rounded-tl-lg">
      <Card className="h-full rounded-none border-0 flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-blue-600 to-purple-600 text-white z-10 flex-shrink-0 py-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Brain className="w-4 h-4 text-white" />
            AI Shipping Assistant
            <Badge className="bg-white/20 text-white text-xs px-1">BETA</Badge>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/20 h-6 w-6 p-0">
            <X className="w-3 h-3" />
          </Button>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-y-auto p-3 space-y-3">
          {/* Rate Selector Dropdown */}
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-900 flex items-center gap-1 text-sm">
              <Truck className="w-3 h-3" />
              Current Rate
            </h4>
            <Select value={selectedRateId} onValueChange={handleRateChange}>
              <SelectTrigger className="w-full h-8 text-xs">
                <SelectValue placeholder="Select rate" />
              </SelectTrigger>
              <SelectContent className="bg-white border-2 shadow-lg z-50">
                {selectedShipment.availableRates?.map((rate) => (
                  <SelectItem key={rate.id} value={rate.id} className="hover:bg-gray-50">
                    <div className="flex items-center gap-2 w-full">
                      <CarrierLogo carrier={rate.carrier} className="w-4 h-4" />
                      <div className="flex-1">
                        <div className="font-medium text-xs">{rate.carrier} {rate.service}</div>
                        <div className="text-xs text-gray-600">
                          ${parseFloat(rate.rate.toString()).toFixed(2)} - {rate.delivery_days} days
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selected Rate Info with Discount */}
          {selectedRate && (
            <div className="p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <CarrierLogo carrier={selectedRate.carrier} className="w-6 h-6" />
                <h3 className="font-semibold text-blue-900 text-sm">{selectedRate.carrier} {selectedRate.service}</h3>
              </div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xl font-bold text-blue-800">${parseFloat(selectedRate.rate.toString()).toFixed(2)}</p>
                {analysis?.discountPercentage && analysis.discountPercentage > 0 && (
                  <Badge className="bg-green-100 text-green-800 text-xs">
                    {analysis.discountPercentage}% OFF
                  </Badge>
                )}
              </div>
              {analysis?.originalRate && analysis.originalRate > parseFloat(selectedRate.rate.toString()) && (
                <p className="text-xs text-gray-500 line-through">${analysis.originalRate.toFixed(2)}</p>
              )}
              <p className="text-xs text-blue-600">{selectedRate.delivery_days} days delivery</p>
            </div>
          )}

          {/* AI Analysis with 5 Criteria */}
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-sm">AI analyzing...</span>
            </div>
          ) : analysis ? (
            <div className="space-y-3">
              {/* Overall Score */}
              <div className="text-center p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                <div className="text-xl font-bold text-blue-800">{analysis.overallScore}/100</div>
                <div className="text-xs text-gray-600">AI Recommendation Score</div>
              </div>

              {/* Labels */}
              <div className="space-y-1">
                {analysis.labels.isCheapest && (
                  <Badge className="w-full justify-start bg-green-100 text-green-800 border-green-300 text-xs py-1">
                    💰 Best Price
                  </Badge>
                )}
                {analysis.labels.isFastest && (
                  <Badge className="w-full justify-start bg-yellow-100 text-yellow-800 border-yellow-300 text-xs py-1">
                    ⚡ Fastest Option
                  </Badge>
                )}
                {analysis.labels.isMostReliable && (
                  <Badge className="w-full justify-start bg-blue-100 text-blue-800 border-blue-300 text-xs py-1">
                    🛡️ Most Reliable
                  </Badge>
                )}
                {analysis.labels.isMostEfficient && (
                  <Badge className="w-full justify-start bg-purple-100 text-purple-800 border-purple-300 text-xs py-1">
                    ✅ Best Balance
                  </Badge>
                )}
                {analysis.labels.isAIRecommended && (
                  <Badge className="w-full justify-start bg-pink-100 text-pink-800 border-pink-300 text-xs py-1">
                    🧠 AI Pick
                  </Badge>
                )}
              </div>

              {/* 5 Detailed Scores */}
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-orange-600" />
                    <span className="text-xs">Service Quality</span>
                  </div>
                  <span className="font-semibold text-xs">{analysis.serviceQualityScore}/100</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-indigo-600" />
                    <span className="text-xs">Tracking</span>
                  </div>
                  <span className="font-semibold text-xs">{analysis.trackingScore}/100</span>
                </div>
              </div>

              {/* AI Recommendation */}
              <div className="p-2 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border">
                <div className="flex items-center gap-1 mb-1">
                  <Brain className="w-3 h-3 text-blue-600" />
                  <span className="font-medium text-blue-900 text-xs">AI Recommendation</span>
                </div>
                <p className="text-xs text-gray-700">{analysis.recommendation}</p>
              </div>
            </div>
          ) : null}

          {/* Quick Change Options */}
          <div className="space-y-2 border border-gray-200 rounded-lg p-2">
            <h3 className="font-semibold text-gray-900 flex items-center gap-1 text-sm">
              <Zap className="w-3 h-3 text-yellow-500" />
              Quick Changes
            </h3>
            
            <div className="grid grid-cols-2 gap-1">
              {optimizationFilters.slice(0, 6).map((filter) => (
                <Button
                  key={filter.id}
                  variant="outline"
                  className="justify-start h-auto p-2 border hover:bg-blue-50 text-xs"
                  onClick={() => handleQuickChange(filter.id)}
                >
                  <span className="mr-1">{filter.icon}</span>
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>

        {/* Chat Section */}
        <div className={`border-t bg-white transition-all duration-300 ${showChat ? 'h-64' : 'h-12'}`}>
          <div className="p-2">
            <Button
              variant="ghost"
              className="w-full flex items-center gap-2 text-sm hover:bg-blue-50"
              onClick={() => setShowChat(!showChat)}
            >
              <MessageCircle className="w-4 h-4" />
              AI Assistant Chat
              {chatMessages.length > 0 && (
                <Badge className="ml-auto bg-blue-100 text-blue-800 text-xs">
                  {chatMessages.length}
                </Badge>
              )}
            </Button>
          </div>
          
          {showChat && (
            <div className="flex flex-col h-52">
              <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-gray-50">
                {chatMessages.length === 0 && (
                  <div className="text-center text-gray-500 text-xs py-4">
                    Ask me anything about your shipment!
                  </div>
                )}
                {chatMessages.map((message, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded-lg text-xs ${
                      message.role === 'user'
                        ? 'bg-blue-100 text-blue-900 ml-4'
                        : 'bg-white text-gray-700 mr-4 border'
                    }`}
                  >
                    <div className="font-medium mb-1">
                      {message.role === 'user' ? 'You' : 'AI Assistant'}
                    </div>
                    <div>{message.content}</div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex items-center gap-2 p-2 bg-white rounded-lg mr-4 border text-xs">
                    <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-400"></div>
                    AI is typing...
                  </div>
                )}
              </div>
              
              <div className="p-2 border-t bg-white">
                <div className="flex gap-2">
                  <Textarea
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask about rates, delivery times, or shipping options..."
                    className="flex-1 min-h-[60px] text-xs resize-none"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendChatMessage();
                      }
                    }}
                  />
                  <Button
                    onClick={sendChatMessage}
                    disabled={!chatInput.trim() || isChatLoading}
                    className="px-3 bg-blue-600 hover:bg-blue-700"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default EnhancedBulkAISidePanel;
