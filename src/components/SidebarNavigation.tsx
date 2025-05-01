
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useMedia } from '@/hooks/use-mobile';
import { 
  LayoutDashboard, 
  Package, 
  CreditCard, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Gauge,
  Globe,
  Truck,
  Home,
  PackageOpen,
  FileText,
  LogOut,
  User
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/components/ui/sonner';

interface SidebarNavigationProps {
  children: React.ReactNode;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

const mainNavItems: NavigationItem[] = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Create Label', href: '/create-label', icon: PackageOpen },
  { name: 'International', href: '/international', icon: Globe },
  { name: 'Schedule Pickup', href: '/pickup', icon: Truck },
  { name: 'Payment', href: '/payment', icon: CreditCard },
];

const secondaryNavItems: NavigationItem[] = [
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Tracking', href: '/tracking', icon: Gauge },
  { name: 'Reports', href: '/reports', icon: FileText },
];

const SidebarNavigation: React.FC<SidebarNavigationProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const isMobile = useMedia('(max-width: 768px)');
  const location = useLocation();
  const { user, signOut } = useAuth();
  
  // Handle sidebar collapse toggle
  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };
  
  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return 'G';
    
    const name = user.user_metadata?.full_name || user.email || '';
    if (!name) return 'U';
    
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div
        className={cn(
          'bg-blue-950 text-white transition-all duration-300 h-full flex flex-col relative',
          collapsed ? 'w-20' : 'w-64'
        )}
      >
        {/* Logo */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-blue-400" />
            {!collapsed && (
              <span className="ml-3 font-bold text-xl text-white">ShipEase</span>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="text-white hover:bg-blue-800 ml-auto"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </Button>
        </div>

        <Separator className="bg-blue-800 my-2" />
        
        {/* User profile */}
        {user && (
          <div className={cn(
            "px-4 py-3 flex items-center",
            collapsed ? "justify-center" : "justify-start"
          )}>
            <Avatar className="h-9 w-9 border-2 border-blue-400">
              <AvatarFallback className="bg-blue-700 text-white font-medium">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            
            {!collapsed && (
              <div className="ml-3 overflow-hidden">
                <p className="text-sm font-medium truncate">
                  {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-xs text-blue-300 truncate">
                  {user.email}
                </p>
              </div>
            )}
          </div>
        )}

        <Separator className="bg-blue-800 mb-2" />

        {/* Main Navigation */}
        <div className="flex-1 overflow-y-auto py-2 px-2">
          <div className="space-y-1">
            {mainNavItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  location.pathname === item.href
                    ? 'bg-blue-800 text-white'
                    : 'text-blue-200 hover:bg-blue-800 hover:text-white',
                  collapsed ? 'justify-center' : ''
                )}
              >
                <item.icon className={cn('h-5 w-5 flex-shrink-0', collapsed ? '' : 'mr-3')} />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            ))}
          </div>
          
          <Separator className="bg-blue-800 my-4" />
          
          {/* Secondary Navigation */}
          <div className="space-y-1">
            {secondaryNavItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  location.pathname === item.href
                    ? 'bg-blue-800 text-white'
                    : 'text-blue-200 hover:bg-blue-800 hover:text-white',
                  collapsed ? 'justify-center' : ''
                )}
              >
                <item.icon className={cn('h-5 w-5 flex-shrink-0', collapsed ? '' : 'mr-3')} />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            ))}
          </div>
        </div>
        
        {/* Auth Links */}
        <div className="p-2">
          {user ? (
            <button
              onClick={handleSignOut}
              className={cn(
                'w-full flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                'text-red-300 hover:bg-red-900/40 hover:text-white',
                collapsed ? 'justify-center' : ''
              )}
            >
              <LogOut className={cn('h-5 w-5 flex-shrink-0', collapsed ? '' : 'mr-3')} />
              {!collapsed && <span>Sign Out</span>}
            </button>
          ) : (
            <Link
              to="/auth"
              className={cn(
                'w-full flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                'text-green-300 hover:bg-green-900/40 hover:text-white',
                collapsed ? 'justify-center' : ''
              )}
            >
              <User className={cn('h-5 w-5 flex-shrink-0', collapsed ? '' : 'mr-3')} />
              {!collapsed && <span>Sign In</span>}
            </Link>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {children}
      </div>
    </div>
  );
};

export default SidebarNavigation;
