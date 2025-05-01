
import React from 'react';
import { Separator } from '@/components/ui/separator';
import SidebarUserProfile from './SidebarUserProfile';
import SidebarNavSection from './SidebarNavSection';
import SidebarAuthButton from './SidebarAuthButton';
import { useAuth } from '@/contexts/AuthContext';
import { 
  LayoutDashboard, 
  Package, 
  Globe,
  Truck,
  Home,
  PackageOpen,
  FileText,
  CreditCard, 
  Settings, 
  Gauge,
} from 'lucide-react';

interface SidebarContentProps {
  collapsed: boolean;
}

const mainNavItems = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Create Label', href: '/create-label', icon: PackageOpen },
  { name: 'International', href: '/international', icon: Globe },
  { name: 'Schedule Pickup', href: '/pickup', icon: Truck },
  { name: 'Payment', href: '/payment', icon: CreditCard },
];

const secondaryNavItems = [
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Tracking', href: '/tracking', icon: Gauge },
  { name: 'Reports', href: '/reports', icon: FileText },
];

const SidebarContent: React.FC<SidebarContentProps> = ({ collapsed }) => {
  const { user } = useAuth();
  
  return (
    <>
      {/* Logo */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center">
          <Package className="h-8 w-8 text-blue-400" />
          {!collapsed && (
            <span className="ml-3 font-bold text-xl text-white">ShipEase</span>
          )}
        </div>
      </div>

      <Separator className="bg-blue-800 my-2" />
      
      {/* User profile */}
      {user && (
        <>
          <SidebarUserProfile collapsed={collapsed} />
          <Separator className="bg-blue-800 mb-2" />
        </>
      )}

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto py-2 px-2">
        <SidebarNavSection items={mainNavItems} collapsed={collapsed} />
        
        <Separator className="bg-blue-800 my-4" />
        
        {/* Secondary Navigation */}
        <SidebarNavSection items={secondaryNavItems} collapsed={collapsed} />
      </div>
      
      {/* Auth Links */}
      <div className="p-2">
        <SidebarAuthButton collapsed={collapsed} />
      </div>
    </>
  );
};

export default SidebarContent;
