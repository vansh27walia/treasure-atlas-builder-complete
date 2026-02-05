
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Package, 
  Upload, 
  Calculator, 
  Truck, 
  MapPin, 
  Settings, 
  ChartBar,
  Plane,
  Container,
  FileText,
  Brain,
  AlertTriangle,
  Clock,
  MessageSquare,
  Route,
  Bell,
  Cog,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import SidebarNavItem from './SidebarNavItem';
import SidebarNavSection from './SidebarNavSection';
import SidebarAuthButton from './SidebarAuthButton';
import SidebarUserProfile from './SidebarUserProfile';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface SidebarContentProps {
  collapsed: boolean;
}

const SidebarContent: React.FC<SidebarContentProps> = ({ collapsed }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [aiOpen, setAiOpen] = React.useState(false);
  
  // Check if current route is an AI route
  const isAIRoute = location.pathname.startsWith('/ai/');
  
  // Auto-expand AI section when on AI route
  React.useEffect(() => {
    if (isAIRoute) {
      setAiOpen(true);
    }
  }, [isAIRoute]);

  // AI Logistics Intelligence items (NEW - above freight)
  const aiItems = [
    {
      icon: <Brain className="h-5 w-5" />,
      title: 'AI Command Center',
      to: '/ai/command-center'
    },
    {
      icon: <Package className="h-5 w-5" />,
      title: 'Shipment Intelligence',
      to: '/ai/shipment-intelligence'
    },
    {
      icon: <Clock className="h-5 w-5" />,
      title: 'Delay Prediction',
      to: '/ai/delay-prediction'
    },
    {
      icon: <Truck className="h-5 w-5" />,
      title: 'Carrier Performance',
      to: '/ai/carrier-performance'
    },
    {
      icon: <MessageSquare className="h-5 w-5" />,
      title: 'Customer Support AI',
      to: '/ai/customer-support'
    },
    {
      icon: <Route className="h-5 w-5" />,
      title: 'Route Optimization',
      to: '/ai/route-optimization'
    },
    {
      icon: <Bell className="h-5 w-5" />,
      title: 'Alerts',
      to: '/ai/alerts'
    }
  ];

  // Main navigation items
  const mainNavItems = [
    { icon: <Home className="h-5 w-5" />, title: 'Home', to: '/' },
    { icon: <Package className="h-5 w-5" />, title: 'Shipping', to: '/create-label' },
    { icon: <Upload className="h-5 w-5" />, title: 'Batch Label Creation', to: '/bulk-upload' },
    { icon: <FileText className="h-5 w-5" />, title: 'Import', to: '/import' },
    { icon: <Calculator className="h-5 w-5" />, title: 'Rate Calculator', to: '/rate-calculator' },
    { icon: <Truck className="h-5 w-5" />, title: 'Tracking', to: '/tracking' },
    { icon: <MapPin className="h-5 w-5" />, title: 'Pickup Scheduling', to: '/pickup' }
  ];

  // Freight services
  const freightItems = [
    { icon: <Container className="h-5 w-5" />, title: 'LTL Shipping', to: '/ltl-shipping' },
    { icon: <Truck className="h-5 w-5" />, title: 'FTL Shipping', to: '/ftl-shipping' },
    { icon: <Plane className="h-5 w-5" />, title: 'Freight Forwarding', to: '/freight-forwarding' }
  ];

  // Tools
  const toolsItems = [
    { icon: <ChartBar className="h-5 w-5" />, title: 'Analytics', to: '/dashboard?tab=history' },
    { icon: <Cog className="h-5 w-5" />, title: 'AI Settings', to: '/ai/settings' },
    { icon: <Settings className="h-5 w-5" />, title: 'Settings', to: '/settings' }
  ];

  return (
    <div className="flex flex-col h-full">
      {/* User Profile */}
      <div className="p-4">
        <SidebarUserProfile collapsed={collapsed} />
      </div>
      
      <Separator className="bg-blue-800" />

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        <SidebarNavSection title="Main" collapsed={collapsed}>
          {mainNavItems.map((item, index) => (
            <SidebarNavItem
              key={index}
              icon={item.icon}
              title={item.title}
              to={item.to}
              collapsed={collapsed}
            />
          ))}
        </SidebarNavSection>

        <Separator className="bg-blue-800 my-4" />

        {/* Collapsible AI Intelligence Section */}
        <div className="mb-6">
          {collapsed ? (
            // When sidebar is collapsed, show single AI icon that opens menu
            <div 
              className={cn(
                "flex items-center justify-center p-2 mx-2 rounded-lg cursor-pointer transition-all",
                isAIRoute 
                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white" 
                  : "text-blue-200 hover:bg-blue-800/50"
              )}
              onClick={() => navigate('/ai/command-center')}
              title="AI Intelligence"
            >
              <Sparkles className="h-5 w-5" />
            </div>
          ) : (
            <Collapsible open={aiOpen} onOpenChange={setAiOpen}>
              <CollapsibleTrigger className="w-full">
                <div 
                  className={cn(
                    "flex items-center justify-between px-4 py-2 mx-2 rounded-lg transition-all cursor-pointer",
                    isAIRoute 
                      ? "bg-gradient-to-r from-purple-600/30 to-indigo-600/30 border border-purple-500/50" 
                      : "hover:bg-blue-800/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center",
                      isAIRoute 
                        ? "bg-gradient-to-r from-purple-500 to-indigo-500" 
                        : "bg-blue-800"
                    )}>
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <span className={cn(
                      "font-medium text-sm",
                      isAIRoute ? "text-white" : "text-blue-200"
                    )}>
                      AI Intelligence
                    </span>
                  </div>
                  <ChevronDown 
                    className={cn(
                      "h-4 w-4 transition-transform duration-200",
                      aiOpen ? "rotate-180" : "",
                      isAIRoute ? "text-purple-300" : "text-blue-400"
                    )} 
                  />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-1 space-y-1 pl-4">
                {aiItems.map((item, index) => (
                  <SidebarNavItem
                    key={index}
                    icon={item.icon}
                    title={item.title}
                    to={item.to}
                    collapsed={collapsed}
                  />
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>

        <Separator className="bg-blue-800 my-4" />

        <SidebarNavSection title="Freight Services" collapsed={collapsed}>
          {freightItems.map((item, index) => (
            <SidebarNavItem
              key={index}
              icon={item.icon}
              title={item.title}
              to={item.to}
              collapsed={collapsed}
            />
          ))}
        </SidebarNavSection>

        <Separator className="bg-blue-800 my-4" />

        <SidebarNavSection title="Tools" collapsed={collapsed}>
          {toolsItems.map((item, index) => (
            <SidebarNavItem
              key={index}
              icon={item.icon}
              title={item.title}
              to={item.to}
              collapsed={collapsed}
            />
          ))}
        </SidebarNavSection>
      </div>

      {/* Auth Button */}
      <div className="p-4">
        <SidebarAuthButton collapsed={collapsed} />
      </div>
    </div>
  );
};

export default SidebarContent;
