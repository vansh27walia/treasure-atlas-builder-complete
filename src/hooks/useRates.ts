
import { useState } from 'react';
import { Rate } from '@/types/shipping';

interface UseRatesParams {
  fromAddress: any;
  toAddress: any;
  parcel: any;
}

export const useRates = (params: UseRatesParams) => {
  const [rates, setRates] = useState<Rate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchRates = async () => {
    setIsLoading(true);
    try {
      // Mock rates
      const mockRates: Rate[] = [
        {
          id: 'rate-1',
          carrier: 'USPS',
          service: 'Ground',
          rate: '12.50',
          currency: 'USD'
        },
        {
          id: 'rate-2',
          carrier: 'UPS',
          service: 'Ground',
          rate: '15.75',
          currency: 'USD'
        }
      ];
      setRates(mockRates);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    rates,
    isLoading,
    error,
    fetchRates
  };
};
