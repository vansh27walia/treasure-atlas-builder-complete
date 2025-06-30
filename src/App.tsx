
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
