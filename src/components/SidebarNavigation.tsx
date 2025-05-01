
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { 
  Package,
  Truck, 
  Upload, 
  History, 
  CreditCard, 
  Home, 
  Settings, 
  Search, 
  Globe, 
  MapPin, 
  Calendar,
  Users,
  ShieldCheck,
  BarChart3,
  Boxes,
  Menu,
  CircleDollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const SidebarNavigation = ({
  children
}: {
  children: React.ReactNode;
}) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const menuItems = [
    {
      title: 'Main',
      items: [
        {
          name: 'Dashboard',
          path: '/',
          icon: <Home className="h-5 w-5" />,
          exact: true
        },
        {
          name: 'Create Label',
          path: '/create-label',
          icon: <Package className="h-5 w-5" />
        },
        {
          name: 'International',
          path: '/international',
          icon: <Globe className="h-5 w-5" />
        }
      ]
    },
    {
      title: 'Shipping',
      items: [
        {
          name: 'Tracking',
          path: '/dashboard?tab=tracking',
          icon: <Truck className="h-5 w-5" />
        },
        {
          name: 'Bulk Shipping',
          path: '/dashboard?tab=bulk',
          icon: <Boxes className="h-5 w-5" />,
          badge: 'New'
        },
        {
          name: 'Shipping History',
          path: '/dashboard?tab=history',
          icon: <History className="h-5 w-5" />
        },
        {
          name: 'Schedule Pickup',
          path: '/pickup',
          icon: <Calendar className="h-5 w-5" />
        }
      ]
    },
    {
      title: 'Account',
      items: [
        {
          name: 'Payment Methods',
          path: '/payment',
          icon: <CreditCard className="h-5 w-5" />
        },
        {
          name: 'Address Book',
          path: '/address-book',
          icon: <MapPin className="h-5 w-5" />
        },
        {
          name: 'Carrier Settings',
          path: '/settings',
          icon: <Settings className="h-5 w-5" />
        },
        {
          name: 'User Management',
          path: '/team',
          icon: <Users className="h-5 w-5" />
        },
        {
          name: 'Search Shipments',
          path: '/search',
          icon: <Search className="h-5 w-5" />
        }
      ]
    }
  ];

  return <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar className="border-r bg-gradient-to-b from-white to-blue-50">
          <SidebarHeader className="flex items-center justify-between px-4 py-3 bg-white shadow-sm">
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-md p-2 shadow-md">
                <Package className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-xl font-bold text-blue-900">ShipQuick</h2>
            </div>
            <SidebarTrigger>
              <Menu className="h-5 w-5 text-gray-600" />
            </SidebarTrigger>
          </SidebarHeader>
          
          <SidebarContent>
            <div className="mt-2">
              <div className="px-3 py-2 bg-blue-600 text-white m-2 rounded-lg shadow-sm">
                <Button
                  variant="ghost"
                  className="w-full bg-white/10 hover:bg-white/20 text-white flex justify-center py-5"
                  onClick={() => window.location.href = '/create-label'}
                >
                  <Package className="mr-2 h-5 w-5" />
                  Create New Label
                </Button>
              </div>
            </div>

            {menuItems.map((section, idx) => (
              <div key={section.title} className="px-3 py-2">
                <h3 className="text-xs font-semibold text-blue-800 uppercase tracking-wider px-2 mb-2">
                  {section.title}
                </h3>
                <SidebarMenu>
                  {section.items.map((item) => (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton 
                        isActive={
                          item.exact 
                            ? location.pathname === item.path
                            : item.path.includes('?') 
                              ? location.pathname + location.search === item.path
                              : isActive(item.path)
                        } 
                        asChild 
                        className={cn(
                          "hover:bg-blue-50 group transition-all duration-200 hover:translate-x-1",
                          isActive(item.path) && "bg-blue-100 text-blue-700 font-medium"
                        )}
                      >
                        <Link to={item.path} className="flex items-center justify-between py-2 px-3 rounded-lg">
                          <span className="flex items-center">
                            <span className={cn(
                              "text-gray-500 group-hover:text-blue-600 transition-colors",
                              isActive(item.path) && "text-blue-600"
                            )}>
                              {item.icon}
                            </span>
                            <span className="ml-3">{item.name}</span>
                          </span>
                          {item.badge && (
                            <Badge className="bg-blue-600 text-white text-[10px]">
                              {item.badge}
                            </Badge>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
                {idx < menuItems.length - 1 && (
                  <Separator className="my-2 bg-gray-200" />
                )}
              </div>
            ))}

            <div className="mt-auto px-3 py-2">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center mb-2">
                  <CircleDollarSign className="h-5 w-5 text-blue-600 mr-2" />
                  <h3 className="font-medium text-blue-800">Shipping Balance</h3>
                </div>
                <p className="text-lg font-bold text-blue-700">$235.50</p>
                <Button size="sm" variant="outline" className="w-full mt-2 border-blue-300 text-blue-700 hover:bg-blue-100">
                  Add Funds
                </Button>
              </div>
            </div>
            
            <div className="mt-4 px-4 py-3">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
                  JD
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700">John Doe</p>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
              </div>
            </div>
          </SidebarContent>
        </Sidebar>
        
        <div className="flex-1 overflow-auto">
          <div className="lg:hidden bg-white border-b flex justify-between items-center px-4 py-2">
            <div className="flex items-center">
              <div className="bg-blue-600 rounded-md p-1.5 shadow-sm">
                <Package className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-lg font-bold text-blue-900 ml-2">ShipQuick</h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
          {children}
        </div>
      </div>
    </SidebarProvider>;
};

export default SidebarNavigation;
