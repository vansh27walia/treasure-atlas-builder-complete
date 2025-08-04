
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Truck, 
  Package, 
  Calculator, 
  FileText, 
  MapPin, 
  Clock,
  DollarSign,
  Shield,
  Globe,
  Users,
  TrendingUp,
  Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import RateCalculatorWidget from '@/components/shipping/RateCalculatorWidget';
import UniversalAIChatbot from '@/components/shipping/UniversalAIChatbot';

const Index = () => {
  const navigate = useNavigate();
  const [showCalculator, setShowCalculator] = useState(false);

  const features = [
    {
      icon: <Calculator className="h-6 w-6" />,
      title: "Rate Calculator",
      description: "Compare shipping rates across multiple carriers instantly",
      action: () => setShowCalculator(true),
      color: "bg-blue-500"
    },
    {
      icon: <Package className="h-6 w-6" />,
      title: "Create Labels",
      description: "Generate shipping labels for USPS, UPS, and FedEx",
      action: () => navigate('/create-label'),
      color: "bg-green-500"
    },
    {
      icon: <Truck className="h-6 w-6" />,
      title: "Track Packages",
      description: "Track your shipments in real-time",
      action: () => navigate('/tracking'),
      color: "bg-purple-500"
    },
    {
      icon: <FileText className="h-6 w-6" />,
      title: "Bulk Upload",
      description: "Process multiple shipments with CSV upload",
      action: () => navigate('/bulk-upload'),
      color: "bg-orange-500"
    },
    {
      icon: <Globe className="h-6 w-6" />,
      title: "International",
      description: "Ship globally with customs documentation",
      action: () => navigate('/international'),
      color: "bg-indigo-500"
    },
    {
      icon: <MapPin className="h-6 w-6" />,
      title: "Schedule Pickup",
      description: "Arrange carrier pickup at your location",
      action: () => navigate('/pickup'),
      color: "bg-red-500"
    }
  ];

  const stats = [
    { icon: <Package className="h-5 w-5" />, label: "Labels Created", value: "50,000+" },
    { icon: <Users className="h-5 w-5" />, label: "Happy Customers", value: "5,000+" },
    { icon: <DollarSign className="h-5 w-5" />, label: "Saved on Shipping", value: "$2M+" },
    { icon: <Clock className="h-5 w-5" />, label: "Average Processing", value: "< 30s" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">
            <Badge className="mb-4 bg-blue-500/20 text-blue-100 border-blue-400">
              <Zap className="h-3 w-3 mr-1" />
              Powered by AI
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Ship Smarter,
              <br />
              <span className="text-yellow-300">Save More</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-2xl mx-auto">
              Compare rates, create labels, and manage shipments across all major carriers in one powerful platform
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold px-8 py-3 text-lg"
                onClick={() => navigate('/create-label')}
              >
                Start Shipping Now
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-3 text-lg"
                onClick={() => setShowCalculator(true)}
              >
                <Calculator className="h-5 w-5 mr-2" />
                Try Rate Calculator
              </Button>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12">
          <div className="w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
        </div>
        <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12">
          <div className="w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"></div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="container mx-auto px-4 -mt-10 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <Card key={index} className="text-center bg-white/90 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex justify-center mb-2 text-blue-600">
                  {stat.icon}
                </div>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Features Grid */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Everything You Need to Ship
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            From single packages to bulk shipments, we've got all your shipping needs covered
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-xl transition-all duration-300 border-0 shadow-md cursor-pointer"
              onClick={feature.action}
            >
              <CardHeader>
                <div className={`w-12 h-12 ${feature.color} rounded-lg flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-200`}>
                  {feature.icon}
                </div>
                <CardTitle className="text-xl font-semibold group-hover:text-blue-600 transition-colors">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Our Platform?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Save Up to 89%</h3>
              <p className="text-gray-600">
                Access deeply discounted shipping rates from all major carriers
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Lightning Fast</h3>
              <p className="text-gray-600">
                Create shipping labels and compare rates in seconds, not minutes
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Secure & Reliable</h3>
              <p className="text-gray-600">
                Enterprise-grade security with 99.9% uptime guarantee
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Your Shipping?
          </h2>
          <p className="text-xl mb-8 text-blue-100 max-w-2xl mx-auto">
            Join thousands of businesses already saving time and money on shipping
          </p>
          <Button 
            size="lg" 
            className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold px-8 py-3 text-lg"
            onClick={() => navigate('/create-label')}
          >
            <TrendingUp className="h-5 w-5 mr-2" />
            Get Started Free
          </Button>
        </div>
      </div>

      {/* Rate Calculator Modal */}
      {showCalculator && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-semibold">Shipping Rate Calculator</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCalculator(false)}
                >
                  Close
                </Button>
              </div>
            </div>
            <div className="p-6">
              <RateCalculatorWidget />
            </div>
          </div>
        </div>
      )}

      {/* Universal AI Chatbot */}
      <UniversalAIChatbot />
    </div>
  );
};

export default Index;
