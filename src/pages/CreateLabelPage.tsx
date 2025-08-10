import React, { useState, useEffect, useCallback } from 'react';
import { toast } from '@/components/ui/sonner';
import { useRouter } from 'next/router';
import { ShippingRate } from '@/types/shipping';
import { carrierService } from '@/services/CarrierService';
import RedesignedShippingForm from '@/components/shipping/RedesignedShippingForm';
import ShippingRateCard from '@/components/shipping/ShippingRateCard';
import EmptyRatesState from '@/components/shipping/EmptyRatesState';
import EnhancedLabelModal from '@/components/shipping/EnhancedLabelModal';
import StripePaymentModal from '@/components/shipping/StripePaymentModal';
import GlobalShipAIChatbot from '@/components/shipping/GlobalShipAIChatbot';
import ImprovedRateFilter from '@/components/shipping/ImprovedRateFilter';

interface Filters {
  search: string;
  carriers: string[];
  maxPrice?: number;
  maxDays?: number;
  sortBy: 'price' | 'speed' | 'carrier';
  sortOrder: 'asc' | 'desc';
}

const CreateLabelPage: React.FC = () => {
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null);
  const [formData, setFormData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [availableCarriers, setAvailableCarriers] = useState<string[]>([]);
  const router = useRouter();

  const [pageFilters, setPageFilters] = useState<Filters>({
    search: '',
    carriers: [],
    sortBy: 'price',
    sortOrder: 'asc',
  });

  const handlePageFiltersChange = (newFilters: any) => {
    setPageFilters(newFilters);
  };

  const handlePageClearFilters = () => {
    setPageFilters({
      search: '',
      carriers: [],
      maxPrice: undefined,
      maxDays: undefined,
      sortBy: 'price',
      sortOrder: 'asc',
    });
  };

  const handleShippingSubmit = async (data: any) => {
    setFormData(data);
    setIsLoading(true);
    setRates([]);

    try {
      const shippingRates = await carrierService.getShippingRates(data);
      setRates(shippingRates);

      const carriers = [...new Set(shippingRates.map(rate => rate.carrier))];
      setAvailableCarriers(carriers);
    } catch (error: any) {
      console.error("Error fetching shipping rates:", error);
      toast.error(error?.message || 'Failed to fetch shipping rates');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRatesReceived = (rates: ShippingRate[]) => {
    setRates(rates);
  };

  const handleRateSelect = (rate: ShippingRate) => {
    setSelectedRate(rate);
    setShowLabelModal(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    toast.success('Payment successful! Redirecting to label creation...');
    setTimeout(() => {
      router.push('/labels');
    }, 2000);
  };

  const filteredRates = React.useMemo(() => {
    let filtered = [...rates];

    if (pageFilters.search) {
      const searchTerm = pageFilters.search.toLowerCase();
      filtered = filtered.filter(rate =>
        rate.carrier.toLowerCase().includes(searchTerm) ||
        rate.service.toLowerCase().includes(searchTerm)
      );
    }

    if (pageFilters.carriers.length > 0) {
      filtered = filtered.filter(rate =>
        pageFilters.carriers.includes(rate.carrier)
      );
    }

    if (pageFilters.maxPrice) {
      filtered = filtered.filter(rate => rate.rate <= pageFilters.maxPrice!);
    }

    if (pageFilters.maxDays) {
      filtered = filtered.filter(rate => rate.delivery_days <= pageFilters.maxDays!);
    }

    if (pageFilters.sortBy === 'price') {
      filtered.sort((a, b) => {
        const priceA = parseFloat(a.rate);
        const priceB = parseFloat(b.rate);
        return pageFilters.sortOrder === 'asc' ? priceA - priceB : priceB - priceA;
      });
    }

    if (pageFilters.sortBy === 'speed') {
      filtered.sort((a, b) => {
        const daysA = a.delivery_days;
        const daysB = b.delivery_days;
        return pageFilters.sortOrder === 'asc' ? daysA - daysB : daysB - daysA;
      });
    }

    if (pageFilters.sortBy === 'carrier') {
      filtered.sort((a, b) => {
        const carrierA = a.carrier.toLowerCase();
        const carrierB = b.carrier.toLowerCase();
        return pageFilters.sortOrder === 'asc' ? carrierA.localeCompare(carrierB) : carrierB.localeCompare(carrierA);
      });
    }

    return filtered;
  }, [rates, pageFilters]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Shipping Label</h1>
          <p className="text-gray-600">Enter shipping details and get instant rates from multiple carriers</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Shipping Form */}
          <div className="lg:col-span-2 space-y-6">
            <RedesignedShippingForm 
              onSubmit={handleShippingSubmit}
              onRatesReceived={handleRatesReceived}
              isLoading={isLoading}
            />
          </div>

          {/* Rates Panel */}
          <div className="space-y-6">
            {rates.length > 0 && (
              <>
                <ImprovedRateFilter
                  filters={pageFilters}
                  availableCarriers={availableCarriers}
                  onFiltersChange={handlePageFiltersChange}
                  onClearFilters={handlePageClearFilters}
                  rateCount={filteredRates.length}
                />

                <div className="bg-white rounded-lg shadow-sm border p-4">
                  <h3 className="font-semibold text-gray-900 mb-4">Available Rates</h3>
                  <div className="space-y-3">
                    {filteredRates.map((rate) => (
                      <ShippingRateCard
                        key={rate.id}
                        rate={rate}
                        isSelected={selectedRate?.id === rate.id}
                        onSelect={handleRateSelect}
                        showCreateLabel={true}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}

            {rates.length === 0 && !isLoading && (
              <EmptyRatesState />
            )}
          </div>
        </div>

        {/* Modals */}
        {showLabelModal && selectedRate && (
          <EnhancedLabelModal
            isOpen={showLabelModal}
            onClose={() => setShowLabelModal(false)}
            rate={selectedRate}
            formData={formData}
          />
        )}

        {showPaymentModal && selectedRate && (
          <StripePaymentModal
            isOpen={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
            amount={parseFloat(selectedRate.rate)}
            onSuccess={handlePaymentSuccess}
            description={`Shipping label - ${selectedRate.carrier} ${selectedRate.service}`}
          />
        )}

        {/* Global AI Chatbot */}
        <GlobalShipAIChatbot context="label-creation" />
      </div>
    </div>
  );
};

export default CreateLabelPage;
