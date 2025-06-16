
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import CreateLabelPage from "./pages/CreateLabelPage";
import TrackingPage from "./pages/TrackingPage";
import ShipToPage from "./pages/ShipToPage";
import PaymentPage from "./pages/PaymentPage";
import BulkUpload from "./components/shipping/BulkUpload";
import BulkRateFetchingPage from "./pages/BulkRateFetchingPage";
import Settings from "./pages/Settings";
import RateCalculator from "./pages/RateCalculator";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/create-label" element={<CreateLabelPage />} />
            <Route path="/tracking" element={<TrackingPage />} />
            <Route path="/ship-to" element={<ShipToPage />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/bulk-upload" element={<BulkUpload />} />
            <Route path="/bulk-rates" element={<BulkRateFetchingPage />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/rate-calculator" element={<RateCalculator />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
