
import React from 'react';
import Header from '@/components/Header';
import ShippingForm from '@/components/ShippingForm';
import ShippingRates from '@/components/ShippingRates';
import FeatureBanner from '@/components/FeatureBanner';
import { toast } from '@/components/ui/sonner';

const Index = () => {
  // We could show a welcome toast when the page loads
  React.useEffect(() => {
    toast("Welcome to PirateShip", {
      description: "The easiest way to ship packages at the best rates"
    });
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <FeatureBanner />
      
      <main className="flex-1 shipping-container py-8">
        <ShippingForm />
        <ShippingRates />
      </main>
      
      <footer className="bg-gray-50 border-t">
        <div className="shipping-container py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Company</h3>
              <ul className="mt-4 space-y-2">
                <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900">About</a></li>
                <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900">Careers</a></li>
                <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900">Press</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Resources</h3>
              <ul className="mt-4 space-y-2">
                <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900">Help Center</a></li>
                <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900">Shipping Guides</a></li>
                <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900">API Documentation</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Partners</h3>
              <ul className="mt-4 space-y-2">
                <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900">USPS</a></li>
                <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900">UPS</a></li>
                <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900">FedEx</a></li>
                <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900">Integrations</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Legal</h3>
              <ul className="mt-4 space-y-2">
                <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900">Terms</a></li>
                <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900">Privacy</a></li>
                <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900">Cookies</a></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} PirateShip Clone. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
