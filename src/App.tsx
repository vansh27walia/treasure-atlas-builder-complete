
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import SidebarNavigation from './components/SidebarNavigation';
import Index from './pages/Index';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import CreateLabelPage from './pages/CreateLabelPage';
import LabelSuccessPage from './pages/LabelSuccessPage';
import InternationalShippingPage from './pages/InternationalShippingPage';
import BulkUploadPage from './pages/BulkUploadPage';
import PickupPage from './pages/PickupPage';
import NotFound from './pages/NotFound';
import TrackingPage from './pages/TrackingPage';
import ShipToPage from './pages/ShipToPage';
import ProtectedRoute from './components/ProtectedRoute';
import { Toaster } from '@/components/ui/sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import InstantDeliveryPage from './pages/InstantDeliveryPage';
import FtlShippingPage from './pages/FtlShippingPage';
import LtlShippingPage from './pages/LtlShippingPage';
import SettingsPage from './pages/SettingsPage';
import AddressSettingsPage from './pages/AddressSettingsPage';
import PaymentPage from './pages/PaymentPage';

// Create a query client
const queryClient = new QueryClient();

function App() {
  // Helper to determine if the route should show the sidebar
  const shouldShowSidebar = (path: string) => {
    return path !== '/auth' && path !== '/404' && path !== '/';
  };

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<AuthPage />} />
          
          {/* Protected routes with sidebar */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <SidebarNavigation>
                <Dashboard />
              </SidebarNavigation>
            </ProtectedRoute>
          } />
          <Route path="/create-label" element={
            <ProtectedRoute>
              <SidebarNavigation>
                <CreateLabelPage />
              </SidebarNavigation>
            </ProtectedRoute>
          } />
          <Route path="/label-success" element={
            <ProtectedRoute>
              <SidebarNavigation>
                <LabelSuccessPage />
              </SidebarNavigation>
            </ProtectedRoute>
          } />
          <Route path="/international-shipping" element={
            <ProtectedRoute>
              <SidebarNavigation>
                <InternationalShippingPage />
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
          <Route path="/pickup" element={
            <ProtectedRoute>
              <SidebarNavigation>
                <PickupPage />
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
          <Route path="/ship-to" element={
            <ProtectedRoute>
              <SidebarNavigation>
                <ShipToPage />
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
          <Route path="/ftl-shipping" element={
            <ProtectedRoute>
              <SidebarNavigation>
                <FtlShippingPage />
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
          <Route path="/settings" element={
            <ProtectedRoute>
              <SidebarNavigation>
                <SettingsPage />
              </SidebarNavigation>
            </ProtectedRoute>
          } />
          <Route path="/address-settings" element={
            <ProtectedRoute>
              <SidebarNavigation>
                <AddressSettingsPage />
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
          
          {/* Error routes */}
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" />} />
        </Routes>
      </Router>
      <Toaster richColors closeButton position="top-right" />
    </QueryClientProvider>
  );
}

export default App;
