import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Package, Truck, Upload, History, CreditCard, Layout, Settings, Search } from 'lucide-react';
const SidebarNavigation = ({
  children
}: {
  children: React.ReactNode;
}) => {
  const location = useLocation();
  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };
  return <SidebarProvider>
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
                <SidebarMenuButton isActive={isActive("/")} asChild tooltip="Dashboard">
                  <Link to="/">
                    <Layout className="h-5 w-5" />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton isActive={isActive("/create-label")} asChild tooltip="Create Label">
                  <Link to="/create-label">
                    <Package className="h-5 w-5" />
                    <span>Create Label</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton isActive={location.pathname === "/dashboard" && location.search.includes("tab=tracking")} asChild tooltip="Tracking">
                  <Link to="/dashboard?tab=tracking">
                    <Truck className="h-5 w-5" />
                    <span>Tracking</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton isActive={location.pathname === "/dashboard" && location.search.includes("tab=bulk")} asChild tooltip="Bulk Upload">
                  <Link to="/dashboard?tab=bulk">
                    <Upload className="h-5 w-5" />
                    <span>Bulk Shipping</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton isActive={location.pathname === "/dashboard" && location.search.includes("tab=history")} asChild tooltip="History">
                  <Link to="/dashboard?tab=history">
                    <History className="h-5 w-5" />
                    <span>Shipping History</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton isActive={isActive("/payment")} asChild tooltip="Payment Methods">
                  <Link to="/payment" className="">
                    <CreditCard className="h-5 w-5 bg-slate-50 rounded-3xl" />
                    <span>Payment Methods</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton isActive={false} asChild tooltip="Settings">
                  <Link to="/settings">
                    <Settings className="h-5 w-5" />
                    <span>Carrier Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton isActive={false} asChild tooltip="Search">
                  <Link to="/search">
                    <Search className="h-5 w-5" />
                    <span>Search Shipments</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
        
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </SidebarProvider>;
};
export default SidebarNavigation;