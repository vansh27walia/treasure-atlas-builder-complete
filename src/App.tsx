
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import PaymentPage from "./pages/PaymentPage";
import LabelSuccessPage from "./pages/LabelSuccessPage";
import CreateLabelPage from "./pages/CreateLabelPage";
import InternationalShippingPage from "./pages/InternationalShippingPage";
import PickupPage from "./pages/PickupPage";
import SettingsPage from "./pages/SettingsPage";
import SidebarNavigation from "./components/SidebarNavigation";
import AuthPage from "./pages/AuthPage";
import AuthProvider from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route
              path="/*"
              element={
                <SidebarNavigation>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/dashboard" element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/payment" element={
                      <ProtectedRoute>
                        <PaymentPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/label-success" element={
                      <ProtectedRoute>
                        <LabelSuccessPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/create-label" element={
                      <ProtectedRoute>
                        <CreateLabelPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/international" element={
                      <ProtectedRoute>
                        <InternationalShippingPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/pickup" element={
                      <ProtectedRoute>
                        <PickupPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/settings" element={
                      <ProtectedRoute>
                        <SettingsPage />
                      </ProtectedRoute>
                    } />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </SidebarNavigation>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
