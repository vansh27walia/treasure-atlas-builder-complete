
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Clock, Truck, Phone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/sonner';
import UniversalAIChatbot from '@/components/shipping/UniversalAIChatbot';

const PickupPage = () => {
  const [isScheduling, setIsScheduling] = useState(false);

  const handleSchedulePickup = async () => {
    setIsScheduling(true);
    // Simulate API call
    setTimeout(() => {
      setIsScheduling(false);
      toast.success('Pickup scheduled successfully!');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <MapPin className="h-8 w-8 text-orange-600" />
                Schedule Pickup
              </h1>
              <p className="text-gray-600 mt-2">
                Arrange carrier pickup at your location - save time and effort
              </p>
            </div>
            <Badge className="bg-orange-100 text-orange-800 border-orange-200">
              <Truck className="h-3 w-3 mr-1" />
              Free Service
            </Badge>
          </div>
        </div>
      </div>

      {/* Benefits Bar */}
      <div className="bg-gradient-to-r from-orange-600 to-red-700 text-white py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-8 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Door-to-door convenience
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Next business day pickup
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              SMS & email confirmations
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-orange-50 rounded-t-lg">
              <CardTitle className="text-xl font-semibold text-gray-900">
                Schedule Package Pickup
              </CardTitle>
              <CardDescription className="text-gray-600">
                Fill out the form below to schedule a pickup with your preferred carrier
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="carrier">Carrier</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select carrier" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ups">UPS</SelectItem>
                        <SelectItem value="fedex">FedEx</SelectItem>
                        <SelectItem value="usps">USPS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="pickup-date">Pickup Date</Label>
                    <Input type="date" id="pickup-date" />
                  </div>

                  <div>
                    <Label htmlFor="time-window">Time Window</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select time window" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="morning">Morning (9 AM - 12 PM)</SelectItem>
                        <SelectItem value="afternoon">Afternoon (12 PM - 5 PM)</SelectItem>
                        <SelectItem value="anytime">Anytime (9 AM - 5 PM)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="packages">Number of Packages</Label>
                    <Input type="number" id="packages" placeholder="1" min="1" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="contact-name">Contact Name</Label>
                    <Input id="contact-name" placeholder="Full name" />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" placeholder="(555) 123-4567" />
                  </div>

                  <div>
                    <Label htmlFor="location">Pickup Location</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="front-door">Front Door</SelectItem>
                        <SelectItem value="back-door">Back Door</SelectItem>
                        <SelectItem value="office">Office/Reception</SelectItem>
                        <SelectItem value="loading-dock">Loading Dock</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="weight">Total Weight (lbs)</Label>
                    <Input id="weight" type="number" placeholder="0.0" step="0.1" />
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <Label htmlFor="special-instructions">Special Instructions</Label>
                <Textarea 
                  id="special-instructions" 
                  placeholder="Any special pickup instructions for the driver..."
                  className="mt-1"
                />
              </div>

              <div className="flex justify-end mt-8">
                <Button 
                  onClick={handleSchedulePickup}
                  disabled={isScheduling}
                  size="lg"
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {isScheduling ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Scheduling...
                    </>
                  ) : (
                    <>
                      <MapPin className="h-4 w-4 mr-2" />
                      Schedule Pickup
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4 text-center">
                <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-semibold text-blue-900">Same Day Scheduling</h3>
                <p className="text-sm text-blue-700">Schedule pickups for the next business day</p>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4 text-center">
                <Truck className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <h3 className="font-semibold text-green-900">Multiple Carriers</h3>
                <p className="text-sm text-green-700">UPS, FedEx, and USPS pickup options</p>
              </CardContent>
            </Card>

            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-4 text-center">
                <Phone className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <h3 className="font-semibold text-purple-900">Live Updates</h3>
                <p className="text-sm text-purple-700">SMS and email pickup confirmations</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Universal AI Chatbot */}
      <UniversalAIChatbot />
    </div>
  );
};

export default PickupPage;
