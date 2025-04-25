
import React from 'react';
import { CreditCard, Package, Scale, TrendingDown } from 'lucide-react';

const FeatureBanner: React.FC = () => {
  return (
    <div className="bg-blue-50 py-8">
      <div className="shipping-container">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-start">
            <CreditCard className="h-10 w-10 text-primary mr-4" />
            <div>
              <h3 className="font-semibold text-gray-900">No Monthly Fees</h3>
              <p className="text-sm text-gray-600 mt-1">No hidden costs. Only pay for what you ship.</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <TrendingDown className="h-10 w-10 text-primary mr-4" />
            <div>
              <h3 className="font-semibold text-gray-900">The Lowest Rates</h3>
              <p className="text-sm text-gray-600 mt-1">Access commercial discounts on all carriers.</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <Scale className="h-10 w-10 text-primary mr-4" />
            <div>
              <h3 className="font-semibold text-gray-900">Compare Carriers</h3>
              <p className="text-sm text-gray-600 mt-1">USPS, UPS, FedEx - all in one place.</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <Package className="h-10 w-10 text-primary mr-4" />
            <div>
              <h3 className="font-semibold text-gray-900">Print & Ship</h3>
              <p className="text-sm text-gray-600 mt-1">Print labels at home and schedule pickups.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeatureBanner;
