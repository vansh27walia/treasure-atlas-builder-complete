
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
import SidebarNavigation from "./components/SidebarNavigation";

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
      <BrowserRouter>
        <SidebarNavigation>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/label-success" element={<LabelSuccessPage />} />
            <Route path="/create-label" element={<CreateLabelPage />} />
            <Route path="/international" element={<InternationalShippingPage />} />
            <Route path="/pickup" element={<PickupPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </SidebarNavigation>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
