
import React, { useState, useEffect } from 'react';
import ShippingRates from '@/components/ShippingRates';
import { useShippingRates } from '@/hooks/useShippingRates';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Package, Truck, Clock, DollarSign } from 'lucide-react';
import RedesignedShippingForm from '@/components/shipping/RedesignedShippingForm';

const ShipToPage = () => {
  const {
    rates,
    isLoading,
    selectedRateId,
    handleSelectRate,
    uniqueCarriers,
    filters,
    handleFiltersChange,
    handleClearFilters
  } = useShippingRates();
  
  const [showRates, setShowRates] = useState(false);

  useEffect(() => {
    document.title = 'Ship To | ship.io';
  }, []);

  const handleFormSubmit = (formData: any) => {
    console.log('Shipping form submitted:', formData);
    setShowRates(true);
  };

  const handleRateSelected = (rate: any) => {
    console.log('Rate selected:', rate);
    handleSelectRate(rate.id);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4">Ship Your Package</h1>
            <p className="text-muted-foreground text-lg">
              Get instant shipping rates and create labels from multiple carriers
            </p>
          </div>

          {/* Shipping Form */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Package Details
              </CardTitle>
              <CardDescription>
                Enter your package information to get shipping rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RedesignedShippingForm onSubmit={handleFormSubmit} />
            </CardContent>
          </Card>

          {/* Shipping Rates */}
          {showRates && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-foreground">Available Shipping Rates</h2>
                <Badge variant="secondary" className="text-sm">
                  {rates.length} rates found
                </Badge>
              </div>
              
              <ShippingRates 
                rates={rates} 
                onRateSelected={handleRateSelected} 
                loading={isLoading} 
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShipToPage;
