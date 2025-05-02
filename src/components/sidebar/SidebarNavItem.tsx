
import React, { ReactElement } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface SidebarNavItemProps {
  icon: ReactElement;
  title: string;
  to: string;
  collapsed: boolean;
}

const SidebarNavItem: React.FC<SidebarNavItemProps> = ({ icon, title, to, collapsed }) => {
  const location = useLocation();
  const isActive = location.pathname === to || location.pathname + location.search === to;
  
  return (
    <Link
      to={to}
      className={cn(
        'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'bg-blue-800 text-white'
          : 'text-blue-200 hover:bg-blue-800 hover:text-white',
        collapsed ? 'justify-center' : ''
      )}
    >
      <div className={cn('h-5 w-5 flex-shrink-0', collapsed ? '' : 'mr-3')}>
        {icon}
      </div>
      {!collapsed && <span>{title}</span>}
    </Link>
  );
};

export default SidebarNavItem;
