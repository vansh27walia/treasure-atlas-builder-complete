import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient } from 'react-query';
import { QueryClientProvider } from 'react-query';
import { AuthProvider } from './contexts/AuthContext';
import { OnboardingProvider } from './contexts/OnboardingContext';
import Index from './pages/Index';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import UnifiedShippingPage from './pages/UnifiedShippingPage';
import CreateLabelPage from './pages/CreateLabelPage';
import LabelSuccessPage from './pages/LabelSuccessPage';
import TrackingPage from './pages/TrackingPage';
import SettingsPage from './pages/SettingsPage';
import PaymentPage from './pages/PaymentPage';
import ShipToPage from './pages/ShipToPage';
import PickupPage from './pages/PickupPage';
import LtlShippingPage from './pages/LtlShippingPage';
import FtlShippingPage from './pages/FtlShippingPage';
import FreightForwardingPage from './pages/FreightForwardingPage';
import InternationalShippingPage from './pages/InternationalShippingPage';
import InstantDeliveryPage from './pages/InstantDeliveryPage';
import NotFound from './pages/NotFound';
import Header from './components/Header';
import BulkUploadPage from './pages/BulkUploadPage';

function App() {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <AuthProvider>
        <OnboardingProvider>
          <BrowserRouter>
            <div className="min-h-screen bg-background">
              <Header />
              <main className="container mx-auto px-4 py-8">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/unified-shipping" element={
                    <ProtectedRoute>
                      <UnifiedShippingPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/bulk-upload" element={
                    <ProtectedRoute>
                      <BulkUploadPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/create-label" element={
                    <ProtectedRoute>
                      <CreateLabelPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/label-success" element={
                    <ProtectedRoute>
                      <LabelSuccessPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/tracking" element={
                    <ProtectedRoute>
                      <TrackingPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/settings" element={
                    <ProtectedRoute>
                      <SettingsPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/payment" element={
                    <ProtectedRoute>
                      <PaymentPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/ship-to" element={
                    <ProtectedRoute>
                      <ShipToPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/pickup" element={
                    <ProtectedRoute>
                      <PickupPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/ltl-shipping" element={
                    <ProtectedRoute>
                      <LtlShippingPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/ftl-shipping" element={
                    <ProtectedRoute>
                      <FtlShippingPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/freight-forwarding" element={
                    <ProtectedRoute>
                      <FreightForwardingPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/international-shipping" element={
                    <ProtectedRoute>
                      <InternationalShippingPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/instant-delivery" element={
                    <ProtectedRoute>
                      <InstantDeliveryPage />
                    </ProtectedRoute>
                  } />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </div>
          </BrowserRouter>
        </OnboardingProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = React.useContext(AuthContext);

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return <>{children}</>;
};
