
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Index from './pages/Index';
import CreateLabelPage from './pages/CreateLabelPage';
import RateCalculatorPage from './pages/RateCalculatorPage';
import LtlShippingPage from './pages/LtlShippingPage';
import FtlShippingPage from './pages/FtlShippingPage';
import InstantDeliveryPage from './pages/InstantDeliveryPage';
import AuthPage from './pages/AuthPage';
import SidebarNavigation from './components/SidebarNavigation';
import './App.css';
import NotFound from './pages/NotFound';
import Dashboard from './pages/Dashboard';
import SettingsPage from './pages/SettingsPage';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { OnboardingProvider } from './contexts/OnboardingContext';
import { Toaster } from './components/ui/sonner';
import PaymentPage from './pages/PaymentPage';
import InternationalShippingPage from './pages/InternationalShippingPage';
import LabelSuccessPage from './pages/LabelSuccessPage';
import PickupPage from './pages/PickupPage';
import BulkUploadPage from './pages/BulkUploadPage';
import TrackingPage from './pages/TrackingPage';
import ShipToPage from './pages/ShipToPage';
import FreightForwardingPage from './pages/FreightForwardingPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import ImportPage from './pages/ImportPage';
import ShopifyCallbackPage from './pages/ShopifyCallbackPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <OnboardingProvider>
          <div className="w-full h-screen overflow-hidden">
            <SidebarNavigation>
              <div className="w-full h-full overflow-y-auto">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/create-label" element={<CreateLabelPage />} />
                  <Route path="/rate-calculator" element={<RateCalculatorPage />} />
                  <Route path="/freight-forwarding" element={<FreightForwardingPage />} />
                  <Route path="/ltl-shipping" element={<LtlShippingPage />} />
                  <Route path="/ftl-shipping" element={<FtlShippingPage />} />
                  <Route path="/instant-delivery" element={<InstantDeliveryPage />} />
                  <Route path="/international" element={<InternationalShippingPage />} />
                  <Route path="/ship-to" element={<ShipToPage />} />
                  <Route path="/payment" element={<PaymentPage />} />
                  <Route path="/tracking" element={<TrackingPage />} />
                  <Route path="/import" element={<ImportPage />} />
                  <Route path="/shopify-callback" element={<ShopifyCallbackPage />} />
                  <Route
                    path="/dashboard"
                    element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
                  />
                  <Route
                    path="/settings"
                    element={<ProtectedRoute><SettingsPage /></ProtectedRoute>}
                  />
                  <Route path="/label-success" element={<LabelSuccessPage />} />
                  <Route path="/payment-success" element={<PaymentSuccessPage />} />
                  <Route path="/pickup" element={<PickupPage />} />
                  <Route
                    path="/bulk-upload"
                    element={<ProtectedRoute><BulkUploadPage /></ProtectedRoute>}
                  />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
            </SidebarNavigation>
          </div>
          <Toaster />
        </OnboardingProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
