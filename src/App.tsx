
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { ThemeProvider } from "next-themes"
import { AuthProvider } from "./contexts/AuthContext"
import { OnboardingProvider } from "./contexts/OnboardingContext"
import SidebarNavigation from "./components/SidebarNavigation"
import ProtectedRoute from "./components/ProtectedRoute"
import Index from "./pages/Index"
import Dashboard from "./pages/Dashboard"
import AuthPage from "./pages/AuthPage"
import CreateLabelPage from "./pages/CreateLabelPage"
import LabelSuccessPage from "./pages/LabelSuccessPage"
import ShipToPage from "./pages/ShipToPage"
import TrackingPage from "./pages/TrackingPage"
import PickupPage from "./pages/PickupPage"
import SettingsPage from "./pages/SettingsPage"
import BulkUploadPage from "./pages/BulkUploadPage"
import LabelCreationPage from "./components/shipping/LabelCreationPage"
import UnifiedShippingPage from "./pages/UnifiedShippingPage"
import InternationalShippingPage from "./pages/InternationalShippingPage"
import InstantDeliveryPage from "./pages/InstantDeliveryPage"
import FtlShippingPage from "./pages/FtlShippingPage"
import LtlShippingPage from "./pages/LtlShippingPage"
import FreightForwardingPage from "./pages/FreightForwardingPage"
import PaymentPage from "./pages/PaymentPage"
import NotFound from "./pages/NotFound"

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <TooltipProvider>
          <AuthProvider>
            <OnboardingProvider>
              <Toaster />
              <BrowserRouter>
                <div className="min-h-screen bg-background">
                  <SidebarNavigation />
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/auth" element={<AuthPage />} />
                    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/create-label" element={<ProtectedRoute><CreateLabelPage /></ProtectedRoute>} />
                    <Route path="/label-creation" element={<ProtectedRoute><LabelCreationPage /></ProtectedRoute>} />
                    <Route path="/label-success" element={<ProtectedRoute><LabelSuccessPage /></ProtectedRoute>} />
                    <Route path="/ship-to" element={<ProtectedRoute><ShipToPage /></ProtectedRoute>} />
                    <Route path="/tracking" element={<ProtectedRoute><TrackingPage /></ProtectedRoute>} />
                    <Route path="/pickup" element={<ProtectedRoute><PickupPage /></ProtectedRoute>} />
                    <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                    <Route path="/bulk-upload" element={<ProtectedRoute><BulkUploadPage /></ProtectedRoute>} />
                    <Route path="/unified-shipping" element={<ProtectedRoute><UnifiedShippingPage /></ProtectedRoute>} />
                    <Route path="/international" element={<ProtectedRoute><InternationalShippingPage /></ProtectedRoute>} />
                    <Route path="/instant-delivery" element={<ProtectedRoute><InstantDeliveryPage /></ProtectedRoute>} />
                    <Route path="/ftl-shipping" element={<ProtectedRoute><FtlShippingPage /></ProtectedRoute>} />
                    <Route path="/ltl-shipping" element={<ProtectedRoute><LtlShippingPage /></ProtectedRoute>} />
                    <Route path="/freight-forwarding" element={<ProtectedRoute><FreightForwardingPage /></ProtectedRoute>} />
                    <Route path="/payment" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </div>
              </BrowserRouter>
            </OnboardingProvider>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
