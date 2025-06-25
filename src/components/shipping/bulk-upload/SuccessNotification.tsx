import React, { useState } from 'react';

// Mocking shadcn/ui components and lucide-react icons
// In a real app, these would be imported from your project's UI library.

// Mock Card component
const Card = ({ children, className }) => (
  <div className={`rounded-lg shadow-sm ${className || ''}`}>
    {children}
  </div>
);

// Mock Button component
const Button = ({ children, onClick, className, disabled, size }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`flex items-center justify-center px-4 py-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${className || ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${size === 'lg' ? 'px-6 py-3 text-lg' : ''}`}
  >
    {children}
  </button>
);

// Mock CheckCircle icon
const CheckCircle = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

// Mock Download icon (still needed if individual labels have download option)
const Download = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="7 10 12 15 17 10"></polyline>
    <line x1="12" y1="15" x2="12" y2="3"></line>
  </svg>
);

// Mock Printer icon (added for the new button)
const Printer = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
    <path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6"></path>
    <rect x="6" y="14" width="12" height="8" rx="1"></rect>
  </svg>
);


// Mock toast component (from sonner)
const toast = {
  success: (message) => console.log('Toast Success:', message),
  error: (message) => console.error('Toast Error:', message),
  loading: (message) => console.log('Toast Loading:', message),
  dismiss: () => console.log('Toast Dismissed'),
};

// Mock LabelResultsTable component (defined as a simple div for visual purposes)
const LabelResultsTable = ({ shipments, onDownloadLabel }) => {
  return (
    <Card className="p-6">
      <h4 className="font-medium text-gray-800 mb-3">Label Results Details</h4>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Shipment ID
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tracking Number
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Label URL
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {shipments.map((shipment, index) => (
              <tr key={shipment.id || index}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{shipment.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{shipment.tracking_number || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    shipment.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {shipment.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {shipment.label_url || shipment.label_urls?.png ? (
                    <a href={shipment.label_url || shipment.label_urls.png} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      View Label
                    </a>
                  ) : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {(shipment.label_url || shipment.label_urls?.png) && (
                    <Button
                      onClick={() => onDownloadLabel(shipment.label_url || shipment.label_urls.png, 'png')}
                      className="text-indigo-600 hover:text-indigo-900 bg-transparent hover:bg-gray-100 p-1 rounded"
                    >
                      Download
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};


// The SuccessNotification component with the button replaced
const SuccessNotification = ({
  results,
  onDownloadAllLabels, // Still kept in props just in case, but no longer used by this button
  onDownloadSingleLabel,
  onCreateLabels,
  isPaying,
  isCreatingLabels
}) => {
  console.log('SuccessNotification received results:', results);

  let allShipments = [];
  if (Array.isArray(results.processedShipments)) {
    allShipments = results.processedShipments;
  } else if (results.processedShipments && typeof results.processedShipments === 'object') {
    const shipmentValues = Object.values(results.processedShipments);
    allShipments = shipmentValues.filter(item =>
      item &&
      typeof item === 'object' &&
      'id' in item
    );
  }

  console.log(`SuccessNotification - All shipments: ${allShipments.length}`, allShipments);

  const shipmentsWithLabels = allShipments.filter(shipment => {
    const hasLabel = !!(
      (shipment.label_url && shipment.label_url.trim() !== '') ||
      (shipment.label_urls?.png && shipment.label_urls.png.trim() !== '') ||
      shipment.status === 'completed'
    );
    return hasLabel;
  });

  const failedShipments = allShipments.filter(shipment => shipment.status === 'failed');

  console.log('SuccessNotification Debug:', {
    totalShipments: allShipments.length,
    shipmentsWithLabels: shipmentsWithLabels.length,
    failedShipments: failedShipments.length
  });

  const hasLabels = shipmentsWithLabels.length > 0;
  const totalProcessed = allShipments.length;

  const shouldShowNotification = totalProcessed > 0 || results.total > 0 || results.successful > 0;

  const downloadFile = async (url, filename) => {
    try {
      console.log('Downloading file from URL:', url);

      if (!url || url.trim() === '') {
        toast.error('Invalid label URL - cannot download');
        return;
      }

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.target = '_blank';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Downloaded ${filename}`);
    } catch (error) {
      console.error('Download error:', error);
      toast.error(`Failed to download ${filename}`);
    }
  };

  // New handler for "Preview All Labels"
  const handlePreviewAllLabels = async () => {
    console.log('Previewing all labels, count:', shipmentsWithLabels.length);

    if (shipmentsWithLabels.length === 0) {
      toast.error('No labels available for preview');
      return;
    }

    toast.loading('Preparing labels for preview...');

    // For a "preview" action, instead of forcing download, you'd typically open
    // the labels in new tabs or a modal for viewing.
    // Here, we simulate opening each label in a new tab.
    let openedCount = 0;
    for (let i = 0; i < shipmentsWithLabels.length; i++) {
      const shipment = shipmentsWithLabels[i];
      const labelUrl = shipment.label_urls?.png || shipment.label_url;
      if (labelUrl && labelUrl.trim() !== '') {
        try {
          // Open each label in a new tab. Browsers might block pop-ups if too many.
          setTimeout(() => {
            window.open(labelUrl, '_blank');
            openedCount++;
          }, i * 300); // Small delay to avoid overwhelming browser pop-up blocker
        } catch (error) {
          console.error('Error previewing label for shipment:', shipment.id, error);
        }
      }
    }

    toast.dismiss();
    setTimeout(() => {
      toast.success(`Opened ${openedCount} labels for preview`);
    }, 1000);
  };


  if (!shouldShowNotification) {
    return null;
  }

  const displayTotal = totalProcessed || results.total || 0;
  const displaySuccessful = shipmentsWithLabels.length || results.successful || 0;
  const displayFailed = failedShipments.length || results.failed || 0;

  return (
    <div className="space-y-6">
      <Card className="p-6 border-green-200 bg-green-50">
        <div className="flex items-center space-x-3 mb-4">
          <CheckCircle className="h-6 w-6 text-green-600" />
          <div>
            <h3 className="text-lg font-semibold text-green-800">
              {hasLabels ? 'Labels Processing Complete!' : 'Shipments Processed Successfully!'}
            </h3>
            <p className="text-green-700">
              {hasLabels
                ? `${displaySuccessful} out of ${displayTotal} shipping labels have been created and are ready for download.`
                : `${displayTotal} shipments have been processed and are ready for label creation.`
              }
              {displayFailed > 0 && ` ${displayFailed} shipments failed.`}
            </p>
          </div>
        </div>

        {displayFailed > 0 && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-yellow-800 text-sm">
              <strong>Note:</strong> {displayFailed} shipments failed to process. Please check the error details below.
            </p>
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-600">{displayTotal}</div>
            <div className="text-sm text-gray-600">Total Processed</div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-600">{displaySuccessful}</div>
            <div className="text-sm text-gray-600">Labels Created</div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-red-200">
            <div className="text-2xl font-bold text-red-600">{displayFailed}</div>
            <div className="text-sm text-gray-600">Failed</div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-600">${results.totalCost?.toFixed(2) || '0.00'}</div>
            <div className="text-sm text-gray-600">Total Shipping Cost</div>
          </div>
        </div>

        {/* Download/Preview Buttons Section */}
        {hasLabels && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-lg text-blue-800 mb-4">Labels Options</h4>

            <div className="flex flex-col gap-3">
              {/* This is the button that has been replaced */}
              <button
                onClick={handlePreviewAllLabels} // Using the new preview handler
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                data-lov-id="src/components/shipping/BulkUpload.tsx:331:16"
                data-lov-name="Button"
                data-component-path="src/components/shipping/BulkUpload.tsx"
                data-component-line="331"
                data-component-file="BulkUpload.tsx"
                data-component-name="Button"
                data-component-content="%7B%22text%22%3A%22Preview%20All%20Labels%22%7D"
              >
                <Printer
                  className="mr-2 h-4 w-4"
                  data-lov-id="src/components/shipping/BulkUpload.tsx:332:18"
                  data-lov-name="PrinterIcon"
                  data-component-path="src/components/shipping/BulkUpload.tsx"
                  data-component-line="332"
                  data-component-file="BulkUpload.tsx"
                  data-component-name="PrinterIcon"
                  data-component-content="%7B%22className%22%3A%22mr-2%20h-4%20w-4%22%7D"
                />
                Preview All Labels
              </button>
            </div>
          </div>
        )}

        {/* Create Labels Button */}
        {!hasLabels && displayTotal > 0 && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-semibold text-lg text-yellow-800 mb-3">Create Shipping Labels</h4>
            <p className="text-yellow-700 mb-3">
              Your shipments have been processed. Click below to create and download shipping labels.
            </p>
            <Button
              onClick={onCreateLabels}
              disabled={isCreatingLabels}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
            >
              {isCreatingLabels ? 'Creating Labels...' : 'Create All Labels Now'}
            </Button>
          </div>
        )}
      </Card>

      {/* New Clean Table Display */}
      {allShipments.length > 0 && (
        <LabelResultsTable
          shipments={allShipments}
          onDownloadLabel={(url, format) => {
            if (url && url.trim() !== '') {
              const timestamp = Date.now();
              const filename = `shipping_label_${timestamp}.${format || 'png'}`;
              downloadFile(url, filename);
            } else {
              toast.error('Invalid label URL - cannot download');
            }
          }}
        />
      )}

      {/* Failed Shipments Details */}
      {results.failedShipments && results.failedShipments.length > 0 && (
        <Card className="p-6">
          <h4 className="font-medium text-red-800 mb-3">Failed Shipments Details</h4>
          <div className="bg-red-50 border border-red-200 rounded-md p-4 max-h-60 overflow-y-auto">
            {results.failedShipments.map((failed, index) => (
              <div key={index} className="mb-2 last:mb-0 p-2 bg-white rounded border-l-4 border-red-400">
                <span className="font-medium text-red-700">
                  Shipment {failed.row ? `#${failed.row}` : index + 1}:
                </span>
                <span className="text-red-600 ml-2 block text-sm">{failed.details || failed.error}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};


// Main App component to render SuccessNotification with sample data
const App = () => {
  const [scenario, setScenario] = useState('labelsCreated'); // 'labelsCreated' or 'toCreateLabels'
  const [isCreatingLabelsState, setIsCreatingLabelsState] = useState(false);

  const sampleResultsWithLabels = {
    total: 5,
    successful: 4,
    failed: 1,
    totalCost: 25.50,
    processedShipments: [
      { id: 'shp_1', tracking_number: 'TRK12345', status: 'completed', label_url: 'https://placehold.co/200x100/ADD8E6/000000?text=Label1' },
      { id: 'shp_2', tracking_number: 'TRK67890', status: 'completed', label_url: 'https://placehold.co/200x100/FFB6C1/000000?text=Label2' },
      { id: 'shp_3', tracking_number: 'TRK11223', status: 'completed', label_url: 'https://placehold.co/200x100/90EE90/000000?text=Label3' },
      { id: 'shp_4', tracking_number: 'TRK44556', status: 'completed', label_url: 'https://placehold.co/200x100/DDA0DD/000000?text=Label4' },
      { id: 'shp_5', tracking_number: 'TRK77889', status: 'failed', error: 'Invalid address', details: 'Address line 1 missing.' },
    ],
    failedShipments: [
      { row: 5, details: 'Invalid address: Street number is required.', id: 'shp_5', error: 'Address validation failed' },
    ],
  };

  const sampleResultsToCreateLabels = {
    total: 3,
    successful: 3, // Successfully processed, but labels not yet created
    failed: 0,
    totalCost: 15.75,
    processedShipments: [
      { id: 'shp_A', status: 'processed', tracking_number: null },
      { id: 'shp_B', status: 'processed', tracking_number: null },
      { id: 'shp_C', status: 'processed', tracking_number: null },
    ],
    failedShipments: [],
  };

  const currentResults = scenario === 'labelsCreated' ? sampleResultsWithLabels : sampleResultsToCreateLabels;

  // This handler is no longer directly invoked by the "Preview All Labels" button
  // but could be used elsewhere or removed if not needed.
  const handleDownloadAllLabels = () => {
    console.log('Downloading all labels (mock)');
    toast.success('Initiating download for all labels!');
  };

  const handleDownloadSingleLabel = (labelUrl, format) => {
    console.log(`Downloading single label: ${labelUrl} (${format}) (mock)`);
    toast.success(`Download started for single label!`);
  };

  const handleCreateLabels = () => {
    console.log('Creating labels (mock)');
    setIsCreatingLabelsState(true);
    toast.loading('Creating labels...');
    setTimeout(() => {
      toast.dismiss();
      toast.success('Labels created successfully!');
      setScenario('labelsCreated'); // Simulate labels being created
      setIsCreatingLabelsState(false);
    }, 2000); // Simulate API call
  };

  return (
    <div className="font-sans antialiased bg-gray-100 min-h-screen p-8">
      <style>
        {`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        body {
          font-family: 'Inter', sans-serif;
        }
        /* Tailwind CSS classes for the mocks and general layout */
        .rounded-lg { border-radius: 0.5rem; }
        .shadow-sm { box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
        .space-y-6 > :not([hidden]) ~ :not([hidden]) { margin-top: 1.5rem; }
        .flex { display: flex; }
        .items-center { align-items: center; }
        .space-x-3 > :not([hidden]) ~ :not([hidden]) { margin-left: 0.75rem; }
        .mb-4 { margin-bottom: 1rem; }
        .text-lg { font-size: 1.125rem; line-height: 1.75rem; }
        .font-semibold { font-weight: 600; }
        .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
        .font-medium { font-weight: 500; }
        .gap-4 { gap: 1rem; }
        .grid { display: grid; }
        .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
        .md\\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
        .p-4 { padding: 1rem; }
        .p-6 { padding: 1.5rem; }
        .mb-6 { margin-bottom: 1.5rem; }
        .flex-col { flex-direction: column; }
        .gap-3 { gap: 0.75rem; }
        .mr-2 { margin-right: 0.5rem; }
        .h-4 { height: 1rem; }
        .w-4 { width: 1rem; }
        .h-6 { height: 1.5rem; }
        .w-6 { width: 1.5rem; }
        .px-4 { padding-left: 1rem; padding-right: 1rem; }
        .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
        .px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
        .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
        .text-2xl { font-size: 1.5rem; line-height: 2rem; }
        .font-bold { font-weight: 700; }
        .overflow-x-auto { overflow-x: auto; }
        .min-w-full { min-width: 100%; }
        .divide-y > :not([hidden]) ~ :not([hidden]) { border-top-width: 1px; }
        .whitespace-nowrap { white-space: nowrap; }
        .px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
        .py-4 { padding-top: 1rem; padding-bottom: 1rem; }
        .text-left { text-align: left; }
        .text-xs { font-size: 0.75rem; line-height: 1rem; }
        .uppercase { text-transform: uppercase; }
        .tracking-wider { letter-spacing: 0.05em; }
        .inline-flex { display: inline-flex; }
        .leading-5 { line-height: 1.25rem; }
        .rounded-full { border-radius: 9999px; }
        .p-1 { padding: 0.25rem; }
        .max-h-60 { max-height: 15rem; }
        .overflow-y-auto { overflow-y: auto; }
        .mb-2 { margin-bottom: 0.5rem; }
        .last\\:mb-0:last-child { margin-bottom: 0; }
        .border-l-4 { border-left-width: 4px; }
        .block { display: block; }
        .ml-2 { margin-left: 0.5rem; }
        .text-center { text-align: center; }
        .mx-auto { margin-left: auto; margin-right: auto; }
        .max-w-4xl { max-width: 56rem; } /* Equivalent to 896px */


        /* Colors - copied from the component's inline styles and common Tailwind usage */
        .bg-gray-100 { background-color: #f3f4f6; }
        .text-gray-800 { color: #1f2937; }
        .bg-indigo-600 { background-color: #4f46e5; }
        .text-white { color: #fff; }
        .bg-gray-200 { background-color: #e5e7eb; }
        .hover\\:bg-gray-300:hover { background-color: #d1d5db; }
        .bg-green-50 { background-color: #f0fdf4; }
        .border-green-200 { border-color: #bbf7d0; }
        .text-green-600 { color: #16a34a; }
        .text-green-800 { color: #14532d; }
        .text-green-700 { color: #15803d; }
        .bg-yellow-50 { background-color: #fffbeb; }
        .border-yellow-200 { border-color: #fde68a; }
        .text-yellow-800 { color: #92400e; }
        .text-yellow-700 { color: #a16207; }
        .bg-white { background-color: #fff; }
        .border-red-200 { border-color: #fecaca; }
        .text-red-600 { color: #dc2626; }
        .text-red-800 { color: #991b1b; }
        .bg-blue-50 { background-color: #eff6ff; }
        .border-blue-200 { border-color: #bfdbfe; }
        .text-blue-800 { color: #1e40af; }
        .bg-blue-600 { background-color: #2563eb; }
        .hover\\:bg-blue-700:hover { background-color: #1d4ed8; }
        .bg-red-50 { background-color: #fef2f2; }
        .border-red-400 { border-color: #f87171; }
        .text-red-700 { color: #b91c1c; }
        .bg-green-100 { background-color: #dcfce7; }
        .bg-red-100 { background-color: #fee2e2; }
        .text-indigo-600 { color: #4f46e5; }
        .hover\\:text-indigo-900:hover { color: #3730a3; }
        .bg-transparent { background-color: transparent; }
        .hover\\:bg-gray-100:hover { background-color: #f3f4f6; }
        /* Primary colors for the new button (assuming primary from shadcn/ui is a blue tone) */
        .bg-primary { background-color: #2563eb; /* Example: A strong blue */ }
        .text-primary-foreground { color: #ffffff; }
        .hover\\:bg-primary\\/90:hover { background-color: rgba(37, 99, 235, 0.9); } /* 90% opacity of primary */
        .ring-offset-background { --ring-offset-color: #fff; } /* Assuming background is white */
        .focus-visible\\:ring-ring:focus-visible { --ring-color: #2563eb; /* Same as primary */ }
        `}
      </style>

      <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
        Shipping Label Processing Dashboard (Simulated)
      </h1>

      <div className="max-w-4xl mx-auto">
        <div className="mb-4 flex gap-4">
          <Button
            onClick={() => setScenario('labelsCreated')}
            className={`px-4 py-2 rounded-md ${scenario === 'labelsCreated' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
          >
            Show Labels Created Scenario
          </Button>
          <Button
            onClick={() => {
              setScenario('toCreateLabels');
              setIsCreatingLabelsState(false); // Reset creating state for this scenario
            }}
            className={`px-4 py-2 rounded-md ${scenario === 'toCreateLabels' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
          >
            Show Labels To Be Created Scenario
          </Button>
        </div>

        <SuccessNotification
          results={currentResults}
          onDownloadAllLabels={handleDownloadAllLabels}
          onDownloadSingleLabel={handleDownloadSingleLabel}
          onCreateLabels={handleCreateLabels}
          isPaying={false} // Mock as false
          isCreatingLabels={isCreatingLabelsState}
        />
      </div>
    </div>
  );
};

export default App;

