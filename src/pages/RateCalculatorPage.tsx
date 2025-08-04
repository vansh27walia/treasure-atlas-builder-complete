
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, TrendingDown, Clock, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import RateCalculator from '@/components/shipping/RateCalculator';
import UniversalAIChatbot from '@/components/shipping/UniversalAIChatbot';

const RateCalculatorPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Calculator className="h-8 w-8 text-green-600" />
                Shipping Rate Calculator
              </h1>
              <p className="text-gray-600 mt-2">
                Compare shipping rates across multiple carriers instantly
              </p>
            </div>
            <Badge className="bg-green-100 text-green-800 border-green-200">
              <TrendingDown className="h-3 w-3 mr-1" />
              Best Rates
            </Badge>
          </div>
        </div>
      </div>

      {/* Benefits Bar */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-8 text-sm">
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Real-time rate comparison
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Instant quotes in seconds
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              No hidden fees
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-green-50 rounded-t-lg">
              <CardTitle className="text-xl font-semibold text-gray-900">
                Calculate Shipping Rates
              </CardTitle>
              <CardDescription className="text-gray-600">
                Get instant quotes from USPS, UPS, FedEx, and more
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <RateCalculator />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Universal AI Chatbot */}
      <UniversalAIChatbot />
    </div>
  );
};

export default RateCalculatorPage;
