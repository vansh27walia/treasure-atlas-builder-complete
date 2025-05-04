
import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import SidebarNavigation from './SidebarNavigation';

const Layout: React.FC = () => {
  return (
    <SidebarNavigation>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </SidebarNavigation>
  );
};

export default Layout;
