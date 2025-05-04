
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4 text-blue-800">404</h1>
        <p className="text-2xl text-gray-600 mb-8">Oops! Page not found</p>
        <Button onClick={() => navigate('/')} className="px-6 py-2">
          Return to Home
        </Button>
      </div>
    </div>
  );
};

export default NotFoundPage;
