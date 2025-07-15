
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface SidebarNavItemProps {
  icon: LucideIcon;
  label: string;
  path: string;
  collapsed: boolean;
}

const SidebarNavItem: React.FC<SidebarNavItemProps> = ({ icon: Icon, label, path, collapsed }) => {
  const location = useLocation();
  const isActive = location.pathname === path;

  return (
    <Link
      to={path}
      className={cn(
        'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'bg-blue-800 text-white'
          : 'text-blue-200 hover:bg-blue-800 hover:text-white',
        collapsed ? 'justify-center' : ''
      )}
    >
      <Icon className={cn('h-5 w-5 flex-shrink-0', collapsed ? '' : 'mr-3')} />
      {!collapsed && <span>{label}</span>}
    </Link>
  );
};

export default SidebarNavItem;
