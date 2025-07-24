
import React from 'react';
import Layout from '@/components/Layout';
import ShopifyBulkShipping from '@/components/shipping/ShopifyBulkShipping';

const ShopifyBulkShippingPage: React.FC = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Shopify Bulk Shipping</h1>
            <p className="text-gray-600">
              Import Shopify orders and process them in bulk for efficient shipping label creation.
            </p>
          </div>
          
          <ShopifyBulkShipping />
        </div>
      </div>
    </Layout>
  );
};

export default ShopifyBulkShippingPage;
