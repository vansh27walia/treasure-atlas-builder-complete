
import React from 'react';
import { Zap, Package, Box, Settings, CreditCard, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm">
      <div className="shipping-container">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <Zap className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-gray-900">ShippingQuick.io</h1>
          </div>
          
          <nav className="hidden md:flex space-x-8">
            <a href="#" className="nav-link active">Ship</a>
            <a href="#" className="nav-link">Orders</a>
            <a href="#" className="nav-link">History</a>
            <a href="#" className="nav-link">Tools</a>
            <a href="#" className="nav-link">Integrations</a>
            <a href="#" className="nav-link">Support</a>
          </nav>
          
          <div className="flex gap-2">
            <Button variant="outline" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Account</span>
            </Button>
            <Button className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Ship Now</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
