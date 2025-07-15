
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { OnboardingProvider } from "./contexts/OnboardingContext";
import SidebarNavigation from "./components/SidebarNavigation";
import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Index";
import CreateLabelPage from "./pages/CreateLabelPage";
import RateCalculatorPage from "./pages/RateCalculatorPage";
import Dashboard from "./pages/Dashboard";
import AuthPage from "./pages/AuthPage";
import TrackingPage from "./pages/TrackingPage";
import SettingsPage from "./pages/SettingsPage";
import PaymentPage from "./pages/PaymentPage";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import LabelSuccessPage from "./pages/LabelSuccessPage";
import BulkUploadPage from "./pages/BulkUploadPage";
import InternationalShippingPage from "./pages/InternationalShippingPage";
import FreightForwardingPage from "./pages/FreightForwardingPage";
import LtlShippingPage from "./pages/LtlShippingPage";
import FtlShippingPage from "./pages/FtlShippingPage";
import InstantDeliveryPage from "./pages/InstantDeliveryPage";
import PickupPage from "./pages/PickupPage";
import UnifiedShippingPage from "./pages/UnifiedShippingPage";
import ShipToPage from "./pages/ShipToPage";
import NotFound from "./pages/NotFound";
import ResetPasswordPage from "./pages/ResetPasswordPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <OnboardingProvider>
        <TooltipProvider>
          <Toaster />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
              <Route path="/rate-calculator" element={<RateCalculatorPage />} />
              <Route path="/*" element={
                <ProtectedRoute>
                  <SidebarNavigation>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/create-label" element={<CreateLabelPage />} />
                      <Route path="/tracking" element={<TrackingPage />} />
                      <Route path="/settings" element={<SettingsPage />} />
                      <Route path="/payment" element={<PaymentPage />} />
                      <Route path="/payment-success" element={<PaymentSuccessPage />} />
                      <Route path="/label-success" element={<LabelSuccessPage />} />
                      <Route path="/bulk-upload" element={<BulkUploadPage />} />
                      <Route path="/international-shipping" element={<InternationalShippingPage />} />
                      <Route path="/freight-forwarding" element={<FreightForwardingPage />} />
                      <Route path="/ltl-shipping" element={<LtlShippingPage />} />
                      <Route path="/ftl-shipping" element={<FtlShippingPage />} />
                      <Route path="/instant-delivery" element={<InstantDeliveryPage />} />
                      <Route path="/pickup" element={<PickupPage />} />
                      <Route path="/unified-shipping" element={<UnifiedShippingPage />} />
                      <Route path="/ship-to" element={<ShipToPage />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </SidebarNavigation>
                </ProtectedRoute>
              } />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </OnboardingProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
