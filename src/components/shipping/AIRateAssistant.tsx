
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Zap, DollarSign, Shield, Clock, Star } from 'lucide-react';

interface Rate {
  id: string;
  service: string;
  carrier: string;
  rate: string;
  delivery_days?: number;
  [key: string]: any;
}

interface AIRateAssistantProps {
  rates: Rate[];
  onRateRecommendation: (rateId: string) => void;
}

const AIRateAssistant: React.FC<AIRateAssistantProps> = ({ rates, onRateRecommendation }) => {
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

  const sortOptions = [
    { id: 'fastest', label: 'Fastest', icon: Zap, color: 'bg-yellow-500' },
    { id: 'cheapest', label: 'Cheapest', icon: DollarSign, color: 'bg-green-500' },
    { id: 'reliable', label: 'Most Reliable', icon: Shield, color: 'bg-blue-500' },
    { id: 'overnight', label: 'Overnight', icon: Clock, color: 'bg-purple-500' },
    { id: 'ground', label: 'Ground', icon: Star, color: 'bg-orange-500' },
  ];

  const handleFilterSelect = (filterId: string) => {
    setSelectedFilter(filterId);
    
    let sortedRates = [...rates];
    
    switch (filterId) {
      case 'fastest':
        sortedRates.sort((a, b) => (a.delivery_days || 99) - (b.delivery_days || 99));
        break;
      case 'cheapest':
        sortedRates.sort((a, b) => parseFloat(a.rate) - parseFloat(b.rate));
        break;
      case 'reliable':
        // Priority: USPS > UPS > FedEx > DHL
        const reliabilityOrder = { 'USPS': 1, 'UPS': 2, 'FedEx': 3, 'DHL': 4 };
        sortedRates.sort((a, b) => {
          const aScore = reliabilityOrder[a.carrier as keyof typeof reliabilityOrder] || 5;
          const bScore = reliabilityOrder[b.carrier as keyof typeof reliabilityOrder] || 5;
          return aScore - bScore;
        });
        break;
      case 'overnight':
        sortedRates = sortedRates.filter(rate => 
          rate.service.toLowerCase().includes('overnight') || 
          rate.service.toLowerCase().includes('express') ||
          (rate.delivery_days && rate.delivery_days <= 1)
        );
        break;
      case 'ground':
        sortedRates = sortedRates.filter(rate => 
          rate.service.toLowerCase().includes('ground')
        );
        break;
    }
    
    if (sortedRates.length > 0) {
      onRateRecommendation(sortedRates[0].id);
    }
  };

  return (
    <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <MessageCircle className="h-5 w-5" />
          AI Rate Assistant
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-blue-700">
            <strong>TIPS:</strong> Select an option below to find the best shipping solution for your needs
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {sortOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = selectedFilter === option.id;
              
              return (
                <Button
                  key={option.id}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleFilterSelect(option.id)}
                  className={`flex items-center gap-2 ${
                    isSelected 
                      ? `${option.color} text-white hover:opacity-90` 
                      : 'border-blue-200 hover:bg-blue-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {option.label}
                </Button>
              );
            })}
          </div>
          
          {selectedFilter && (
            <div className="mt-4 p-3 bg-white/60 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  Active Filter: {sortOptions.find(opt => opt.id === selectedFilter)?.label}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFilter(null)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Clear
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AIRateAssistant;
