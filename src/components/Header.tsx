
import React from 'react';
import { Ship, Package, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm">
      <div className="mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Ship className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold text-gray-900">PirateShip</h1>
        </div>
        
        <nav className="hidden md:flex space-x-8">
          <Link to="/" className="nav-link">Ship</Link>
          <Link to="/dashboard" className="nav-link">Orders</Link>
          <Link to="/tracking" className="nav-link">History</Link>
          <Link to="/help" className="nav-link">Support</Link>
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
    </header>
  );
};

export default Header;
