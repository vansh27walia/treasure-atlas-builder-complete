import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import BillingPage from './pages/BillingPage';
import OnboardingPage from './pages/OnboardingPage';
import { OnboardingProvider } from './contexts/OnboardingContext';
import TrackingPage from './pages/TrackingPage';
import AddressBookPage from './pages/AddressBookPage';
import APIKeysPage from './pages/APIKeysPage';
import NotFound from './pages/NotFound';
import { QueryClient } from 'react-query';
import EnhancedBulkUploadPage from './pages/EnhancedBulkUploadPage';

function App() {
  return (
    <BrowserRouter>
      <QueryClient>
        <AuthProvider>
          <OnboardingProvider>
            <Toaster />
            <Routes>
              <Route path="/" element={<OnboardingPage />} />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } />
              <Route path="/billing" element={
                <ProtectedRoute>
                  <BillingPage />
                </ProtectedRoute>
              } />
              <Route path="/tracking" element={
                <ProtectedRoute>
                  <TrackingPage />
                </ProtectedRoute>
              } />
              <Route path="/address-book" element={
                <ProtectedRoute>
                  <AddressBookPage />
                </ProtectedRoute>
              } />
              <Route path="/api-keys" element={
                <ProtectedRoute>
                  <APIKeysPage />
                </ProtectedRoute>
              } />
              
              <Route path="/bulk-upload" element={
                <ProtectedRoute>
                  <EnhancedBulkUploadPage />
                </ProtectedRoute>
              } />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </OnboardingProvider>
        </AuthProvider>
      </QueryClient>
    </BrowserRouter>
  );
}

export default App;
