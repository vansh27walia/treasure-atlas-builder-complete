
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Separator } from '@/components/ui/separator';
import sidebarNavItems from './sidebar/SidebarContent';
import ToggleButton from './sidebar/ToggleButton';
import { NavLink } from 'react-router-dom';
import {
  ChevronDown,
  ChevronRight,
} from "lucide-react";

interface SidebarNavItem {
  title: string;
  href: string;
  disabled?: boolean;
  external?: boolean;
  icon?: React.ComponentType<any>;
  label?: string;
}

interface SidebarNavGroup {
  title: string;
  icon?: React.ComponentType<any>;
  items: SidebarNavItem[];
}

interface SidebarNavigationProps {
  children: React.ReactNode;
}

const SidebarNavigation: React.FC<SidebarNavigationProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const isMobile = useIsMobile();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  
  // Handle sidebar collapse toggle
  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  // Handle group expansion toggle
  const toggleGroup = (groupTitle: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupTitle]: !prev[groupTitle]
    }));
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Sidebar */}
      <div
        className={cn(
          'bg-blue-950 text-white transition-all duration-300 h-full flex flex-col relative',
          collapsed ? 'w-20' : 'w-64'
        )}
      >
        {/* Logo and Toggle Button */}
        <div className="flex items-center justify-between p-4">
          <div className="flex-1" /> {/* Spacer */}
          <ToggleButton collapsed={collapsed} onClick={toggleSidebar} />
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-1 px-4">
            {sidebarNavItems.items.map((item, index) => {
              // Check if item is a group with subitems
              if ('items' in item) {
                const group = item as SidebarNavGroup;
                const isExpanded = expandedGroups[group.title] || false;
                
                return (
                  <div key={index} className="py-2">
                    <div 
                      className="flex items-center justify-between cursor-pointer py-2 px-2 rounded-md hover:bg-blue-900"
                      onClick={() => toggleGroup(group.title)}
                    >
                      <div className="flex items-center">
                        {group.icon && <group.icon className="mr-2 h-5 w-5" />}
                        {!collapsed && <span>{group.title}</span>}
                      </div>
                      {!collapsed && (
                        isExpanded ? 
                          <ChevronDown className="h-4 w-4" /> : 
                          <ChevronRight className="h-4 w-4" />
                      )}
                    </div>
                    
                    {isExpanded && !collapsed && (
                      <div className="ml-4 pl-2 border-l border-blue-800 space-y-1 mt-1">
                        {group.items.map((subItem, subIndex) => (
                          <NavLink 
                            key={subIndex}
                            to={subItem.href}
                            className={({ isActive }) => 
                              `flex items-center py-2 px-2 rounded-md ${
                                isActive 
                                  ? 'bg-blue-700 text-white' 
                                  : 'hover:bg-blue-900'
                              }`
                            }
                          >
                            <span>{subItem.title}</span>
                            {subItem.label && (
                              <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-yellow-400 text-black">
                                {subItem.label}
                              </span>
                            )}
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                );
              } else {
                // Regular item
                const navItem = item as SidebarNavItem;
                return (
                  <NavLink
                    key={index}
                    to={navItem.href}
                    className={({ isActive }) => 
                      `flex items-center py-2 px-2 rounded-md ${
                        isActive 
                          ? 'bg-blue-700 text-white' 
                          : 'hover:bg-blue-900'
                      }`
                    }
                  >
                    {navItem.icon && <navItem.icon className="mr-2 h-5 w-5" />}
                    {!collapsed && (
                      <>
                        <span>{navItem.title}</span>
                        {navItem.label && (
                          <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-yellow-400 text-black">
                            {navItem.label}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              }
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 h-full overflow-y-auto bg-gray-50 w-full">
        {children}
      </div>
    </div>
  );
};

export default SidebarNavigation;
