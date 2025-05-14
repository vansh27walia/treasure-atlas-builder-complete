
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Separator } from '@/components/ui/separator';
import SidebarContent from './sidebar/SidebarContent';
import ToggleButton from './sidebar/ToggleButton';

interface SidebarNavigationProps {
  children: React.ReactNode;
}

const SidebarNavigation: React.FC<SidebarNavigationProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const isMobile = useIsMobile();
  
  // Handle sidebar collapse toggle
  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Sidebar */}
      <div
        className={cn(
          'bg-blue-950 text-white transition-all duration-300 h-full flex flex-col relative',
          collapsed ? 'w-20' : 'w-64'
        )}
      >
        {/* Logo and Toggle Button */}
        <div className="flex items-center justify-between p-4">
          <div className="flex-1" /> {/* Spacer */}
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
