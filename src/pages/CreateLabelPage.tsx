
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Truck, Clock, Shield } from 'lucide-react';
import EnhancedShippingForm from '@/components/shipping/EnhancedShippingForm';
import UniversalAIChatbot from '@/components/shipping/UniversalAIChatbot';

const CreateLabelPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Package className="h-8 w-8 text-blue-600" />
                Create Shipping Label
              </h1>
              <p className="text-gray-600 mt-2">
                Compare rates and create labels across all major carriers
              </p>
            </div>
            <Badge className="bg-blue-100 text-blue-800 border-blue-200">
              <Shield className="h-3 w-3 mr-1" />
              Secure & Fast
            </Badge>
          </div>
        </div>
      </div>

      {/* Benefits Bar */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-8 text-sm">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Save up to 89% on shipping
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Labels ready in 30 seconds
            </div>
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              All major carriers supported
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-t-lg">
              <CardTitle className="text-xl font-semibold text-gray-900">
                Shipping Information
              </CardTitle>
              <CardDescription className="text-gray-600">
                Enter your shipping details to compare rates and create labels
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <EnhancedShippingForm />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Universal AI Chatbot */}
      <UniversalAIChatbot />
    </div>
  );
};

export default CreateLabelPage;
