
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, 
  Package, 
  Truck, 
  Search, 
  Settings, 
  Calculator,
  Upload,
  FileSpreadsheet,
  Layers
} from 'lucide-react';

const SidebarNavigation = () => {
  const location = useLocation();
  
  const navItems = [
    { 
      name: 'Dashboard', 
      path: '/', 
      icon: Home 
    },
    { 
      name: 'Shipping', 
      path: '/create-label', 
      icon: Package 
    },
    { 
      name: 'Batch Label Creation', 
      path: '/bulk-upload', 
      icon: FileSpreadsheet 
    },
    { 
      name: 'Rate Calculator', 
      path: '/rate-calculator', 
      icon: Calculator 
    },
    { 
      name: 'LTL Shipping', 
      path: '/ltl-shipping', 
      icon: Truck 
    },
    { 
      name: 'FTL Shipping', 
      path: '/ftl-shipping', 
      icon: Layers 
    },
    { 
      name: 'Instant Delivery', 
      path: '/instant-delivery', 
      icon: Upload 
    },
    { 
      name: 'Tracking', 
      path: '/tracking', 
      icon: Search 
    },
    { 
      name: 'Settings', 
      path: '/settings', 
      icon: Settings 
    }
  ];

  return (
    <nav className="mt-8">
      <div className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                isActive
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
              {item.name}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default SidebarNavigation;
