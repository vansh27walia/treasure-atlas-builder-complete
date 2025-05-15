
import React from 'react';
import { 
  Home, Package, CreditCard, Settings, ShoppingBag, Truck, MapPin, 
  BarChart3, Globe, HelpCircle, Tag, Upload, Calculator, Clock, Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import SidebarNavSection from './SidebarNavSection';
import SidebarNavItem from './SidebarNavItem';
import SidebarUserProfile from './SidebarUserProfile';
import SidebarAuthButton from './SidebarAuthButton';

interface SidebarContentProps {
  collapsed: boolean;
}

const SidebarContent: React.FC<SidebarContentProps> = ({ collapsed }) => {
  return (
    <div className="flex flex-col flex-1 overflow-y-auto py-4">
      {/* User Profile */}
      <SidebarUserProfile collapsed={collapsed} />

      {/* Main Navigation */}
      <div className="mt-8 flex-1">
        <SidebarNavSection title="Main" collapsed={collapsed}>
          <SidebarNavItem
            icon={<Home size={18} />}
            title="Dashboard"
            to="/"
            collapsed={collapsed}
          />
          <SidebarNavItem
            icon={<Package size={18} />}
            title="Create Label"
            to="/create-label"
            collapsed={collapsed}
          />
          <SidebarNavItem
            icon={<Calculator size={18} />}
            title="Rate Calculator"
            to="/create-label?tab=calculator"
            collapsed={collapsed}
          />
          <SidebarNavItem
            icon={<Globe size={18} />}
            title="International"
            to="/international"
            collapsed={collapsed}
          />
          <SidebarNavItem
            icon={<Package size={18} />}
            title="Shipping Too"
            to="/shipping-too"
            collapsed={collapsed}
          />
        </SidebarNavSection>

        <SidebarNavSection title="Shipping" collapsed={collapsed}>
          <SidebarNavItem
            icon={<MapPin size={18} />}
            title="Pickup Service"
            to="/pickup"
            collapsed={collapsed}
          />
          <SidebarNavItem
            icon={<Truck size={18} />}
            title="Tracking"
            to="/tracking" 
            collapsed={collapsed}
          />
          <SidebarNavItem
            icon={<Upload size={18} />}
            title="Bulk Upload"
            to="/bulk-upload"
            collapsed={collapsed}
          />
          <SidebarNavItem
            icon={<Truck size={18} />}
            title="LTL Shipping"
            to="/ltl-shipping"
            collapsed={collapsed}
          />
          <SidebarNavItem
            icon={<Truck size={18} />}
            title="Full Truckload"
            to="/ftl-shipping"
            collapsed={collapsed}
          />
          <SidebarNavItem
            icon={<Clock size={18} />}
            title="Instant Delivery"
            to="/instant-delivery"
            collapsed={collapsed}
          />
          <SidebarNavItem
            icon={<BarChart3 size={18} />}
            title="Reports"
            to="/dashboard?tab=history"
            collapsed={collapsed}
          />
          <SidebarNavItem
            icon={<CreditCard size={18} />}
            title="Payment"
            to="/payment"
            collapsed={collapsed}
          />
        </SidebarNavSection>
        
        <SidebarNavSection title="More" collapsed={collapsed}>
          <SidebarNavItem
            icon={<Settings size={18} />}
            title="Settings"
            to="/settings"
            collapsed={collapsed}
          />
          <SidebarNavItem
            icon={<HelpCircle size={18} />}
            title="Help Center"
            to="/help"
            collapsed={collapsed}
          />
          <SidebarNavItem
            icon={<Tag size={18} />}
            title="Pricing"
            to="/pricing"
            collapsed={collapsed}
          />
        </SidebarNavSection>
      </div>

      {/* Authentication Button */}
      <SidebarAuthButton collapsed={collapsed} />
    </div>
  );
};

export default SidebarContent;
