
import React, { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ShopifyCallbackPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // This page will be handled by the ImportPage component
    // Just redirect back to import page with the query parameters
    const searchParams = window.location.search;
    navigate(`/import${searchParams}`, { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Connecting to Shopify...</h2>
        <p className="text-gray-600">Please wait while we complete the connection.</p>
      </div>
    </div>
  );
};

export default ShopifyCallbackPage;
