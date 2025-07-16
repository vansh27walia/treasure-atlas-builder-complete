
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface SidebarNavItemProps {
  icon: React.ReactNode;
  title: string;
  to: string;
  collapsed: boolean;
  disabled?: boolean;
}

const SidebarNavItem: React.FC<SidebarNavItemProps> = ({ 
  icon, 
  title, 
  to, 
  collapsed,
  disabled = false
}) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  if (disabled) {
    return (
      <div className={cn(
        'flex items-center px-3 py-2 text-sm font-medium rounded-md cursor-not-allowed opacity-50',
        'text-gray-400'
      )}>
        <div className="flex items-center">
          {icon}
          {!collapsed && <span className="ml-3">{title}</span>}
        </div>
        {!collapsed && <span className="ml-auto text-xs">(Soon)</span>}
      </div>
    );
  }

  return (
    <Link
      to={to}
      className={cn(
        'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
        isActive
          ? 'bg-blue-100 text-blue-700'
          : 'text-gray-300 hover:bg-blue-800 hover:text-white'
      )}
    >
      <div className="flex items-center">
        {icon}
        {!collapsed && <span className="ml-3">{title}</span>}
      </div>
    </Link>
  );
};

export default SidebarNavItem;
