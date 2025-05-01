
import React from 'react';
import { LucideIcon } from 'lucide-react';
import SidebarNavItem from './SidebarNavItem';

interface NavigationItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

interface SidebarNavSectionProps {
  items: NavigationItem[];
  collapsed: boolean;
}

const SidebarNavSection: React.FC<SidebarNavSectionProps> = ({ items, collapsed }) => {
  return (
    <div className="space-y-1">
      {items.map((item) => (
        <SidebarNavItem
          key={item.name}
          href={item.href}
          icon={item.icon}
          name={item.name}
          collapsed={collapsed}
        />
      ))}
    </div>
  );
};

export default SidebarNavSection;
