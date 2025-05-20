
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
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

// Create a client
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/create-label" element={<ProtectedRoute><CreateLabelPage /></ProtectedRoute>} />
          <Route path="/label-success" element={<ProtectedRoute><LabelSuccessPage /></ProtectedRoute>} />
          <Route path="/international-shipping" element={<ProtectedRoute><InternationalShippingPage /></ProtectedRoute>} />
          <Route path="/bulk-upload" element={<ProtectedRoute><BulkUploadPage /></ProtectedRoute>} />
          <Route path="/pickup" element={<ProtectedRoute><PickupPage /></ProtectedRoute>} />
          <Route path="/tracking" element={<ProtectedRoute><TrackingPage /></ProtectedRoute>} />
          <Route path="/ship-to" element={<ProtectedRoute><ShipToPage /></ProtectedRoute>} />
          <Route path="/instant-delivery" element={<ProtectedRoute><InstantDeliveryPage /></ProtectedRoute>} />
          <Route path="/ftl-shipping" element={<ProtectedRoute><FtlShippingPage /></ProtectedRoute>} />
          <Route path="/ltl-shipping" element={<ProtectedRoute><LtlShippingPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="/address-settings" element={<ProtectedRoute><AddressSettingsPage /></ProtectedRoute>} />
          <Route path="/payment" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" />} />
        </Routes>
      </Router>
      <Toaster richColors closeButton position="top-right" />
    </QueryClientProvider>
  );
}

export default App;
