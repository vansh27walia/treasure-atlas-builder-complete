
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/auth/AuthProvider";
import SidebarNavigation from "@/components/SidebarNavigation";
import Index from "./pages/Index";
import CreateLabelPage from "./pages/CreateLabelPage";
import TrackingPage from "./pages/TrackingPage";
import PaymentPage from "./pages/PaymentPage";
import BulkUploadPage from "./pages/BulkUploadPage";
import InternationalPage from "./pages/InternationalPage";
import DashboardPage from "./pages/DashboardPage";
import HelpPage from "./pages/HelpPage";
import PricingPage from "./pages/PricingPage";
import SettingsPage from "./pages/SettingsPage";
import FreightForwardingPage from "./pages/FreightForwardingPage";
import ShipToPage from "./pages/ShipToPage";
import PickupPage from "./pages/PickupPage";
import LTLShippingPage from "./pages/LTLShippingPage";
import FTLShippingPage from "./pages/FTLShippingPage";
import InstantDeliveryPage from "./pages/InstantDeliveryPage";
import RateCalculatorPage from "./pages/RateCalculatorPage";
import ShopifyImportPage from "./pages/ShopifyImportPage";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <AuthProvider>
            <SidebarNavigation>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/create-label" element={<CreateLabelPage />} />
                <Route path="/tracking" element={<TrackingPage />} />
                <Route path="/payment" element={<PaymentPage />} />
                <Route path="/bulk-upload" element={<BulkUploadPage />} />
                <Route path="/international" element={<InternationalPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/help" element={<HelpPage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/freight-forwarding" element={<FreightForwardingPage />} />
                <Route path="/ship-to" element={<ShipToPage />} />
                <Route path="/pickup" element={<PickupPage />} />
                <Route path="/ltl-shipping" element={<LTLShippingPage />} />
                <Route path="/ftl-shipping" element={<FTLShippingPage />} />
                <Route path="/instant-delivery" element={<InstantDeliveryPage />} />
                <Route path="/rate-calculator" element={<RateCalculatorPage />} />
                <Route path="/import/shopify" element={<ShopifyImportPage />} />
              </Routes>
            </SidebarNavigation>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
