
import React from 'react';
import { Home, Package, Truck, Plane, Ship, Calculator, Settings, BarChart } from 'lucide-react';
import SidebarNavSection from './SidebarNavSection';

const SidebarContent = () => {
  const shippingItems = [
    {
      name: 'Create Label',
      href: '/create-label',
      icon: Package
    },
    {
      name: 'Rate Calculator',
      href: '/rate-calculator',
      icon: Calculator
    },
    {
      name: 'Freight Forwarding',
      href: '/freight-forwarding',
      icon: Ship
    },
    {
      name: 'International',
      href: '/international',
      icon: Plane
    },
    {
      name: 'LTL Shipping',
      href: '/ltl-shipping',
      icon: Truck
    },
    {
      name: 'FTL Shipping',
      href: '/ftl-shipping',
      icon: Truck
    },
    {
      name: 'Instant Delivery',
      href: '/instant-delivery',
      icon: Package
    }
  ];

  const managementItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: BarChart
    },
    {
      name: 'Tracking',
      href: '/tracking',
      icon: Package
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings
    }
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-8">
          <Home className="w-6 h-6 text-primary" />
          <span className="font-bold text-lg">ShipFlow</span>
        </div>
      </div>

      <nav className="flex-1 px-4">
        <SidebarNavSection 
          title="Shipping" 
          items={shippingItems}
        />
        <SidebarNavSection 
          title="Management" 
          items={managementItems}
        />
      </nav>
    </div>
  );
};

export default SidebarContent;
