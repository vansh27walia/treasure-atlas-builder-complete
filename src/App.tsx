
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
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
