
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Clock, DollarSign, MapPin, Package, Loader2, CheckCircle } from 'lucide-react';
import { FreightRate } from '@/types/freight';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface FreightBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  rate: FreightRate | null;
  originData: any;
  destinationData: any;
  loadDetails: any;
}

const FreightBookingModal: React.FC<FreightBookingModalProps> = ({
  isOpen,
  onClose,
  rate,
  originData,
  destinationData,
  loadDetails
}) => {
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingReference, setBookingReference] = useState('');

  const handleConfirmBooking = async () => {
    if (!rate) return;

    setIsBooking(true);
    try {
      console.log('Processing freight booking:', {
        rate,
        origin: originData,
        destination: destinationData,
        loadDetails
      });

      // Call the freight booking API
      const { data, error } = await supabase.functions.invoke('freight-forwarding-booking', {
        body: {
          rate,
          origin: originData,
          destination: destinationData,
          loadDetails
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      console.log('Booking response:', data);
      
      setBookingReference(data.bookingReference || `FF-${Date.now()}`);
      setBookingSuccess(true);
      toast.success('Freight booking confirmed successfully!');

    } catch (error) {
      console.error('Booking failed:', error);
      toast.error('Booking failed. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  const handleClose = () => {
    setBookingSuccess(false);
    setBookingReference('');
    onClose();
  };

  if (!rate) return null;

  // Calculate derived values from the new rate structure
  const averagePrice = Math.round((rate.minPrice + rate.maxPrice) / 2);
  const transitTimeRange = `${rate.minTransitTime}-${rate.maxTransitTime} days`;
  const priceRange = `$${rate.minPrice.toLocaleString()} - $${rate.maxPrice.toLocaleString()}`;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            {bookingSuccess ? (
              <>
                <CheckCircle className="w-6 h-6 mr-2 text-green-600" />
                Booking Confirmed
              </>
            ) : (
              <>
                <Package className="w-6 h-6 mr-2 text-blue-600" />
                Confirm Freight Booking
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        {bookingSuccess ? (
          <Card>
            <CardContent className="p-6 text-center">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Booking Confirmed!</h3>
              <p className="text-gray-600 mb-4">Your freight has been successfully booked.</p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Booking Reference:</p>
                <p className="font-mono text-lg font-semibold">{bookingReference}</p>
              </div>
              <p className="text-sm text-gray-500 mt-4">
                You will receive a confirmation email with detailed booking information.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Carrier Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{rate.mode} Freight</span>
                  <Badge variant="secondary">
                    {rate.mode.toLowerCase()}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Transit Time</p>
                      <p className="font-medium">{transitTimeRange}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <DollarSign className="w-4 h-4 mr-2 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Price Range</p>
                      <p className="font-medium text-lg">{priceRange}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="w-4 h-4 mr-2" />
                    <div>
                      <p className="text-sm text-gray-500">Service Level</p>
                      <p className="font-medium capitalize">Standard</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Route Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Route Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-green-700 mb-2">Origin</h4>
                    <p className="text-sm">
                      {originData.portName || originData.locationType} - {originData.country}
                    </p>
                    <p className="text-sm text-gray-600">{originData.address}</p>
                  </div>
                  
                  <div className="flex justify-center">
                    <div className="w-24 h-px bg-gray-300 relative">
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-2">
                        →
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-red-700 mb-2">Destination</h4>
                    <p className="text-sm">
                      {destinationData.portName || destinationData.locationType} - {destinationData.country}
                    </p>
                    <p className="text-sm text-gray-600">{destinationData.address}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Load Details */}
            <Card>
              <CardHeader>
                <CardTitle>Cargo Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p><span className="font-medium">Type:</span> {loadDetails.type === 'loose-cargo' ? 'Loose Cargo' : 'Container'}</p>
                  <p><span className="font-medium">Number of Items:</span> {loadDetails.loads?.length || 0}</p>
                </div>
              </CardContent>
            </Card>

            <Separator />

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirmBooking}
                disabled={isBooking}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isBooking ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Confirm Booking - ${priceRange}`
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FreightBookingModal;
