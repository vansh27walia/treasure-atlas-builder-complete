import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Index from './pages/Index';
import CreateLabelPage from './pages/CreateLabelPage';
import RateCalculatorPage from './pages/RateCalculatorPage';
import LtlShippingPage from './pages/LtlShippingPage';
import FtlShippingPage from './pages/FtlShippingPage';
import InstantDeliveryPage from './pages/InstantDeliveryPage';
import AuthPage from './pages/AuthPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import SidebarNavigation from './components/SidebarNavigation';
import './App.css';
import NotFound from './pages/NotFound';
import Dashboard from './pages/Dashboard';
import SettingsPage from './pages/SettingsPage';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { OnboardingProvider, useOnboarding } from './contexts/OnboardingContext';
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
import OnboardingModal from './components/onboarding/OnboardingModal';
// AI Logistics Intelligence Pages
import AICommandCenterPage from './pages/ai/AICommandCenterPage';
import ShipmentIntelligencePage from './pages/ai/ShipmentIntelligencePage';
import DelayPredictionPage from './pages/ai/DelayPredictionPage';
import CarrierPerformancePage from './pages/ai/CarrierPerformancePage';
import CustomerSupportAIPage from './pages/ai/CustomerSupportAIPage';
import RouteOptimizationPage from './pages/ai/RouteOptimizationPage';
import AIAlertsPage from './pages/ai/AIAlertsPage';
import AISettingsPage from './pages/ai/AISettingsPage';
import BrandedTrackingPage from './pages/BrandedTrackingPage';
import PublicTrackingPage from './pages/PublicTrackingPage';

function AppContent() {
  const { hasCompletedOnboarding, completeOnboarding } = useOnboarding();

  return (
    <>
      <div className="w-full h-screen overflow-hidden">
        <SidebarNavigation>
          <div className="w-full h-full overflow-y-auto">
            <Routes>
              <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
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
              <Route path="/track" element={<PublicTrackingPage />} />
              <Route path="/track/:trackingNumber" element={<PublicTrackingPage />} />
              <Route path="/branded-tracking" element={<ProtectedRoute><BrandedTrackingPage /></ProtectedRoute>} />
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
              {/* AI Logistics Intelligence Routes */}
              <Route path="/ai/command-center" element={<ProtectedRoute><AICommandCenterPage /></ProtectedRoute>} />
              <Route path="/ai/shipment-intelligence" element={<ProtectedRoute><ShipmentIntelligencePage /></ProtectedRoute>} />
              <Route path="/ai/delay-prediction" element={<ProtectedRoute><DelayPredictionPage /></ProtectedRoute>} />
              <Route path="/ai/carrier-performance" element={<ProtectedRoute><CarrierPerformancePage /></ProtectedRoute>} />
              <Route path="/ai/customer-support" element={<ProtectedRoute><CustomerSupportAIPage /></ProtectedRoute>} />
              <Route path="/ai/route-optimization" element={<ProtectedRoute><RouteOptimizationPage /></ProtectedRoute>} />
              <Route path="/ai/alerts" element={<ProtectedRoute><AIAlertsPage /></ProtectedRoute>} />
              <Route path="/ai/settings" element={<ProtectedRoute><AISettingsPage /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </SidebarNavigation>
      </div>
      <Toaster />
      
      {/* Show onboarding modal for first-time users */}
      {hasCompletedOnboarding === false && (
        <OnboardingModal 
          isOpen={true} 
          onComplete={completeOnboarding}
        />
      )}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <OnboardingProvider>
          <AppContent />
        </OnboardingProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
