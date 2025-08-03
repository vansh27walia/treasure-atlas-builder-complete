import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface Rate {
  id: string;
  carrier: string;
  service: string;
  rate: string;
  delivery_days: number;
  delivery_date: string;
}

interface AIRateAssistantProps {
  rates: Rate[];
  onRatesReorder: (sortedRates: Rate[]) => void;
  onCarrierFilter: (carrier: string | 'all') => void;
  availableCarriers: string[];
}

const AIRateAssistant: React.FC<AIRateAssistantProps> = ({
  rates,
  onRatesReorder,
  onCarrierFilter,
  availableCarriers
}) => {
  const [selectedSort, setSelectedSort] = useState<string>('');
  const [selectedCarrier, setSelectedCarrier] = useState<string>('all');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{type: 'user' | 'ai', message: string}>>([]);

  const sortOptions = [{
    value: 'fastest',
    label: 'Fastest Delivery'
  }, {
    value: 'cheapest',
    label: 'Cheapest Price'
  }, {
    value: 'reliable',
    label: 'Most Reliable'
  }, {
    value: 'insurance',
    label: 'Best Insurance Value'
  }, {
    value: 'value',
    label: 'Best Overall Value'
  }];

  const carrierLogos: Record<string, string> = {
    'ups': '🚚',
    'usps': '📮',
    'fedex': '📦',
    'dhl': '✈️'
  };

  const handleSortSelection = (sortType: string) => {
    setSelectedSort(sortType);
    
    let sortedRates = [...rates];
    
    switch (sortType) {
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
      case 'insurance':
        // Sort by best insurance value (comprehensive coverage + reasonable cost)
        sortedRates.sort((a, b) => {
          const insuranceScore = (service: string, rate: string) => {
            const cost = parseFloat(rate);
            if (service.toLowerCase().includes('priority') || service.toLowerCase().includes('express')) return cost * 0.8; // Better insurance coverage
            return cost;
          };
          return insuranceScore(a.service, a.rate) - insuranceScore(b.service, b.rate);
        });
        break;
      case 'value':
        // Balance of price, speed, and reliability
        sortedRates.sort((a, b) => {
          const scoreA = (parseFloat(a.rate) / 10) + (a.delivery_days || 5);
          const scoreB = (parseFloat(b.rate) / 10) + (b.delivery_days || 5);
          return scoreA - scoreB;
        });
        break;
    }
    
    onRatesReorder(sortedRates);
  };

  const handleCarrierSelection = (carrier: string) => {
    setSelectedCarrier(carrier);
    onCarrierFilter(carrier);
  };

  const handleChatSubmit = async () => {
    if (!chatInput.trim()) return;

    const userMessage = chatInput.trim();
    setChatMessages(prev => [...prev, { type: 'user', message: userMessage }]);
    setChatInput('');

    // Enhanced AI responses with carrier selection capability
    let aiResponse = '';
    const lowerInput = userMessage.toLowerCase();

    if (lowerInput.includes('fastest') || lowerInput.includes('quick')) {
      aiResponse = 'I\'ll sort the rates by fastest delivery and suggest the best carrier for speed!';
      handleSortSelection('fastest');
    } else if (lowerInput.includes('cheap') || lowerInput.includes('lowest')) {
      aiResponse = 'I\'ll show you the cheapest options and highlight the most cost-effective carrier!';
      handleSortSelection('cheapest');
    } else if (lowerInput.includes('reliable') || lowerInput.includes('trusted')) {
      aiResponse = 'I\'ll prioritize the most reliable carriers with best delivery success rates!';
      handleSortSelection('reliable');
    } else if (lowerInput.includes('insurance') || lowerInput.includes('coverage')) {
      aiResponse = 'I\'ll sort by best insurance value, showing carriers with comprehensive coverage!';
      handleSortSelection('insurance');
    } else if (lowerInput.includes('ups')) {
      aiResponse = 'UPS offers reliable ground and express services with excellent tracking. Great for business deliveries! Filtering to show UPS options.';
      handleCarrierSelection('ups');
    } else if (lowerInput.includes('fedex')) {
      aiResponse = 'FedEx excels in fast express delivery and premium services. Perfect for time-sensitive shipments! Showing FedEx options.';
      handleCarrierSelection('fedex');
    } else if (lowerInput.includes('usps')) {
      aiResponse = 'USPS provides cost-effective shipping with excellent rural coverage. Best value for residential deliveries! Filtering to USPS options.';
      handleCarrierSelection('usps');
    } else if (lowerInput.includes('dhl')) {
      aiResponse = 'DHL specializes in international express delivery with premium service. Showing DHL options!';
      handleCarrierSelection('dhl');
    } else if (lowerInput.includes('carrier') || lowerInput.includes('choose') || lowerInput.includes('select')) {
      aiResponse = 'I can help you choose the best carrier based on Price, Speed, Reliability, and Insurance criteria. Each carrier has strengths:\n\n📮 USPS: Best value, great rural coverage\n🚚 UPS: Reliable tracking, business-focused\n📦 FedEx: Premium speed, express services\n✈️ DHL: International specialists\n\nWhich criteria matters most to you?';
    } else {
      aiResponse = 'I can help you optimize rates using Price, Speed, Reliability, and Insurance criteria. I can also filter by specific carriers (UPS, USPS, FedEx, DHL) or sort by your preferences. What would you like to prioritize?';
    }

    setTimeout(() => {
      setChatMessages(prev => [...prev, { type: 'ai', message: aiResponse }]);
    }, 500);
  };

  return (
    <Card className="p-4 bg-gray-50/50 border border-gray-200">
      <div className="space-y-4">
        {/* Carrier Filter Dropdown */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Filter by Carrier</label>
            <Select value={selectedCarrier} onValueChange={handleCarrierSelection}>
              <SelectTrigger className="bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Carriers</SelectItem>
                {availableCarriers.map(carrier => (
                  <SelectItem key={carrier} value={carrier}>
                    <span className="flex items-center gap-2">
                      {carrierLogos[carrier.toLowerCase()] || '📦'} {carrier.toUpperCase()}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* AI Sort Dropdown */}
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              <Sparkles className="w-4 h-4 inline mr-1" />
              AI-Powered Sort
            </label>
            <Select value={selectedSort} onValueChange={handleSortSelection}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Choose sorting option" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Chat Assistant */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            <Sparkles className="w-4 h-4 inline mr-1" />
            AI Shipping Assistant - Price • Speed • Reliability • Insurance
          </label>
          
          {/* Chat Messages */}
          {chatMessages.length > 0 && (
            <div className="mb-3 max-h-32 overflow-y-auto space-y-2">
              {chatMessages.slice(-4).map((msg, index) => (
                <div key={index} className={`text-xs p-2 rounded ${
                  msg.type === 'user' 
                    ? 'bg-blue-100 text-blue-800 ml-8' 
                    : 'bg-gray-100 text-gray-700 mr-8'
                }`}>
                  <strong>{msg.type === 'user' ? 'You:' : 'AI:'}</strong> {msg.message}
                </div>
              ))}
            </div>
          )}

          {/* Chat Input */}
          <div className="flex gap-2">
            <Input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask about carriers, rates, insurance, or shipping criteria..."
              className="bg-white text-sm"
              onKeyPress={(e) => e.key === 'Enter' && handleChatSubmit()}
            />
            <Button onClick={handleChatSubmit} size="sm" className="px-3">
              <Send className="w-4 h-4" />
            </Button>
          </div>
          
          <p className="text-xs text-gray-500 mt-1">
            💡 Ask "fastest option", "cheapest UPS", "reliable carrier", or "best insurance coverage"
          </p>
        </div>
      </div>
    </Card>
  );
};

export default AIRateAssistant;
