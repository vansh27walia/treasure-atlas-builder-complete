
import React from 'react';
import { Card } from "@/components/ui/card";
import { CreateLabelWithSheet } from '@/components/shipping/CreateLabelWithSheet';

const CreateLabelPage: React.FC = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-blue-800 mb-6">Create Label</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="p-6 shadow-md rounded-xl border border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Domestic Shipping</h2>
          <p className="text-gray-600 mb-6">
            Create shipping labels for packages within the United States with various service levels and carrier options.
          </p>
          
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-blue-800 mb-2">Features</h3>
            <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
              <li>Compare rates across multiple carriers</li>
              <li>Schedule pickup or drop-off</li>
              <li>Print labels directly from your browser</li>
              <li>Track shipments in real-time</li>
            </ul>
          </div>
          
          <div className="flex justify-end">
            <a href="/create-label/domestic" className="text-blue-600 hover:underline font-medium">
              Get Started →
            </a>
          </div>
        </Card>
        
        <CreateLabelWithSheet />
      </div>
      
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 shadow-md rounded-xl border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Bulk Shipping</h3>
          <p className="text-gray-600 mb-4">
            Create multiple labels at once by uploading a CSV file with your shipping information.
          </p>
          <div className="flex justify-end">
            <a href="/bulk-upload" className="text-blue-600 hover:underline font-medium">
              Try Bulk Shipping →
            </a>
          </div>
        </Card>
        
        <Card className="p-6 shadow-md rounded-xl border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Label History</h3>
          <p className="text-gray-600 mb-4">
            View and reprint labels you've created in the past. Track shipment status and delivery.
          </p>
          <div className="flex justify-end">
            <a href="/tracking" className="text-blue-600 hover:underline font-medium">
              View History →
            </a>
          </div>
        </Card>
        
        <Card className="p-6 shadow-md rounded-xl border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Need Help?</h3>
          <p className="text-gray-600 mb-4">
            Our support team is ready to assist you with any questions about shipping or label creation.
          </p>
          <div className="flex justify-end">
            <a href="#" className="text-blue-600 hover:underline font-medium">
              Contact Support →
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CreateLabelPage;
