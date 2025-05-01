
import React from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface SidebarUserProfileProps {
  collapsed: boolean;
}

const SidebarUserProfile: React.FC<SidebarUserProfileProps> = ({ collapsed }) => {
  const { user } = useAuth();
  
  if (!user) return null;
  
  // Get user initials for avatar
  const getUserInitials = () => {
    const name = user.user_metadata?.full_name || user.email || '';
    if (!name) return 'U';
    
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    
    return name.substring(0, 2).toUpperCase();
  };

  return (
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
  );
};

export default SidebarUserProfile;
