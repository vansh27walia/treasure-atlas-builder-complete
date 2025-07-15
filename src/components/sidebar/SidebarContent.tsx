
import React from 'react';
import { Home, Package, Truck, Globe, Ship, Zap, Calendar, Settings, BarChart3 } from 'lucide-react';
import SidebarNavSection from './SidebarNavSection';
import SidebarNavItem from './SidebarNavItem';
import SidebarUserProfile from './SidebarUserProfile';
import SidebarAuthButton from './SidebarAuthButton';

interface SidebarContentProps {
  collapsed: boolean;
}

const SidebarContent: React.FC<SidebarContentProps> = ({ collapsed }) => {
  const mainNavItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Package, label: 'Create Label', path: '/create-label' },
    { icon: Truck, label: 'Tracking', path: '/tracking' },
    { icon: BarChart3, label: 'Dashboard', path: '/dashboard' },
  ];

  const shippingNavItems = [
    { icon: Ship, label: 'Freight Forwarding', path: '/freight-forwarding' },
    { icon: Globe, label: 'International', path: '/international-shipping' },
    { icon: Truck, label: 'LTL Shipping', path: '/ltl-shipping' },
    { icon: Package, label: 'FTL Shipping', path: '/ftl-shipping' },
    { icon: Zap, label: 'Instant Delivery', path: '/instant-delivery' },
    { icon: Calendar, label: 'Pickup', path: '/pickup' },
  ];

  const toolsNavItems = [
    { icon: Package, label: 'Bulk Upload', path: '/bulk-upload' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 space-y-6 p-4">
        <SidebarNavSection title="Main" collapsed={collapsed}>
          {mainNavItems.map((item) => (
            <SidebarNavItem
              key={item.path}
              icon={item.icon}
              label={item.label}
              path={item.path}
              collapsed={collapsed}
            />
          ))}
        </SidebarNavSection>

        <SidebarNavSection title="Shipping" collapsed={collapsed}>
          {shippingNavItems.map((item) => (
            <SidebarNavItem
              key={item.path}
              icon={item.icon}
              label={item.label}
              path={item.path}
              collapsed={collapsed}
            />
          ))}
        </SidebarNavSection>

        <SidebarNavSection title="Tools" collapsed={collapsed}>
          {toolsNavItems.map((item) => (
            <SidebarNavItem
              key={item.path}
              icon={item.icon}
              label={item.label}
              path={item.path}
              collapsed={collapsed}
            />
          ))}
        </SidebarNavSection>
      </div>

      <div className="p-4 border-t border-blue-800">
        <SidebarUserProfile collapsed={collapsed} />
        <SidebarAuthButton collapsed={collapsed} />
      </div>
    </div>
  );
};

export default SidebarContent;
