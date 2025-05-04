
import React, { ReactElement } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface SidebarNavItemProps {
  icon: ReactElement;
  title: string;
  to: string;
  collapsed: boolean;
  highlight?: boolean;
}

const SidebarNavItem: React.FC<SidebarNavItemProps> = ({ 
  icon, 
  title, 
  to, 
  collapsed,
  highlight = false 
}) => {
  const location = useLocation();
  
  // Check if the route includes query parameters
  const hasQueryParams = to.includes('?');
  const path = hasQueryParams ? to.split('?')[0] : to;
  const queryParams = hasQueryParams ? to.split('?')[1] : '';
  
  // Check if this is the current active route
  let isActive = false;
  
  if (hasQueryParams) {
    // For routes with query params, check both path and specific parameter
    const currentQueryParams = new URLSearchParams(location.search);
    const targetParams = new URLSearchParams(queryParams);
    
    // Get the first parameter name and value from the target URL
    const key = Array.from(targetParams.keys())[0];
    const value = targetParams.get(key);
    
    // Check if both path and query param match
    isActive = location.pathname === path && currentQueryParams.get(key) === value;
  } else {
    // For routes without query params, just check the path
    isActive = location.pathname === to;
  }
  
  return (
    <Link
      to={to}
      className={cn(
        'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'bg-blue-800 text-white'
          : highlight 
            ? 'text-green-200 hover:bg-blue-800 hover:text-white'
            : 'text-blue-200 hover:bg-blue-800 hover:text-white',
        collapsed ? 'justify-center' : ''
      )}
    >
      <div className={cn('h-5 w-5 flex-shrink-0', collapsed ? '' : 'mr-3')}>
        {icon}
      </div>
      {!collapsed && <span>{highlight && !isActive ? "✨ " + title : title}</span>}
    </Link>
  );
};

export default SidebarNavItem;
