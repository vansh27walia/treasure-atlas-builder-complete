
import React, { useState, useEffect } from 'react';
import { X, Brain, Zap, DollarSign, Clock, Calendar, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AIRateAdvisorSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  rates: any[];
  onRateSelect: (rateId: string) => void;
  onFilterChange: (filter: string) => void;
  selectedFilter: string;
}

const AIRateAdvisorSidebar: React.FC<AIRateAdvisorSidebarProps> = ({
  isOpen,
  onClose,
  rates,
  onRateSelect,
  onFilterChange,
  selectedFilter
}) => {
  const [recommendation, setRecommendation] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const filterOptions = [
    { value: 'cheapest', label: 'Cheapest Rate', icon: DollarSign },
    { value: 'fastest', label: 'Fastest Delivery', icon: Zap },
    { value: '2day', label: '2-Day Delivery', icon: Clock },
    { value: '3day', label: '3-Day Delivery', icon: Calendar },
  ];

  const carriers = ['USPS', 'UPS', 'FedEx', 'DHL'];

  const analyzeRates = async (filter: string) => {
    if (rates.length === 0) return;
    
    setIsAnalyzing(true);
    
    try {
      let bestRate;
      let analysis = '';
      
      switch (filter) {
        case 'cheapest':
          bestRate = rates.reduce((prev, curr) => 
            parseFloat(curr.rate) < parseFloat(prev.rate) ? curr : prev
          );
          analysis = `I recommend the ${bestRate.carrier} ${bestRate.service} for $${bestRate.rate}. This is the most cost-effective option available.`;
          break;
        case 'fastest':
          bestRate = rates.reduce((prev, curr) => 
            (curr.delivery_days || 999) < (prev.delivery_days || 999) ? curr : prev
          );
          analysis = `For fastest delivery, I recommend ${bestRate.carrier} ${bestRate.service} which delivers in ${bestRate.delivery_days} days for $${bestRate.rate}.`;
          break;
        case '2day':
          bestRate = rates.find(rate => rate.delivery_days === 2) ||
                    rates.reduce((prev, curr) => 
                      Math.abs((curr.delivery_days || 999) - 2) < Math.abs((prev.delivery_days || 999) - 2) ? curr : prev
                    );
          analysis = `For 2-day delivery, I recommend ${bestRate.carrier} ${bestRate.service} for $${bestRate.rate}.`;
          break;
        case '3day':
          bestRate = rates.find(rate => rate.delivery_days === 3) ||
                    rates.reduce((prev, curr) => 
                      Math.abs((curr.delivery_days || 999) - 3) < Math.abs((prev.delivery_days || 999) - 3) ? curr : prev
                    );
          analysis = `For 3-day delivery, I recommend ${bestRate.carrier} ${bestRate.service} for $${bestRate.rate}.`;
          break;
      }
      
      setRecommendation(analysis);
      if (bestRate) {
        onRateSelect(bestRate.id);
      }
    } catch (error) {
      console.error('Error analyzing rates:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFilterSelect = (filter: string) => {
    onFilterChange(filter);
    analyzeRates(filter);
  };

  return (
    <div className={`fixed inset-y-0 right-0 w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
      isOpen ? 'translate-x-0' : 'translate-x-full'
    }`}>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold">AI Rate Advisor</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-1 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Quick Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Quick Recommendations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {filterOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <Button
                    key={option.value}
                    variant={selectedFilter === option.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleFilterSelect(option.value)}
                    className="w-full justify-start"
                    disabled={isAnalyzing}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {option.label}
                  </Button>
                );
              })}
            </CardContent>
          </Card>

          {/* Carrier Filter */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                Filter by Carrier
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select onValueChange={(value) => onFilterChange(`carrier-${value}`)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Carriers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Carriers</SelectItem>
                  {carriers.map(carrier => (
                    <SelectItem key={carrier} value={carrier.toLowerCase()}>
                      {carrier}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* AI Recommendation */}
          {recommendation && (
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-sm text-blue-800">AI Recommendation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-blue-700">{recommendation}</p>
              </CardContent>
            </Card>
          )}

          {/* Rate Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Rate Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total Options:</span>
                <Badge variant="secondary">{rates.length}</Badge>
              </div>
              {rates.length > 0 && (
                <>
                  <div className="flex justify-between text-sm">
                    <span>Price Range:</span>
                    <span className="font-medium">
                      ${Math.min(...rates.map(r => parseFloat(r.rate)))} - ${Math.max(...rates.map(r => parseFloat(r.rate)))}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Delivery Range:</span>
                    <span className="font-medium">
                      {Math.min(...rates.map(r => r.delivery_days || 999))} - {Math.max(...rates.map(r => r.delivery_days || 1))} days
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AIRateAdvisorSidebar;
