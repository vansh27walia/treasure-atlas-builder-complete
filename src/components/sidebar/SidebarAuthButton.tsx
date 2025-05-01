
import React from 'react';
import { Link } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';

interface SidebarAuthButtonProps {
  collapsed: boolean;
}

const SidebarAuthButton: React.FC<SidebarAuthButtonProps> = ({ collapsed }) => {
  const { user, signOut } = useAuth();
  
  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  if (user) {
    return (
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
    );
  }
  
  return (
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
  );
};

export default SidebarAuthButton;
