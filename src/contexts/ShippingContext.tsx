
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ShippingAddress, Parcel } from '@/types/shipping';

interface ShippingContextValue {
  shippingData: {
    fromAddress?: ShippingAddress;
    toAddress?: ShippingAddress;
    parcel?: Parcel;
    options?: Record<string, any>;
  } | null;
  setShippingData: React.Dispatch<React.SetStateAction<{
    fromAddress?: ShippingAddress;
    toAddress?: ShippingAddress;
    parcel?: Parcel;
    options?: Record<string, any>;
  } | null>>;
  resetShippingData: () => void;
}

const ShippingContext = createContext<ShippingContextValue | undefined>(undefined);

export const ShippingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [shippingData, setShippingData] = useState<{
    fromAddress?: ShippingAddress;
    toAddress?: ShippingAddress;
    parcel?: Parcel;
    options?: Record<string, any>;
  } | null>(null);

  const resetShippingData = () => {
    setShippingData(null);
  };

  return (
    <ShippingContext.Provider 
      value={{ 
        shippingData, 
        setShippingData,
        resetShippingData
      }}
    >
      {children}
    </ShippingContext.Provider>
  );
};

export const useShippingContext = () => {
  const context = useContext(ShippingContext);
  
  if (context === undefined) {
    throw new Error('useShippingContext must be used within a ShippingProvider');
  }
  
  return context;
};
