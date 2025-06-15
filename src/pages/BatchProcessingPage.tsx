
import React from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import BatchLabelProcessor from '@/components/batch-processing/BatchLabelProcessor';

const BatchProcessingPage: React.FC = () => {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <BatchLabelProcessor />
      </div>
    </ProtectedRoute>
  );
};

export default BatchProcessingPage;
