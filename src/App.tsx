
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Index from './pages/Index';
import CreateLabelPage from './pages/CreateLabelPage';
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

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <OnboardingProvider>
          <SidebarNavigation>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/create-label" element={<CreateLabelPage />} />
              <Route path="/ltl-shipping" element={<LtlShippingPage />} />
              <Route path="/ftl-shipping" element={<FtlShippingPage />} />
              <Route path="/instant-delivery" element={<InstantDeliveryPage />} />
              <Route path="/international" element={<InternationalShippingPage />} />
              <Route path="/payment" element={<PaymentPage />} />
              <Route
                path="/dashboard"
                element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
              />
              <Route
                path="/settings"
                element={<ProtectedRoute><SettingsPage /></ProtectedRoute>}
              />
              <Route path="/success" element={<LabelSuccessPage />} />
              <Route path="/pickup" element={<PickupPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </SidebarNavigation>
          <Toaster />
        </OnboardingProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
