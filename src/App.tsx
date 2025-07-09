
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import SettingsPage from './pages/SettingsPage';
import BulkUploadPage from './pages/BulkUploadPage';
import TrackingPage from './pages/TrackingPage';
import NotFound from './pages/NotFound';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import EnhancedBulkUploadPage from './pages/EnhancedBulkUploadPage';

const queryClient = new QueryClient();

function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Toaster />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            } />
            <Route path="/bulk-upload-old" element={
              <ProtectedRoute>
                <BulkUploadPage />
              </ProtectedRoute>
            } />
            <Route path="/tracking" element={
              <ProtectedRoute>
                <TrackingPage />
              </ProtectedRoute>
            } />
            
            <Route path="/bulk-upload" element={
              <ProtectedRoute>
                <EnhancedBulkUploadPage />
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;
