
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Truck, Clock, DollarSign, Shield, Star, Filter } from 'lucide-react';
import { useShippingRates } from '@/hooks/useShippingRates';

interface CarrierLogo {
  name: string;
  logo: string;
  color: string;
}

const carrierLogos: { [key: string]: CarrierLogo } = {
  'UPS': {
    name: 'UPS',
    logo: '🚚',
    color: 'bg-amber-600'
  },
  'USPS': {
    name: 'USPS',
    logo: '📮',
    color: 'bg-blue-600'
  },
  'FedEx': {
    name: 'FedEx',
    logo: '📦',
    color: 'bg-purple-600'
  },
  'DHL': {
    name: 'DHL',
    logo: '✈️',
    color: 'bg-red-600'
  }
};

const EnhancedRateDisplay: React.FC = () => {
  const { rates, selectedRateId, handleSelectRate } = useShippingRates();
  const [filteredRates, setFilteredRates] = useState(rates);
  const [carrierFilter, setCarrierFilter] = useState('all');
  const [sortFilter, setSortFilter] = useState('best');
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [selectedRate, setSelectedRate] = useState<any>(null);

  useEffect(() => {
    if (rates.length > 0) {
      setShowAIPanel(true);
      applyFilters();
    }
  }, [rates]);

  useEffect(() => {
    applyFilters();
  }, [carrierFilter, sortFilter, rates]);

  const applyFilters = () => {
    let filtered = [...rates];

    // Apply carrier filter
    if (carrierFilter !== 'all') {
      filtered = filtered.filter(rate => 
        rate.carrier.toLowerCase().includes(carrierFilter.toLowerCase())
      );
    }

    // Apply sort filter
    switch (sortFilter) {
      case 'cheapest':
        filtered.sort((a, b) => parseFloat(a.rate) - parseFloat(b.rate));
        break;
      case 'fastest':
        filtered.sort((a, b) => (a.delivery_days || 999) - (b.delivery_days || 999));
        break;
      case 'best':
        filtered.sort((a, b) => {
          const scoreA = parseFloat(a.rate) * 0.7 + (a.delivery_days || 5) * 0.3;
          const scoreB = parseFloat(b.rate) * 0.7 + (b.delivery_days || 5) * 0.3;
          return scoreA - scoreB;
        });
        break;
    }

    setFilteredRates(filtered);
  };

  const getUniqueCarriers = () => {
    const carriers = rates.map(rate => rate.carrier.toUpperCase());
    return [...new Set(carriers)];
  };

  const handleRateSelect = (rate: any) => {
    handleSelectRate(rate.id);
    setSelectedRate(rate);
  };

  const getBestRateLabel = (rate: any) => {
    const cheapest = rates.reduce((prev, curr) => 
      parseFloat(curr.rate) < parseFloat(prev.rate) ? curr : prev
    );
    const fastest = rates.reduce((prev, curr) => 
      (curr.delivery_days || 999) < (prev.delivery_days || 999) ? curr : prev
    );

    if (rate.id === cheapest.id) return 'Cheapest';
    if (rate.id === fastest.id) return 'Fastest';
    return null;
  };

  if (rates.length === 0) {
    return null;
  }

  return (
    <div className="w-full space-y-6">
      {/* Carrier Logos */}
      <div className="flex items-center justify-center space-x-6 py-4 bg-gray-50 rounded-lg">
        {getUniqueCarriers().map(carrier => {
          const logoData = carrierLogos[carrier];
          return (
            <div key={carrier} className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${logoData?.color || 'bg-gray-600'}`}>
                {logoData?.logo || '📦'}
              </div>
              <span className="text-sm font-medium">{carrier}</span>
            </div>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-4 bg-blue-50 rounded-lg">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">Filter Options</span>
        </div>
        
        <div className="flex gap-3">
          <Select value={carrierFilter} onValueChange={setCarrierFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Carriers</SelectItem>
              {getUniqueCarriers().map(carrier => (
                <SelectItem key={carrier} value={carrier.toLowerCase()}>
                  {carrier}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortFilter} onValueChange={setSortFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="best">Best Value</SelectItem>
              <SelectItem value="cheapest">Cheapest</SelectItem>
              <SelectItem value="fastest">Fastest</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Rate Display with AI Panel */}
      <div className={`grid ${showAIPanel ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'} gap-6`}>
        {/* Main Rate List */}
        <div className={`${showAIPanel ? 'lg:col-span-2' : 'col-span-1'} space-y-4`}>
          <h3 className="text-lg font-semibold">Shipping Options ({filteredRates.length})</h3>
          
          {filteredRates.map((rate) => {
            const isSelected = selectedRateId === rate.id;
            const bestLabel = getBestRateLabel(rate);
            const logoData = carrierLogos[rate.carrier.toUpperCase()];

            return (
              <Card 
                key={rate.id}
                className={`cursor-pointer transition-all ${isSelected ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-md'}`}
                onClick={() => handleRateSelect(rate)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${logoData?.color || 'bg-gray-600'}`}>
                        {logoData?.logo || '📦'}
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{rate.carrier}</h4>
                          {bestLabel && (
                            <Badge variant="secondary" className="text-xs">
                              {bestLabel}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{rate.service}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        ${parseFloat(rate.rate).toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {rate.delivery_days || 'N/A'} days
                      </div>
                    </div>
                  </div>

                  {rate.delivery_date && (
                    <div className="mt-2 text-xs text-gray-500">
                      Estimated delivery: {new Date(rate.delivery_date).toLocaleDateString()}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* AI Suggestion Panel */}
        {showAIPanel && selectedRate && (
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  AI Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900">Selected Rate</h4>
                  <p className="text-sm">{selectedRate.carrier} {selectedRate.service}</p>
                  <p className="text-lg font-bold text-green-600">${parseFloat(selectedRate.rate).toFixed(2)}</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Cost Efficiency</span>
                    <Badge variant="outline">
                      {rates.findIndex(r => r.id === selectedRate.id) < rates.length / 2 ? 'Good' : 'Fair'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Delivery Speed</span>
                    <Badge variant="outline">
                      {(selectedRate.delivery_days || 5) <= 2 ? 'Fast' : 'Standard'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Reliability</span>
                    <Badge variant="outline">High</Badge>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h5 className="font-semibold mb-2">Quick Actions</h5>
                  <div className="space-y-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start"
                      onClick={() => setSortFilter('cheapest')}
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      Show Cheapest
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start"
                      onClick={() => setSortFilter('fastest')}
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Show Fastest
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start"
                      onClick={() => setSortFilter('best')}
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Show Best Value
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedRateDisplay;
