
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { 
  Package, 
  Truck, 
  Upload, 
  History, 
  CreditCard, 
  Layout, 
  Settings, 
  Search, 
  Globe, 
  MapPin, 
  Calendar,
  Users
} from 'lucide-react';

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
        <Sidebar className="border-r bg-slate-50">
          <SidebarHeader className="flex items-center justify-between px-4 py-3 bg-white">
            <h2 className="text-xl font-bold flex items-center">
              <Package className="mr-2 h-6 w-6 text-purple-600" />
              ShipQuick
            </h2>
            <SidebarTrigger />
          </SidebarHeader>
          
          <SidebarContent>
            <div className="px-3 py-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-2">
                Main
              </h3>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={isActive("/")} asChild tooltip="Dashboard" className="hover:bg-slate-200">
                    <Link to="/" className="flex items-center py-2 px-3 rounded-lg">
                      <Layout className="h-5 w-5" />
                      <span className="ml-3">Dashboard</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={isActive("/create-label")} asChild tooltip="Create Label" className="hover:bg-slate-200">
                    <Link to="/create-label" className="flex items-center py-2 px-3 rounded-lg">
                      <Package className="h-5 w-5" />
                      <span className="ml-3">Create Label</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={isActive("/international")} asChild tooltip="International" className="hover:bg-slate-200">
                    <Link to="/international" className="flex items-center py-2 px-3 rounded-lg">
                      <Globe className="h-5 w-5" />
                      <span className="ml-3">International</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </div>

            <div className="px-3 py-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-2">
                Shipping
              </h3>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={location.pathname === "/dashboard" && location.search.includes("tab=tracking")} asChild tooltip="Tracking" className="hover:bg-slate-200">
                    <Link to="/dashboard?tab=tracking" className="flex items-center py-2 px-3 rounded-lg">
                      <Truck className="h-5 w-5" />
                      <span className="ml-3">Tracking</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={location.pathname === "/dashboard" && location.search.includes("tab=bulk")} asChild tooltip="Bulk Upload" className="hover:bg-slate-200">
                    <Link to="/dashboard?tab=bulk" className="flex items-center py-2 px-3 rounded-lg">
                      <Upload className="h-5 w-5" />
                      <span className="ml-3">Bulk Shipping</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={location.pathname === "/dashboard" && location.search.includes("tab=history")} asChild tooltip="History" className="hover:bg-slate-200">
                    <Link to="/dashboard?tab=history" className="flex items-center py-2 px-3 rounded-lg">
                      <History className="h-5 w-5" />
                      <span className="ml-3">Shipping History</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={isActive("/pickup")} asChild tooltip="Schedule Pickup" className="hover:bg-slate-200">
                    <Link to="/pickup" className="flex items-center py-2 px-3 rounded-lg">
                      <Calendar className="h-5 w-5" />
                      <span className="ml-3">Schedule Pickup</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </div>

            <div className="px-3 py-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-2">
                Account
              </h3>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={isActive("/payment")} asChild tooltip="Payment Methods" className="hover:bg-slate-200">
                    <Link to="/payment" className="flex items-center py-2 px-3 rounded-lg">
                      <CreditCard className="h-5 w-5" />
                      <span className="ml-3">Payment Methods</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={isActive("/address-book")} asChild tooltip="Address Book" className="hover:bg-slate-200">
                    <Link to="/address-book" className="flex items-center py-2 px-3 rounded-lg">
                      <MapPin className="h-5 w-5" />
                      <span className="ml-3">Address Book</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={isActive("/settings")} asChild tooltip="Settings" className="hover:bg-slate-200">
                    <Link to="/settings" className="flex items-center py-2 px-3 rounded-lg">
                      <Settings className="h-5 w-5" />
                      <span className="ml-3">Carrier Settings</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={isActive("/team")} asChild tooltip="Team" className="hover:bg-slate-200">
                    <Link to="/team" className="flex items-center py-2 px-3 rounded-lg">
                      <Users className="h-5 w-5" />
                      <span className="ml-3">User Management</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={isActive("/search")} asChild tooltip="Search" className="hover:bg-slate-200">
                    <Link to="/search" className="flex items-center py-2 px-3 rounded-lg">
                      <Search className="h-5 w-5" />
                      <span className="ml-3">Search Shipments</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </div>
          </SidebarContent>
        </Sidebar>
        
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </SidebarProvider>;
};

export default SidebarNavigation;
