
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import './App.css';
import SettingsPage from './pages/SettingsPage';
import BulkUploadPage from './pages/BulkUploadPage'; 
import Index from './pages/Index';
import { AuthProvider } from '@/contexts/AuthContext';
import NotFound from './pages/NotFound';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/bulk-upload" element={<BulkUploadPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </Router>
    </AuthProvider>
  );
}

export default App;
