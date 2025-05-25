import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Download, FileText, Truck, MapPin, User, Calendar, Package, Plus } from 'lucide-react';
import { ShipmentType, ShippingFormData, ShippingRate } from '@/types/unified-shipping';

interface BookingConfirmationProps {
  booking: any;
  shipmentType: ShipmentType;
  formData: ShippingFormData | null;
  selectedRate: ShippingRate | null;
  onNewShipment: () => void;
  testMode: boolean;
}

const BookingConfirmation: React.FC<BookingConfirmationProps> = ({
  booking,
  shipmentType,
  formData,
  selectedRate,
  onNewShipment,
  testMode
}) => {
  const handleDownload = (url: string, filename: string) => {
    // In a real implementation, this would download the actual file
    console.log(`Downloading ${filename} from ${url}`);
    if (testMode) {
      alert(`TEST MODE: Would download ${filename}`);
    } else {
      // Actual file download logic
      window.open(url, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      {/* Success Header */}
      <Card className="border-2 border-green-300 bg-gradient-to-r from-green-50 to-emerald-50">
        <div className="p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-green-800 mb-2">
            {testMode ? 'Test Booking Created!' : 'Booking Confirmed!'}
          </h1>
          <p className="text-lg text-green-700 mb-4">
            Your {shipmentType} shipment has been successfully {testMode ? 'test ' : ''}booked
          </p>
          
          <div className="flex justify-center space-x-4">
            <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300 text-lg px-4 py-2">
              Booking ID: {booking.bookingId}
            </Badge>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-300 text-lg px-4 py-2">
              Tracking: {booking.trackingNumber}
            </Badge>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Details */}
        <Card className="border-2 border-gray-200">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center text-blue-700">
              <FileText className="mr-2 h-5 w-5" />
              Booking Details
            </h2>
            
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Carrier:</span>
                <span className="font-medium">{booking.carrier}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Service:</span>
                <span className="font-medium">{booking.service}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Total Cost:</span>
                <span className="font-bold text-green-600 text-lg">${booking.totalCost.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Estimated Delivery:</span>
                <span className="font-medium">{booking.estimatedDelivery}</span>
              </div>
              
              {testMode && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    <strong>Test Mode:</strong> This booking was created for testing purposes only. 
                    No actual shipping or billing has occurred.
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Shipment Summary */}
        <Card className="border-2 border-gray-200">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center text-blue-700">
              <Package className="mr-2 h-5 w-5" />
              Shipment Summary
            </h2>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center text-sm text-gray-600 mb-1">
                  <MapPin className="h-4 w-4 mr-1" />
                  From
                </div>
                <p className="font-medium">{formData?.pickupAddress}</p>
              </div>
              
              <div>
                <div className="flex items-center text-sm text-gray-600 mb-1">
                  <MapPin className="h-4 w-4 mr-1" />
                  To
                </div>
                <p className="font-medium">{formData?.deliveryAddress}</p>
              </div>
              
              <Separator />
              
              <div>
                <div className="flex items-center text-sm text-gray-600 mb-1">
                  <User className="h-4 w-4 mr-1" />
                  Contact
                </div>
                <p className="font-medium">{formData?.contactName}</p>
                <p className="text-sm text-gray-600">{formData?.contactPhone}</p>
              </div>
              
              <div>
                <div className="flex items-center text-sm text-gray-600 mb-1">
                  <Calendar className="h-4 w-4 mr-1" />
                  Pickup Date
                </div>
                <p className="font-medium">{formData?.pickupDate}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Documents */}
      <Card className="border-2 border-gray-200">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center text-blue-700">
            <Download className="mr-2 h-5 w-5" />
            Download Documents
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => handleDownload(booking.labelUrl, 'shipping-label.pdf')}
              className="h-16 flex items-center justify-center space-x-3 border-2 border-blue-300 hover:bg-blue-50"
            >
              <FileText className="h-6 w-6 text-blue-600" />
              <div className="text-left">
                <div className="font-medium">Shipping Label</div>
                <div className="text-sm text-gray-600">
                  {testMode ? 'Test Label PDF' : 'Ready for printing'}
                </div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => handleDownload(booking.bolUrl, 'bill-of-lading.pdf')}
              className="h-16 flex items-center justify-center space-x-3 border-2 border-green-300 hover:bg-green-50"
            >
              <FileText className="h-6 w-6 text-green-600" />
              <div className="text-left">
                <div className="font-medium">Bill of Lading</div>
                <div className="text-sm text-gray-600">
                  {testMode ? 'Test BOL PDF' : 'Carrier documentation'}
                </div>
              </div>
            </Button>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <Card className="border-2 border-gray-200">
        <div className="p-6 text-center">
          <h3 className="text-lg font-semibold mb-4">What's Next?</h3>
          <div className="space-y-3 text-sm text-gray-600 mb-6">
            <p>• Print and attach the shipping label to your package</p>
            <p>• Keep the Bill of Lading for your records</p>
            <p>• Track your shipment using the tracking number provided</p>
            <p>• Contact the carrier directly for pickup scheduling if needed</p>
          </div>
          
          <div className="flex justify-center space-x-4">
            <Button 
              variant="outline"
              onClick={() => window.print()}
              className="flex items-center space-x-2"
            >
              <FileText className="h-4 w-4" />
              <span>Print Page</span>
            </Button>
            
            <Button 
              onClick={onNewShipment}
              className="bg-blue-600 hover:bg-blue-700 flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Create New Shipment</span>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default BookingConfirmation;
