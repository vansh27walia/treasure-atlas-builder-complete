
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { OnboardingProvider } from '@/contexts/OnboardingContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Header from '@/components/Header';
import SidebarNavigation from '@/components/SidebarNavigation';
import Dashboard from '@/pages/Dashboard';
import AuthPage from '@/pages/AuthPage';
import CreateLabelPage from '@/pages/CreateLabelPage';
import TrackingPage from '@/pages/TrackingPage';
import SettingsPage from '@/pages/SettingsPage';
import BulkUploadPage from '@/pages/BulkUploadPage';
import PaymentPage from '@/pages/PaymentPage';
import LabelSuccessPage from '@/pages/LabelSuccessPage';
import UnifiedShippingPage from '@/pages/UnifiedShippingPage';
import ShipToPage from '@/pages/ShipToPage';
import PickupPage from '@/pages/PickupPage';
import InternationalShippingPage from '@/pages/InternationalShippingPage';
import InstantDeliveryPage from '@/pages/InstantDeliveryPage';
import LtlShippingPage from '@/pages/LtlShippingPage';
import FtlShippingPage from '@/pages/FtlShippingPage';
import FreightForwardingPage from '@/pages/FreightForwardingPage';
import NotFound from '@/pages/NotFound';
import './App.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <OnboardingProvider>
          <Router>
            <div className="min-h-screen bg-gray-50">
              <Header />
              <div className="flex">
                <SidebarNavigation />
                <main className="flex-1">
                  <Routes>
                    <Route path="/auth" element={<AuthPage />} />
                    <Route
                      path="/"
                      element={
                        <ProtectedRoute>
                          <Dashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/create-label"
                      element={
                        <ProtectedRoute>
                          <CreateLabelPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/tracking"
                      element={
                        <ProtectedRoute>
                          <TrackingPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/settings"
                      element={
                        <ProtectedRoute>
                          <SettingsPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/bulk-upload"
                      element={
                        <ProtectedRoute>
                          <BulkUploadPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/payment"
                      element={
                        <ProtectedRoute>
                          <PaymentPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/label-success"
                      element={
                        <ProtectedRoute>
                          <LabelSuccessPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/unified-shipping"
                      element={
                        <ProtectedRoute>
                          <UnifiedShippingPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/ship-to"
                      element={
                        <ProtectedRoute>
                          <ShipToPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/pickup"
                      element={
                        <ProtectedRoute>
                          <PickupPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/international"
                      element={
                        <ProtectedRoute>
                          <InternationalShippingPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/instant-delivery"
                      element={
                        <ProtectedRoute>
                          <InstantDeliveryPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/ltl-shipping"
                      element={
                        <ProtectedRoute>
                          <LtlShippingPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/ftl-shipping"
                      element={
                        <ProtectedRoute>
                          <FtlShippingPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/freight-forwarding"
                      element={
                        <ProtectedRoute>
                          <FreightForwardingPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
              </div>
              <Toaster />
            </div>
          </Router>
        </OnboardingProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
