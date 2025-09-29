import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import SuppliersPage from "./pages/SuppliersPage";
import SupplierFormPage from "./pages/SupplierFormPage";
import MarketplacesPage from "./pages/MarketplacesPage";
import MarketplaceFormPage from "./pages/MarketplaceFormPage";
import ControlPanel from "./pages/ControlPanel";
import SettingsPage from "./pages/SettingsPage";
import SandboxPage from "./pages/SandboxPage";
import KaspiPage from "./pages/KaspiPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/control-panel" element={<ControlPanel />} />
          <Route path="/suppliers" element={<SuppliersPage />} />
          <Route path="/suppliers/new" element={<SupplierFormPage />} />
          <Route path="/suppliers/:id/edit" element={<SupplierFormPage />} />
          <Route path="/marketplaces" element={<MarketplacesPage />} />
          <Route path="/marketplaces/new" element={<MarketplaceFormPage />} />
          <Route path="/marketplaces/:id/edit" element={<MarketplaceFormPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/sandbox" element={<SandboxPage />} />
          <Route path="/kaspi" element={<KaspiPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
