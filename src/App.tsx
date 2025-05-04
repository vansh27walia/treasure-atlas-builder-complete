
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import CreateLabelPage from './pages/CreateLabelPage'
import InternationalPage from './pages/InternationalPage'
import PaymentPage from './pages/PaymentPage'
import TrackingPage from './pages/TrackingPage'
import PickupPage from './pages/PickupPage'
import BulkUploadPage from './pages/BulkUploadPage'
import SettingsPage from './pages/SettingsPage'
import HelpPage from './pages/HelpPage'
import PricingPage from './pages/PricingPage'
import DashboardPage from './pages/DashboardPage'
import ShippingAssistantPage from './pages/ShippingAssistantPage'
import NotFoundPage from './pages/NotFoundPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="create-label" element={<CreateLabelPage />} />
        <Route path="international" element={<InternationalPage />} />
        <Route path="payment" element={<PaymentPage />} />
        <Route path="tracking" element={<TrackingPage />} />
        <Route path="pickup" element={<PickupPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="bulk-upload" element={<BulkUploadPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="help" element={<HelpPage />} />
        <Route path="pricing" element={<PricingPage />} />
        <Route path="shipping-assistant" element={<ShippingAssistantPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default App
