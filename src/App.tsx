
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import AuthProvider from '@/contexts/AuthContext';
import OnboardingProvider from '@/contexts/OnboardingContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import SidebarNavigation from '@/components/SidebarNavigation';
import Index from '@/pages/Index';
import AuthPage from '@/pages/AuthPage';
import Dashboard from '@/pages/Dashboard';
import UnifiedShippingPage from '@/pages/UnifiedShippingPage';
import BulkUploadPage from '@/pages/BulkUploadPage';
import SettingsPage from '@/pages/SettingsPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import AnalyticsPage from '@/pages/AnalyticsPage';
import TrackingPage from '@/pages/TrackingPage';
import PickupPage from '@/pages/PickupPage';
import PaymentPage from '@/pages/PaymentPage';
import FreightForwardingPage from '@/pages/FreightForwardingPage';
import InternationalShippingPage from '@/pages/InternationalShippingPage';
import ShipToPage from '@/pages/ShipToPage';
import LtlShippingPage from '@/pages/LtlShippingPage';
import FtlShippingPage from '@/pages/FtlShippingPage';
import InstantDeliveryPage from '@/pages/InstantDeliveryPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <Router>
      <AuthProvider>
        <OnboardingProvider>
          <QueryClientProvider client={queryClient}>
            <div className="App">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <SidebarNavigation>
                      <Dashboard />
                    </SidebarNavigation>
                  </ProtectedRoute>
                } />
                
                <Route path="/shipping" element={
                  <ProtectedRoute>
                    <SidebarNavigation>
                      <UnifiedShippingPage />
                    </SidebarNavigation>
                  </ProtectedRoute>
                } />
                
                <Route path="/bulk-upload" element={
                  <ProtectedRoute>
                    <SidebarNavigation>
                      <BulkUploadPage />
                    </SidebarNavigation>
                  </ProtectedRoute>
                } />
                
                <Route path="/analytics" element={
                  <ProtectedRoute>
                    <SidebarNavigation>
                      <AnalyticsPage />
                    </SidebarNavigation>
                  </ProtectedRoute>
                } />
                
                <Route path="/tracking" element={
                  <ProtectedRoute>
                    <SidebarNavigation>
                      <TrackingPage />
                    </SidebarNavigation>
                  </ProtectedRoute>
                } />
                
                <Route path="/pickup" element={
                  <ProtectedRoute>
                    <SidebarNavigation>
                      <PickupPage />
                    </SidebarNavigation>
                  </ProtectedRoute>
                } />
                
                <Route path="/payment" element={
                  <ProtectedRoute>
                    <SidebarNavigation>
                      <PaymentPage />
                    </SidebarNavigation>
                  </ProtectedRoute>
                } />
                
                <Route path="/freight-forwarding" element={
                  <ProtectedRoute>
                    <SidebarNavigation>
                      <FreightForwardingPage />
                    </SidebarNavigation>
                  </ProtectedRoute>
                } />
                
                <Route path="/international" element={
                  <ProtectedRoute>
                    <SidebarNavigation>
                      <InternationalShippingPage />
                    </SidebarNavigation>
                  </ProtectedRoute>
                } />
                
                <Route path="/ship-to" element={
                  <ProtectedRoute>
                    <SidebarNavigation>
                      <ShipToPage />
                    </SidebarNavigation>
                  </ProtectedRoute>
                } />
                
                <Route path="/ltl-shipping" element={
                  <ProtectedRoute>
                    <SidebarNavigation>
                      <LtlShippingPage />
                    </SidebarNavigation>
                  </ProtectedRoute>
                } />
                
                <Route path="/ftl-shipping" element={
                  <ProtectedRoute>
                    <SidebarNavigation>
                      <FtlShippingPage />
                    </SidebarNavigation>
                  </ProtectedRoute>
                } />
                
                <Route path="/instant-delivery" element={
                  <ProtectedRoute>
                    <SidebarNavigation>
                      <InstantDeliveryPage />
                    </SidebarNavigation>
                  </ProtectedRoute>
                } />
                
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <SidebarNavigation>
                      <SettingsPage />
                    </SidebarNavigation>
                  </ProtectedRoute>
                } />
              </Routes>
              <Toaster />
            </div>
          </QueryClientProvider>
        </OnboardingProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
