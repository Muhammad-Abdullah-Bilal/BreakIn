import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { useRealtime } from "./hooks/useRealtime";
import Dashboard from "./pages/Dashboard";
import Candidates from "./pages/Candidates";
import Jobs from "./pages/Jobs";
import Pipeline from "./pages/Pipeline";
import Matches from "./pages/Matches";
import Offers from "./pages/Offers";
import Reports from "./pages/Reports";
import Billing from "./pages/Billing";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
    },
  },
});

const AppContent = () => {
  // Initialize realtime functionality
  useRealtime();
  
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/candidates" element={<Candidates />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/pipeline" element={<Pipeline />} />
        <Route path="/matches" element={<Matches />} />
        <Route path="/offers" element={<Offers />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
};

const App = () => {
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
