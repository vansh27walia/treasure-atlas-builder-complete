
import React from 'react';
import { Outlet } from 'react-router-dom';
import ShipAIChatbot from './shipping/ShipAIChatbot';

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <Outlet />
      <ShipAIChatbot />
    </div>
  );
};

export default Layout;
