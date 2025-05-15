
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import CreateLabelPage from './pages/CreateLabelPage';
import TrackingPage from './pages/TrackingPage';
import BulkUploadPage from './pages/BulkUploadPage';
import LabelSuccessPage from './pages/LabelSuccessPage';
import SettingsPage from './pages/SettingsPage';
import InternationalShippingPage from './pages/InternationalShippingPage';
import PaymentPage from './pages/PaymentPage';
import NotFound from './pages/NotFound';
import Index from './pages/Index';
import LtlShippingPage from './pages/LtlShippingPage';
import FtlShippingPage from './pages/FtlShippingPage';
import InstantDeliveryPage from './pages/InstantDeliveryPage';
import Shipping2Page from './pages/Shipping2Page';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/create-label" element={
          <ProtectedRoute>
            <CreateLabelPage />
          </ProtectedRoute>
        } />
        <Route path="/tracking" element={
          <ProtectedRoute>
            <TrackingPage />
          </ProtectedRoute>
        } />
        <Route path="/bulk-upload" element={
          <ProtectedRoute>
            <BulkUploadPage />
          </ProtectedRoute>
        } />
        <Route path="/label-success" element={
          <ProtectedRoute>
            <LabelSuccessPage />
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        } />
        <Route path="/international" element={
          <ProtectedRoute>
            <InternationalShippingPage />
          </ProtectedRoute>
        } />
        <Route path="/shipping-2" element={
          <ProtectedRoute>
            <Shipping2Page />
          </ProtectedRoute>
        } />
        <Route path="/payment" element={
          <ProtectedRoute>
            <PaymentPage />
          </ProtectedRoute>
        } />
        <Route path="/ltl-shipping" element={
          <ProtectedRoute>
            <LtlShippingPage />
          </ProtectedRoute>
        } />
        <Route path="/ftl-shipping" element={
          <ProtectedRoute>
            <FtlShippingPage />
          </ProtectedRoute>
        } />
        <Route path="/instant-delivery" element={
          <ProtectedRoute>
            <InstantDeliveryPage />
          </ProtectedRoute>
        } />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
