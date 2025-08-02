
import React from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Home, 
  Package, 
  Upload, 
  Calculator, 
  Truck, 
  MapPin, 
  Settings, 
  ChartBar,
  Plane,
  Container,
  FileText
} from 'lucide-react';
import SidebarNavItem from './SidebarNavItem';
import SidebarNavSection from './SidebarNavSection';
import SidebarAuthButton from './SidebarAuthButton';
import SidebarUserProfile from './SidebarUserProfile';
import { Separator } from '@/components/ui/separator';

interface SidebarContentProps {
  collapsed: boolean;
}

const SidebarContent: React.FC<SidebarContentProps> = ({ collapsed }) => {
  const location = useLocation();
  
  // Main navigation items (reordered as requested)
  const mainNavItems = [
    {
      icon: <Home className="h-5 w-5" />,
      title: 'Home',
      to: '/'
    },
    {
      icon: <Package className="h-5 w-5" />,
      title: 'Shipping',
      to: '/create-label'
    },
    {
      icon: <Upload className="h-5 w-5" />,
      title: 'Batch Label Creation',
      to: '/bulk-upload'
    },
    {
      icon: <FileText className="h-5 w-5" />,
      title: 'Import',
      to: '/import'
    },
    {
      icon: <Calculator className="h-5 w-5" />,
      title: 'Rate Calculator',
      to: '/rate-calculator'
    },
    {
      icon: <Truck className="h-5 w-5" />,
      title: 'Tracking',
      to: '/tracking'
    },
    {
      icon: <MapPin className="h-5 w-5" />,
      title: 'Pickup Scheduling',
      to: '/pickup'
    }
  ];

  // Freight services with tabs
  const freightItems = [
    {
      icon: <Container className="h-5 w-5" />,
      title: 'LTL Shipping',
      to: '/ltl-shipping'
    },
    {
      icon: <Truck className="h-5 w-5" />,
      title: 'FTL Shipping',
      to: '/ftl-shipping'
    },
    {
      icon: <Plane className="h-5 w-5" />,
      title: 'Freight Forwarding',
      to: '/freight-forwarding'
    }
  ];

  // Tools and analytics
  const toolsItems = [
    {
      icon: <ChartBar className="h-5 w-5" />,
      title: 'Analytics',
      to: '/dashboard?tab=history'
    },
    {
      icon: <Settings className="h-5 w-5" />,
      title: 'Settings',
      to: '/settings'
    }
  ];

  return (
    <div className="flex flex-col h-full">
      {/* User Profile */}
      <div className="p-4">
        <SidebarUserProfile collapsed={collapsed} />
      </div>
      
      <Separator className="bg-blue-800" />

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        <SidebarNavSection title="Main" collapsed={collapsed}>
          {mainNavItems.map((item, index) => (
            <SidebarNavItem
              key={index}
              icon={item.icon}
              title={item.title}
              to={item.to}
              collapsed={collapsed}
            />
          ))}
        </SidebarNavSection>

        <Separator className="bg-blue-800 my-4" />

        <SidebarNavSection title="Freight Services" collapsed={collapsed}>
          {freightItems.map((item, index) => (
            <SidebarNavItem
              key={index}
              icon={item.icon}
              title={item.title}
              to={item.to}
              collapsed={collapsed}
            />
          ))}
        </SidebarNavSection>

        <Separator className="bg-blue-800 my-4" />

        <SidebarNavSection title="Tools" collapsed={collapsed}>
          {toolsItems.map((item, index) => (
            <SidebarNavItem
              key={index}
              icon={item.icon}
              title={item.title}
              to={item.to}
              collapsed={collapsed}
            />
          ))}
        </SidebarNavSection>
      </div>

      {/* Auth Button */}
      <div className="p-4">
        <SidebarAuthButton collapsed={collapsed} />
      </div>
    </div>
  );
};

export default SidebarContent;
