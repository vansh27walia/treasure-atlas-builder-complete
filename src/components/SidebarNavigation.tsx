
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Separator } from '@/components/ui/separator';
import { Zap } from 'lucide-react';
import SidebarContent from './sidebar/SidebarContent';
import ToggleButton from './sidebar/ToggleButton';

interface SidebarNavigationProps {
  children: React.ReactNode;
}

const SidebarNavigation: React.FC<SidebarNavigationProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();
  
  // Hide sidebar on auth pages
  const isAuthPage = location.pathname === '/auth' || location.pathname === '/reset-password';
  
  // Handle sidebar collapse toggle
  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  if (isAuthPage) {
    return (
      <div className="h-screen w-full overflow-hidden">
        <div className="h-full overflow-y-auto bg-gray-50 w-full">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Sidebar */}
      <div
        className={cn(
          'bg-blue-950 text-white transition-all duration-300 h-full flex flex-col relative',
          collapsed ? 'w-20' : 'w-64'
        )}
      >
        {/* Logo and Brand */}
        <div className="flex items-center justify-between p-4 border-b border-blue-800">
          <div className={cn("flex items-center gap-2", collapsed && "justify-center w-full")}>
            <Zap className="h-8 w-8 text-blue-400 flex-shrink-0" />
            {!collapsed && (
              <span className="font-bold text-lg text-white">ShippingQuick.io</span>
            )}
          </div>
          <ToggleButton collapsed={collapsed} onClick={toggleSidebar} />
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <SidebarContent collapsed={collapsed} />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 h-full overflow-y-auto bg-gray-50 w-full">
        {children}
      </div>
    </div>
  );
};

export default SidebarNavigation;
