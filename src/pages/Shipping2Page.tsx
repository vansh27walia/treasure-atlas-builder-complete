
import React from 'react';
import SidebarNavigation from '@/components/SidebarNavigation';
import ShippingRates from '@/components/ShippingRates';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useLocation } from 'react-router-dom';
import Shipping2Sheet from '@/components/shipping/Shipping2Sheet';

const Shipping2Page: React.FC = () => {
  const [showShipping2, setShowShipping2] = React.useState(false);
  const location = useLocation();

  return (
    <SidebarNavigation>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-900">Shipping 2</h1>
          <p className="mt-2 text-gray-600">
            Create shipping labels for international packages with competitive rates from multiple carriers
          </p>
        </div>

        <Button 
          onClick={() => setShowShipping2(true)}
          className="mb-6 bg-blue-600 hover:bg-blue-700"
        >
          Open Shipping 2
        </Button>

        <Sheet open={showShipping2} onOpenChange={setShowShipping2}>
          <SheetContent side="right" className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl">
            <Shipping2Sheet onClose={() => setShowShipping2(false)} />
          </SheetContent>
        </Sheet>

        <ShippingRates />
      </div>
    </SidebarNavigation>
  );
};

export default Shipping2Page;
