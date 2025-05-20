
import React from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  Sidebar, 
  SidebarContent as ShadcnSidebarContent,
  SidebarProvider, 
  SidebarTrigger, 
  SidebarHeader,
  useSidebar
} from '@/components/ui/sidebar';
import CustomSidebarContent from './sidebar/SidebarContent';

interface SidebarNavigationProps {
  children: React.ReactNode;
}

const SidebarNavigation: React.FC<SidebarNavigationProps> = ({ children }) => {
  const isMobile = useIsMobile();
  const sidebarState = useSidebar();
  
  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="flex h-screen w-full overflow-hidden">
        {/* Sidebar using shadcn/ui components */}
        <Sidebar side="left" variant="sidebar" collapsible="icon">
          <SidebarHeader className="flex items-center justify-between p-4">
            <SidebarTrigger />
          </SidebarHeader>
          <ShadcnSidebarContent>
            <CustomSidebarContent collapsed={sidebarState.state === "collapsed"} />
          </ShadcnSidebarContent>
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
