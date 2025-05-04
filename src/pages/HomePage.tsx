
import React from 'react';
import { Card } from '@/components/ui/card';
import { Link } from 'react-router-dom';

const HomePage: React.FC = () => {
  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold mb-6">Welcome to PirateShip</h1>
      <p className="mb-4">Your one-stop shipping solution</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-2">Create Shipping Labels</h2>
          <p>Create and print shipping labels for domestic and international packages.</p>
        </Card>
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-2">Track Packages</h2>
          <p>Track your shipments in real-time across multiple carriers.</p>
        </Card>
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-2">Schedule Pickups</h2>
          <p>Schedule carrier pickups without leaving your office.</p>
        </Card>
      </div>
    </div>
  );
};

export default HomePage;
