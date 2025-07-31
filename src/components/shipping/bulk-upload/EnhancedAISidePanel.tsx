
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { X, Brain, Star, Clock, DollarSign, Shield, Zap, Truck, Award, MapPin, MessageCircle, Send, Bot } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import CarrierLogo from '../CarrierLogo';

interface EnhancedAISidePanelProps {
  selectedShipment: any;
  allShipments: any[];
  isOpen: boolean;
  onClose: () => void;
  onShipmentUpdate: (shipmentId: string, updates: any) => void;
}

interface EnhancedAIAnalysis {
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
  discountInfo: {
    originalPrice: number;
    discountedPrice: number;
    discountPercentage: number;
    savingsAmount: number;
  };
}

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

const EnhancedAISidePanel: React.FC<EnhancedAISidePanelProps> = ({
  selectedShipment,
  allShipments,
  isOpen,
  onClose,
  onShipmentUpdate
}) => {
  const [analysis, setAnalysis] = useState<EnhancedAIAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRateId, setSelectedRateId] = useState<string>('');
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  const analyzeShipment = async () => {
    if (!selectedShipment || !selectedShipment.availableRates) return;
    
    setIsLoading(true);
    
    try {
      const selectedRate = selectedShipment.availableRates.find(
        (rate: any) => rate.id === selectedShipment.selectedRateId
      ) || selectedShipment.availableRates[0];

      const { data, error } = await supabase.functions.invoke('analyze-bulk-shipment-rate', {
        body: {
          selectedRate,
          allRates: selectedShipment.availableRates,
          shipmentData: selectedShipment,
          context: {
            totalShipments: allShipments.length,
            priceRange: {
              min: Math.min(...selectedShipment.availableRates.map((r: any) => parseFloat(r.rate))),
              max: Math.max(...selectedShipment.availableRates.map((r: any) => parseFloat(r.rate)))
            }
          }
        }
      });

      if (error) {
        console.error('Error analyzing shipment:', error);
        toast.error('Failed to analyze shipment');
        return;
      }

      setAnalysis(data);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to analyze shipment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRateChange = (rateId: string) => {
    setSelectedRateId(rateId);
    const newSelectedRate = selectedShipment.availableRates.find((rate: any) => rate.id === rateId);
    if (newSelectedRate) {
      onShipmentUpdate(selectedShipment.id, {
        selectedRateId: rateId,
        carrier: newSelectedRate.carrier,
        service: newSelectedRate.service,
        rate: parseFloat(newSelectedRate.rate)
      });
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
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
          shipmentData: selectedShipment,
          allShipments: allShipments,
          context: 'bulk-shipping-assistance'
        }
      });
      
      if (error) throw error;
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: data.response,
        timestamp: new Date()
      };
      
      setChatMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Failed to get AI response');
    } finally {
      setIsChatLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && selectedShipment) {
      setSelectedRateId(selectedShipment.selectedRateId || '');
      analyzeShipment();
    }
  }, [isOpen, selectedShipment]);

  if (!isOpen) return null;

  const currentRate = selectedShipment?.availableRates?.find(
    (rate: any) => rate.id === (selectedRateId || selectedShipment.selectedRateId)
  );

  return (
    <div className="fixed top-16 right-4 h-[calc(100vh-5rem)] w-96 bg-white shadow-2xl z-40 border border-gray-200 rounded-lg overflow-hidden flex flex-col">
      <Card className="h-full rounded-lg border-0 flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-blue-600 to-purple-600 text-white z-10 flex-shrink-0 py-3 rounded-t-lg">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Brain className="w-4 h-4 text-white" />
            AI Shipment Analysis
            <Badge className="bg-white/20 text-white text-xs px-1">AI</Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowChat(!showChat)}
              className="text-white hover:bg-white/20 h-6 w-6 p-0"
            >
              <MessageCircle className="w-3 h-3" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose} 
              className="text-white hover:bg-white/20 h-6 w-6 p-0"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-y-auto p-3 space-y-4">
          {!showChat ? (
            <>
              {/* Rate Selector Dropdown */}
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900 flex items-center gap-1 text-sm">
                  <Truck className="w-3 h-3" />
                  Change Rate
                </h4>
                <Select value={selectedRateId} onValueChange={handleRateChange}>
                  <SelectTrigger className="w-full h-8 text-xs">
                    <SelectValue placeholder="Select rate" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-2 shadow-lg z-50">
                    {selectedShipment?.availableRates?.map((rate: any) => (
                      <SelectItem key={rate.id} value={rate.id} className="hover:bg-gray-50">
                        <div className="flex items-center gap-2 w-full">
                          <CarrierLogo carrier={rate.carrier} className="w-4 h-4" />
                          <div className="flex-1">
                            <div className="font-medium text-xs">{rate.carrier} {rate.service}</div>
                            <div className="text-xs text-gray-600">
                              ${parseFloat(rate.rate).toFixed(2)} - {rate.delivery_days} days
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Enhanced Rate Info with Discount */}
              {currentRate && (
                <div className="p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CarrierLogo carrier={currentRate.carrier} className="w-6 h-6" />
                    <h3 className="font-semibold text-blue-900 text-sm">
                      {currentRate.carrier} {currentRate.service}
                    </h3>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-xl font-bold text-blue-800">
                      ${parseFloat(currentRate.rate).toFixed(2)}
                    </p>
                    {analysis?.discountInfo && analysis.discountInfo.discountPercentage > 0 && (
                      <div className="flex items-center gap-1">
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          {analysis.discountInfo.discountPercentage}% OFF
                        </Badge>
                        <span className="text-xs text-gray-500 line-through">
                          ${analysis.discountInfo.originalPrice.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-xs text-blue-600">{currentRate.delivery_days} days delivery</p>
                  
                  {analysis?.discountInfo && analysis.discountInfo.savingsAmount > 0 && (
                    <p className="text-xs text-green-600 mt-1">
                      You save ${analysis.discountInfo.savingsAmount.toFixed(2)}
                    </p>
                  )}
                </div>
              )}

              {/* Enhanced AI Analysis */}
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-sm">AI analyzing...</span>
                </div>
              ) : analysis ? (
                <div className="space-y-3">
                  {/* Overall Score */}
                  <div className="text-center p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                    <div className="text-2xl font-bold text-blue-800">{analysis.overallScore}/100</div>
                    <div className="text-xs text-gray-600">Overall AI Score</div>
                    <div className="text-xs text-blue-600 mt-1">✨ AI Recommended</div>
                  </div>

                  {/* Labels */}
                  <div className="space-y-1">
                    {analysis.labels.isCheapest && (
                      <Badge className="w-full justify-start bg-green-100 text-green-800 border-green-300 text-xs py-1">
                        💰 Cheapest option
                      </Badge>
                    )}
                    {analysis.labels.isFastest && (
                      <Badge className="w-full justify-start bg-yellow-100 text-yellow-800 border-yellow-300 text-xs py-1">
                        ⚡ Fastest delivery
                      </Badge>
                    )}
                    {analysis.labels.isMostReliable && (
                      <Badge className="w-full justify-start bg-blue-100 text-blue-800 border-blue-300 text-xs py-1">
                        🛡️ Most reliable
                      </Badge>
                    )}
                    {analysis.labels.isMostEfficient && (
                      <Badge className="w-full justify-start bg-purple-100 text-purple-800 border-purple-300 text-xs py-1">
                        ✅ Most efficient
                      </Badge>
                    )}
                  </div>

                  {/* Enhanced 5 Criteria Scores */}
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
                        <Award className="w-3 h-3 text-orange-600" />
                        <span className="text-xs">Service Quality</span>
                      </div>
                      <span className="font-semibold text-xs">{analysis.serviceQualityScore}/100</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-red-600" />
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
            </>
          ) : (
            /* AI Chat Interface */
            <div className="flex flex-col h-full">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b">
                <Bot className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-sm">AI Assistant</span>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-3 mb-3">
                {chatMessages.length === 0 && (
                  <div className="text-center text-gray-500 text-xs py-4">
                    Ask me anything about your bulk shipments!
                  </div>
                )}
                {chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-2 rounded-lg text-xs ${
                        message.type === 'user'
                          ? 'bg-blue-500 text-white rounded-br-none'
                          : 'bg-gray-100 text-gray-800 rounded-bl-none'
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 p-2 rounded-lg rounded-bl-none">
                      <div className="flex items-center gap-1">
                        <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask about your shipment..."
                  className="text-xs"
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button 
                  size="sm" 
                  onClick={handleSendMessage}
                  disabled={!chatInput.trim() || isChatLoading}
                >
                  <Send className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedAISidePanel;
