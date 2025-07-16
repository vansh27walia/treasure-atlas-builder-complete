
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import SidebarNavigation from "@/components/SidebarNavigation";
import Index from "./pages/Index";
import CreateLabelPage from "./pages/CreateLabelPage";
import TrackingPage from "./pages/TrackingPage";
import PaymentPage from "./pages/PaymentPage";
import BulkUploadPage from "./pages/BulkUploadPage";
import InternationalShippingPage from "./pages/InternationalShippingPage";
import SettingsPage from "./pages/SettingsPage";
import FreightForwardingPage from "./pages/FreightForwardingPage";
import ShipToPage from "./pages/ShipToPage";
import PickupPage from "./pages/PickupPage";
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
                <Route path="/international" element={<InternationalShippingPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/freight-forwarding" element={<FreightForwardingPage />} />
                <Route path="/ship-to" element={<ShipToPage />} />
                <Route path="/pickup" element={<PickupPage />} />
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
