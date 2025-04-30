
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Sidebar, 
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger
} from '@/components/ui/sidebar';
import { 
  Package, 
  Truck,
  Upload, 
  History, 
  CreditCard, 
  Layout
} from 'lucide-react';

const SidebarNavigation = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar>
          <SidebarHeader className="flex items-center justify-between px-4 py-2">
            <h2 className="text-lg font-bold flex items-center">
              <Package className="mr-2 h-5 w-5 text-purple-500" />
              ShipQuick
            </h2>
            <SidebarTrigger />
          </SidebarHeader>
          
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={isActive("/")} 
                  asChild 
                  tooltip="Create Shipping Label"
                >
                  <Link to="/">
                    <Package className="h-5 w-5" />
                    <span>Create Label</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={isActive("/dashboard")} 
                  asChild 
                  tooltip="Dashboard"
                >
                  <Link to="/dashboard">
                    <Layout className="h-5 w-5" />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={false} 
                  asChild 
                  tooltip="Tracking"
                >
                  <Link to="/dashboard?tab=tracking">
                    <Truck className="h-5 w-5" />
                    <span>Tracking</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={false} 
                  asChild 
                  tooltip="Bulk Upload"
                >
                  <Link to="/dashboard?tab=bulk">
                    <Upload className="h-5 w-5" />
                    <span>Bulk Shipping</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={false} 
                  asChild 
                  tooltip="History"
                >
                  <Link to="/dashboard?tab=history">
                    <History className="h-5 w-5" />
                    <span>Shipping History</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={isActive("/payment")} 
                  asChild 
                  tooltip="Payment Methods"
                >
                  <Link to="/payment">
                    <CreditCard className="h-5 w-5" />
                    <span>Payment Methods</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
        
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </SidebarProvider>
  );
};

export default SidebarNavigation;
