
import React from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  Sidebar, 
  SidebarContent,
  SidebarProvider, 
  SidebarTrigger, 
  SidebarHeader,
  useSidebar
} from '@/components/ui/sidebar';
import SidebarContent from './sidebar/SidebarContent';

interface SidebarNavigationProps {
  children: React.ReactNode;
}

const SidebarNavigation: React.FC<SidebarNavigationProps> = ({ children }) => {
  const isMobile = useIsMobile();
  
  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="flex h-screen w-full overflow-hidden">
        {/* Sidebar using shadcn/ui components */}
        <Sidebar side="left" variant="sidebar" collapsible="icon">
          <SidebarHeader className="flex items-center justify-between p-4">
            <SidebarTrigger />
          </SidebarHeader>
          <SidebarContent>
            <SidebarContent collapsed={useSidebar().state === "collapsed"} />
          </SidebarContent>
        </Sidebar>
        
        {/* Main Content */}
        <div className="flex-1 h-full overflow-y-auto bg-gray-50 w-full">
          {children}
        </div>
      </div>
    </SidebarProvider>
  );
};

export default SidebarNavigation;
