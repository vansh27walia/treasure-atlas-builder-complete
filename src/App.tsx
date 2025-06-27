
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import Header from '@/components/Header';
import SidebarNavigation from '@/components/SidebarNavigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { AuthProvider } from '@/contexts/AuthContext';
import { OnboardingProvider } from '@/contexts/OnboardingContext';

// Import pages
import Index from '@/pages/Index';
import Dashboard from '@/pages/Dashboard';
import CreateLabelPage from '@/pages/CreateLabelPage';
import TrackingPage from '@/pages/TrackingPage';
import SettingsPage from '@/pages/SettingsPage';
import AuthPage from '@/pages/AuthPage';
import NotFound from '@/pages/NotFound';
import UnifiedShippingPage from '@/pages/UnifiedShippingPage';
import InternationalShippingPage from '@/pages/InternationalShippingPage';
import FreightForwardingPage from '@/pages/FreightForwardingPage';
import LtlShippingPage from '@/pages/LtlShippingPage';
import FtlShippingPage from '@/pages/FtlShippingPage';
import InstantDeliveryPage from '@/pages/InstantDeliveryPage';
import PickupPage from '@/pages/PickupPage';
import PaymentPage from '@/pages/PaymentPage';
import ShipToPage from '@/pages/ShipToPage';
import LabelSuccessPage from '@/pages/LabelSuccessPage';
import BulkUploadPage from '@/pages/BulkUploadPage';
import BulkLabelCreationPage from '@/pages/BulkLabelCreationPage';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <OnboardingProvider>
          <Router>
            <SidebarNavigation>
              <div className="flex flex-col h-full">
                <Header />
                <main className="flex-1 overflow-auto">
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/auth" element={<AuthPage />} />
                    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/create-label" element={<ProtectedRoute><CreateLabelPage /></ProtectedRoute>} />
                    <Route path="/tracking" element={<ProtectedRoute><TrackingPage /></ProtectedRoute>} />
                    <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                    <Route path="/unified-shipping" element={<ProtectedRoute><UnifiedShippingPage /></ProtectedRoute>} />
                    <Route path="/international-shipping" element={<ProtectedRoute><InternationalShippingPage /></ProtectedRoute>} />
                    <Route path="/freight-forwarding" element={<ProtectedRoute><FreightForwardingPage /></ProtectedRoute>} />
                    <Route path="/ltl-shipping" element={<ProtectedRoute><LtlShippingPage /></ProtectedRoute>} />
                    <Route path="/ftl-shipping" element={<ProtectedRoute><FtlShippingPage /></ProtectedRoute>} />
                    <Route path="/instant-delivery" element={<ProtectedRoute><InstantDeliveryPage /></ProtectedRoute>} />
                    <Route path="/pickup" element={<ProtectedRoute><PickupPage /></ProtectedRoute>} />
                    <Route path="/payment" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
                    <Route path="/ship-to" element={<ProtectedRoute><ShipToPage /></ProtectedRoute>} />
                    <Route path="/label-success" element={<ProtectedRoute><LabelSuccessPage /></ProtectedRoute>} />
                    <Route path="/bulk-upload" element={<ProtectedRoute><BulkUploadPage /></ProtectedRoute>} />
                    <Route path="/bulk-label-creation" element={<ProtectedRoute><BulkLabelCreationPage /></ProtectedRoute>} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
              </div>
            </SidebarNavigation>
            <Toaster />
          </Router>
        </OnboardingProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
