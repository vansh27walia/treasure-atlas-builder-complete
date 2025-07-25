
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { 
  Ship, 
  Package, 
  TrendingUp, 
  Clock, 
  Shield, 
  CreditCard,
  Truck,
  BarChart3,
  Users,
  Globe,
  Zap,
  CheckCircle,
  ArrowRight,
  Sparkles
} from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Ship,
      title: "Smart Shipping",
      description: "AI-powered rate comparison across all major carriers",
      color: "bg-blue-500"
    },
    {
      icon: Package,
      title: "Bulk Processing",
      description: "Process hundreds of shipments simultaneously",
      color: "bg-green-500"
    },
    {
      icon: TrendingUp,
      title: "Analytics & Insights",
      description: "Track performance and optimize shipping costs",
      color: "bg-purple-500"
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Enterprise-grade security with 99.9% uptime",
      color: "bg-orange-500"
    }
  ];

  const stats = [
    { label: "Labels Created", value: "1M+", icon: Package },
    { label: "Cost Savings", value: "30%", icon: TrendingUp },
    { label: "Happy Customers", value: "10K+", icon: Users },
    { label: "Countries Served", value: "50+", icon: Globe }
  ];

  const quickActions = [
    {
      title: "Create Single Label",
      description: "Quick label creation for individual shipments",
      icon: Package,
      action: () => navigate('/create-label'),
      color: "bg-blue-600 hover:bg-blue-700"
    },
    {
      title: "Bulk Upload",
      description: "Process multiple shipments at once",
      icon: Truck,
      action: () => navigate('/bulk-upload'),
      color: "bg-green-600 hover:bg-green-700"
    },
    {
      title: "Shopify Integration",
      description: "Import and ship Shopify orders",
      icon: Users,
      action: () => navigate('/shopify-bulk-shipping'),
      color: "bg-purple-600 hover:bg-purple-700"
    },
    {
      title: "Rate Calculator",
      description: "Compare shipping rates instantly",
      icon: BarChart3,
      action: () => navigate('/rate-calculator'),
      color: "bg-orange-600 hover:bg-orange-700"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10" />
        <div className="relative container mx-auto px-4 py-16">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex items-center justify-center mb-6">
              <Badge className="bg-blue-100 text-blue-800 px-4 py-2 text-sm font-medium">
                <Sparkles className="w-4 h-4 mr-2" />
                AI-Powered Shipping Platform
              </Badge>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Ship Smarter with
              <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                PirateShip Pro
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              The most advanced shipping platform that combines AI intelligence with competitive rates 
              to save you time and money on every shipment.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => navigate('/create-label')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Start Shipping Now
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => navigate('/rate-calculator')}
                className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300"
              >
                Calculate Rates
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  <stat.icon className="w-8 h-8 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Get Started in Seconds</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Choose your shipping workflow and let our AI-powered platform handle the rest
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <Card 
                key={index} 
                className="hover:shadow-lg transition-all duration-300 cursor-pointer group border-2 hover:border-blue-200"
                onClick={action.action}
              >
                <CardHeader className="pb-4">
                  <div className={`w-12 h-12 rounded-lg ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-lg font-semibold">{action.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600">
                    {action.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose PirateShip Pro?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Advanced features designed to streamline your shipping operations
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className={`w-16 h-16 rounded-full ${feature.color} flex items-center justify-center mx-auto mb-4`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Transform Your Shipping?</h2>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of businesses that have already optimized their shipping with PirateShip Pro
          </p>
          <Button 
            onClick={() => navigate('/create-label')}
            className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Get Started Free
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
