
import React from 'react';

interface SidebarNavSectionProps {
  title: string;
  collapsed: boolean;
  children: React.ReactNode;
}

const SidebarNavSection: React.FC<SidebarNavSectionProps> = ({ 
  title, 
  collapsed,
  children 
}) => {
  return (
    <div className="mb-6">
      {!collapsed && title && (
        <h3 className="mb-2 px-4 text-xs font-semibold text-blue-300 uppercase">
          {title}
        </h3>
      )}
      <div className="space-y-1">
        {children}
      </div>
    </div>
  );
};

export default SidebarNavSection;
