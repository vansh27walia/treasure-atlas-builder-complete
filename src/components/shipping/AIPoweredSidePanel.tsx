
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Bot, MessageCircle, Filter, Star, Clock, DollarSign, Brain, Send, Sparkles } from 'lucide-react';
import CarrierDropdown from './CarrierDropdown';

interface AIPoweredSidePanelProps {
  rates?: any[];
  onRatesReorder?: (rates: any[]) => void;
  onCarrierFilter?: (carrier: string) => void;
  onRateSelect?: (rateId: string) => void;
}

const AIPoweredSidePanel: React.FC<AIPoweredSidePanelProps> = ({
  rates = [],
  onRatesReorder,
  onCarrierFilter,
  onRateSelect
}) => {
  const [selectedCarrier, setSelectedCarrier] = useState<string>('all');
  const [chatMessages, setChatMessages] = useState<Array<{role: 'user' | 'bot', message: string}>>([
    { role: 'bot', message: 'Hi! I\'m your shipping assistant. Ask me about carriers, rates, or shipping questions!' }
  ]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isChatExpanded, setIsChatExpanded] = useState(false);

  const handleCarrierFilter = (carrier: string) => {
    setSelectedCarrier(carrier);
    if (onCarrierFilter) {
      onCarrierFilter(carrier);
    }
  };

  const handleSendMessage = () => {
    if (!currentMessage.trim()) return;

    const newMessages = [
      ...chatMessages,
      { role: 'user' as const, message: currentMessage },
      { role: 'bot' as const, message: getAIResponse(currentMessage) }
    ];
    
    setChatMessages(newMessages);
    setCurrentMessage('');
  };

  const getAIResponse = (message: string): string => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('ups')) {
      return 'UPS is known for reliable delivery and excellent tracking. They offer services like UPS Ground, UPS 2nd Day Air, and UPS Next Day Air. Great for both domestic and international shipping!';
    } else if (lowerMessage.includes('usps')) {
      return 'USPS offers cost-effective shipping solutions, especially for lightweight packages. They provide services like Priority Mail, First-Class Mail, and Express Mail. Perfect for e-commerce businesses!';
    } else if (lowerMessage.includes('fedex')) {
      return 'FedEx excels in express and overnight deliveries. They offer FedEx Ground, FedEx Express, and international services. Known for speed and reliability for time-sensitive shipments!';
    } else if (lowerMessage.includes('dhl')) {
      return 'DHL is the leader in international shipping, especially to Europe and Asia. They offer express services and are perfect for international e-commerce and business shipments!';
    } else if (lowerMessage.includes('cheapest') || lowerMessage.includes('cost')) {
      return 'For the most cost-effective option, I recommend comparing rates between USPS and UPS Ground. USPS is often cheaper for lighter packages, while UPS Ground can be better for heavier items.';
    } else if (lowerMessage.includes('fastest') || lowerMessage.includes('speed')) {
      return 'For fastest delivery, consider FedEx Express or UPS Next Day Air. Both offer overnight delivery options. For same-day delivery in major cities, look into local courier services.';
    } else if (lowerMessage.includes('international')) {
      return 'For international shipping, DHL and FedEx Express are excellent choices. USPS Priority Mail International is also cost-effective for many destinations. Consider customs requirements!';
    } else {
      return 'I can help you with carrier selection, shipping costs, delivery times, and general shipping advice. What specific shipping question can I assist you with?';
    }
  };

  const availableCarriers = ['ups', 'usps', 'fedex', 'dhl'];

  return (
    <div className="space-y-4">
      {/* AI Insights Card */}
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Brain className="w-5 h-5" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-blue-200">
            <Star className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium">Best Value</span>
          </div>
          <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-blue-200">
            <Clock className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium">Fastest</span>
          </div>
          <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-blue-200">
            <DollarSign className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium">Most Economical</span>
          </div>
        </CardContent>
      </Card>

      {/* Carrier Filter */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filter by Carrier
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CarrierDropdown
            selectedCarrier={selectedCarrier}
            onCarrierChange={handleCarrierFilter}
            availableCarriers={availableCarriers}
          />
        </CardContent>
      </Card>

      {/* Chatbot */}
      <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
        <CardHeader 
          className="pb-3 cursor-pointer"
          onClick={() => setIsChatExpanded(!isChatExpanded)}
        >
          <CardTitle className="flex items-center justify-between text-green-800">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Shipping Assistant
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              AI
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isChatExpanded ? (
            <>
              <div className="max-h-64 overflow-y-auto space-y-2 bg-white rounded-lg p-3 border">
                {chatMessages.map((msg, index) => (
                  <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-2 rounded-lg text-sm ${
                      msg.role === 'user' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {msg.role === 'bot' && <Bot className="w-3 h-3 inline mr-1" />}
                      {msg.message}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  placeholder="Ask about carriers, rates..."
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1"
                />
                <Button onClick={handleSendMessage} size="sm" className="px-3">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </>
          ) : (
            <Button
              onClick={() => setIsChatExpanded(true)}
              variant="outline"
              className="w-full bg-white border-green-200 hover:bg-green-50"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Start Chat
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Rate Summary */}
      {rates.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Rate Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Available Rates:</span>
                <span className="font-medium">{rates.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Carriers:</span>
                <span className="font-medium">{availableCarriers.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AIPoweredSidePanel;
