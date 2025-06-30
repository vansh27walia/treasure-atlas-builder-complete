import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import AuthProvider from '@/contexts/AuthContext';
import OnboardingProvider from '@/contexts/OnboardingContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Layout from '@/components/layout/Layout';
import HomePage from '@/pages/HomePage';
import AuthPage from '@/pages/AuthPage';
import DashboardPage from '@/pages/DashboardPage';
import ShippingPage from '@/pages/ShippingPage';
import BulkUploadPage from '@/pages/BulkUploadPage';
import SettingsPage from '@/pages/SettingsPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import AnalyticsPage from '@/pages/AnalyticsPage';

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
                <Route path="/" element={<HomePage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Layout>
                      <DashboardPage />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                <Route path="/shipping" element={
                  <ProtectedRoute>
                    <Layout>
                      <ShippingPage />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                <Route path="/bulk-upload" element={
                  <ProtectedRoute>
                    <Layout>
                      <BulkUploadPage />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                <Route path="/analytics" element={
                  <ProtectedRoute>
                    <Layout>
                      <AnalyticsPage />
                    </Layout>
                  </ProtectedRoute>
                } />
                
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <Layout>
                      <SettingsPage />
                    </Layout>
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
