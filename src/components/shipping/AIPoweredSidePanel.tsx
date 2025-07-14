import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, Sparkles, Bot, Zap, DollarSign, Shield, Truck } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';

interface Rate {
  id: string;
  carrier: string;
  service: string;
  rate: string;
  delivery_days: number;
  delivery_date: string;
}

interface AIPoweredSidePanelProps {
  rates: Rate[];
  onRatesReorder: (sortedRates: Rate[]) => void;
  onCarrierFilter: (carrier: string) => void;
  onRateSelect: (rateId: string) => void;
}

const AIPoweredSidePanel: React.FC<AIPoweredSidePanelProps> = ({
  rates,
  onRatesReorder,
  onCarrierFilter,
  onRateSelect
}) => {
  const [selectedCarrier, setSelectedCarrier] = useState<string>('all');
  const [selectedPreference, setSelectedPreference] = useState<string>('');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{type: 'user' | 'ai', message: string}>>([]);
  const [isAIThinking, setIsAIThinking] = useState(false);

  const carriers = ['all', 'usps', 'fedex', 'ups', 'dhl'];
  const preferences = [
    { value: 'fastest', label: 'Fastest Delivery', icon: Zap },
    { value: 'cheapest', label: 'Cheapest Price', icon: DollarSign },
    { value: 'reliable', label: 'Most Reliable', icon: Shield },
    { value: 'overnight', label: 'Overnight', icon: Truck },
    { value: '2day', label: '2-Day Delivery', icon: Truck },
  ];

  const handleCarrierChange = (carrier: string) => {
    setSelectedCarrier(carrier);
    onCarrierFilter(carrier);
  };

  const handlePreferenceConfirm = () => {
    if (!selectedPreference) {
      toast.error('Please select a rate preference first');
      return;
    }

    let sortedRates = [...rates];
    
    switch (selectedPreference) {
      case 'fastest':
        sortedRates.sort((a, b) => (a.delivery_days || 999) - (b.delivery_days || 999));
        break;
      case 'cheapest':
        sortedRates.sort((a, b) => parseFloat(a.rate) - parseFloat(b.rate));
        break;
      case 'reliable':
        // Prioritize USPS and UPS for reliability
        sortedRates.sort((a, b) => {
          const reliabilityScore = (carrier: string) => {
            if (carrier.toLowerCase().includes('usps')) return 1;
            if (carrier.toLowerCase().includes('ups')) return 2;
            if (carrier.toLowerCase().includes('fedex')) return 3;
            return 4;
          };
          return reliabilityScore(a.carrier) - reliabilityScore(b.carrier);
        });
        break;
      case 'overnight':
        sortedRates = sortedRates.filter(rate => 
          rate.service.toLowerCase().includes('overnight') || 
          rate.service.toLowerCase().includes('next day') ||
          (rate.delivery_days && rate.delivery_days <= 1)
        );
        break;
      case '2day':
        sortedRates = sortedRates.filter(rate => 
          rate.service.toLowerCase().includes('2') || 
          (rate.delivery_days && rate.delivery_days <= 2)
        );
        break;
    }
    
    onRatesReorder(sortedRates);
    
    const preferenceLabel = preferences.find(p => p.value === selectedPreference)?.label;
    toast.success(`Rates sorted by: ${preferenceLabel}`);
  };

  const handleAIChat = async () => {
    if (!chatInput.trim()) return;

    const userMessage = chatInput.trim();
    setChatMessages(prev => [...prev, { type: 'user', message: userMessage }]);
    setChatInput('');
    setIsAIThinking(true);

    try {
      // Call Gemini API for intelligent responses
      const { data, error } = await supabase.functions.invoke('analyze-shipping-rates', {
        body: {
          message: userMessage,
          rates: rates,
          context: 'shipping_assistance'
        }
      });

      if (error) throw error;

      let aiResponse = data.response || 'I can help you find the best shipping option!';
      
      // Parse AI response for actions
      const lowerInput = userMessage.toLowerCase();
      const lowerResponse = aiResponse.toLowerCase();
      
      if (lowerInput.includes('fastest') || lowerResponse.includes('fastest')) {
        setSelectedPreference('fastest');
        handlePreferenceConfirm();
      } else if (lowerInput.includes('cheap') || lowerResponse.includes('cheapest')) {
        setSelectedPreference('cheapest');
        handlePreferenceConfirm();
      } else if (lowerInput.includes('reliable') || lowerResponse.includes('reliable')) {
        setSelectedPreference('reliable');
        handlePreferenceConfirm();
      }

      setChatMessages(prev => [...prev, { type: 'ai', message: aiResponse }]);
    } catch (error) {
      console.error('AI Chat error:', error);
      
      // Fallback to simple keyword-based responses
      let fallbackResponse = '';
      const lowerInput = userMessage.toLowerCase();

      if (lowerInput.includes('fastest') || lowerInput.includes('quick')) {
        fallbackResponse = 'I\'ll sort the rates by fastest delivery for you!';
        setSelectedPreference('fastest');
        setTimeout(handlePreferenceConfirm, 500);
      } else if (lowerInput.includes('cheap') || lowerInput.includes('lowest')) {
        fallbackResponse = 'I\'ll show you the cheapest options first!';
        setSelectedPreference('cheapest');
        setTimeout(handlePreferenceConfirm, 500);
      } else if (lowerInput.includes('reliable') || lowerInput.includes('trusted')) {
        fallbackResponse = 'I\'ll prioritize the most reliable carriers for you!';
        setSelectedPreference('reliable');
        setTimeout(handlePreferenceConfirm, 500);
      } else {
        fallbackResponse = 'I can help you find the best shipping option! Try asking about fastest, cheapest, or most reliable options.';
      }

      setChatMessages(prev => [...prev, { type: 'ai', message: fallbackResponse }]);
    } finally {
      setIsAIThinking(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Carrier Selection */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3 text-foreground">Select Carrier</h3>
        <Select value={selectedCarrier} onValueChange={handleCarrierChange}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Carriers</SelectItem>
            <SelectItem value="usps">USPS</SelectItem>
            <SelectItem value="fedex">FedEx</SelectItem>
            <SelectItem value="ups">UPS</SelectItem>
            <SelectItem value="dhl">DHL</SelectItem>
          </SelectContent>
        </Select>
      </Card>

      {/* Rate Preferences */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3 text-foreground">Rate Preferences</h3>
        <Select value={selectedPreference} onValueChange={setSelectedPreference}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose preference" />
          </SelectTrigger>
          <SelectContent>
            {preferences.map(pref => {
              const IconComponent = pref.icon;
              return (
                <SelectItem key={pref.value} value={pref.value}>
                  <div className="flex items-center gap-2">
                    <IconComponent className="w-4 h-4" />
                    {pref.label}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        <Button 
          onClick={handlePreferenceConfirm}
          disabled={!selectedPreference}
          className="w-full mt-3"
          size="sm"
        >
          Confirm Selection
        </Button>
      </Card>

      {/* AI Chat Assistant */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3 text-foreground flex items-center gap-2">
          <Bot className="w-4 h-4" />
          AI Assistant
        </h3>
        
        {/* Chat Messages */}
        <div className="max-h-40 overflow-y-auto mb-3 space-y-2">
          {chatMessages.slice(-4).map((msg, index) => (
            <div 
              key={index} 
              className={`text-xs p-2 rounded-lg ${
                msg.type === 'user' 
                  ? 'bg-primary/10 text-primary ml-2' 
                  : 'bg-muted text-muted-foreground mr-2'
              }`}
            >
              <strong>{msg.type === 'user' ? 'You:' : 'AI:'}</strong> {msg.message}
            </div>
          ))}
          {isAIThinking && (
            <div className="text-xs p-2 rounded-lg bg-muted text-muted-foreground mr-2 flex items-center gap-2">
              <Sparkles className="w-3 h-3 animate-pulse" />
              <strong>AI:</strong> Thinking...
            </div>
          )}
        </div>

        {/* Chat Input */}
        <div className="flex gap-2">
          <Input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask about rates..."
            className="text-xs"
            onKeyPress={(e) => e.key === 'Enter' && handleAIChat()}
            disabled={isAIThinking}
          />
          <Button 
            onClick={handleAIChat} 
            size="sm" 
            disabled={isAIThinking}
            className="px-2"
          >
            <Send className="w-3 h-3" />
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground mt-2">
          💡 Try: "Show fastest rates" or "What's cheapest?"
        </p>
      </Card>
    </div>
  );
};

export default AIPoweredSidePanel;