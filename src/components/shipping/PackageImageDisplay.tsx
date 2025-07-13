
import React from 'react';

interface PackageImageDisplayProps {
  packageType: string;
  carrier: string;
}

const PackageImageDisplay: React.FC<PackageImageDisplayProps> = ({ packageType, carrier }) => {
  const getPackageImage = () => {
    // For now, using placeholder images. In production, these would be actual package images
    const baseUrl = 'https://images.unsplash.com/';
    
    if (packageType === 'custom_box') {
      return `${baseUrl}photo-1586864387967-d02ef85d93e8?w=300&h=200&fit=crop`; // Generic box
    }
    
    if (packageType === 'envelope') {
      return `${baseUrl}photo-1586864387967-d02ef85d93e8?w=300&h=150&fit=crop`; // Generic envelope
    }
    
    // Carrier-specific flat rate packages
    const carrierImages = {
      usps: {
        'FlatRateEnvelope': `${baseUrl}photo-1621905251189-08b45d6a269e?w=300&h=200&fit=crop`,
        'FlatRateLegalEnvelope': `${baseUrl}photo-1621905251189-08b45d6a269e?w=300&h=200&fit=crop`,
        'FlatRatePaddedEnvelope': `${baseUrl}photo-1621905251189-08b45d6a269e?w=300&h=200&fit=crop`,
        'SmallFlatRateBox': `${baseUrl}photo-1586864387967-d02ef85d93e8?w=300&h=200&fit=crop`,
        'MediumFlatRateBox': `${baseUrl}photo-1586864387967-d02ef85d93e8?w=300&h=200&fit=crop`,
        'LargeFlatRateBox': `${baseUrl}photo-1586864387967-d02ef85d93e8?w=300&h=200&fit=crop`,
        'RegionalRateBoxA': `${baseUrl}photo-1586864387967-d02ef85d93e8?w=300&h=200&fit=crop`,
        'RegionalRateBoxB': `${baseUrl}photo-1586864387967-d02ef85d93e8?w=300&h=200&fit=crop`,
      },
      ups: {
        'UPSLetter': `${baseUrl}photo-1621905251189-08b45d6a269e?w=300&h=200&fit=crop`,
        'UPSExpressBox': `${baseUrl}photo-1586864387967-d02ef85d93e8?w=300&h=200&fit=crop`,
        'UPS25kgBox': `${baseUrl}photo-1586864387967-d02ef85d93e8?w=300&h=200&fit=crop`,
        'UPS10kgBox': `${baseUrl}photo-1586864387967-d02ef85d93e8?w=300&h=200&fit=crop`,
        'Tube': `${baseUrl}photo-1586864387967-d02ef85d93e8?w=300&h=200&fit=crop`,
        'Pak': `${baseUrl}photo-1621905251189-08b45d6a269e?w=300&h=200&fit=crop`,
        'SmallExpressBox': `${baseUrl}photo-1586864387967-d02ef85d93e8?w=300&h=200&fit=crop`,
        'MediumExpressBox': `${baseUrl}photo-1586864387967-d02ef85d93e8?w=300&h=200&fit=crop`,
        'LargeExpressBox': `${baseUrl}photo-1586864387967-d02ef85d93e8?w=300&h=200&fit=crop`,
      },
      fedex: {
        'FedExEnvelope': `${baseUrl}photo-1621905251189-08b45d6a269e?w=300&h=200&fit=crop`,
        'FedExBox': `${baseUrl}photo-1586864387967-d02ef85d93e8?w=300&h=200&fit=crop`,
        'FedExSmallBox': `${baseUrl}photo-1586864387967-d02ef85d93e8?w=300&h=200&fit=crop`,
        'FedExMediumBox': `${baseUrl}photo-1586864387967-d02ef85d93e8?w=300&h=200&fit=crop`,
        'FedExLargeBox': `${baseUrl}photo-1586864387967-d02ef85d93e8?w=300&h=200&fit=crop`,
        'FedExPak': `${baseUrl}photo-1621905251189-08b45d6a269e?w=300&h=200&fit=crop`,
        'FedExTube': `${baseUrl}photo-1586864387967-d02ef85d93e8?w=300&h=200&fit=crop`,
      },
      dhl: {
        'DHLEnvelope': `${baseUrl}photo-1621905251189-08b45d6a269e?w=300&h=200&fit=crop`,
        'DHLFlyer': `${baseUrl}photo-1621905251189-08b45d6a269e?w=300&h=200&fit=crop`,
        'DHLExpressBox': `${baseUrl}photo-1586864387967-d02ef85d93e8?w=300&h=200&fit=crop`,
        'DHLJumboBox': `${baseUrl}photo-1586864387967-d02ef85d93e8?w=300&h=200&fit=crop`,
        'DHLSmallBox': `${baseUrl}photo-1586864387967-d02ef85d93e8?w=300&h=200&fit=crop`,
        'DHLLargeBox': `${baseUrl}photo-1586864387967-d02ef85d93e8?w=300&h=200&fit=crop`,
        'DHLPak': `${baseUrl}photo-1621905251189-08b45d6a269e?w=300&h=200&fit=crop`,
        'DHLTube': `${baseUrl}photo-1586864387967-d02ef85d93e8?w=300&h=200&fit=crop`,
      }
    };
    
    const carrierKey = carrier.toLowerCase() as keyof typeof carrierImages;
    return carrierImages[carrierKey]?.[packageType] || `${baseUrl}photo-1586864387967-d02ef85d93e8?w=300&h=200&fit=crop`;
  };

  const getPackageDisplayName = () => {
    if (packageType === 'custom_box') return 'Custom Box';
    if (packageType === 'envelope') return 'Envelope';
    
    // Format package names for display
    return packageType.replace(/([A-Z])/g, ' $1').trim();
  };

  return (
    <div className="flex flex-col items-center space-y-3 p-4 bg-gray-50 rounded-lg border">
      <div className="w-full max-w-sm">
        <img
          src={getPackageImage()}
          alt={getPackageDisplayName()}
          className="w-full h-48 object-cover rounded-lg shadow-md"
          onError={(e) => {
            // Fallback to a default image if the image fails to load
            e.currentTarget.src = 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=300&h=200&fit=crop';
          }}
        />
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-gray-800">{getPackageDisplayName()}</h3>
        <p className="text-sm text-gray-600 capitalize">{carrier}</p>
      </div>
    </div>
  );
};

export default PackageImageDisplay;
