import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RestaurantProvider } from "./context/RestaurantContext";
import Index from "./pages/Index";
import CustomerMenu from "./pages/CustomerMenu";
import StaffDashboard from "./pages/StaffDashboard";
import ClientTables from "./pages/ClientTables";
import MenuEditor from "./pages/MenuEditor";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <RestaurantProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<ClientTables />} />
            <Route path="/menu" element={<CustomerMenu />} />
            <Route path="/t/:tableNumber" element={<CustomerMenu />} />
            <Route path="/admin" element={<StaffDashboard />} />
            <Route path="/admin/menu" element={<MenuEditor />} />
            <Route path="/index" element={<Index />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </RestaurantProvider>
  </QueryClientProvider>
);

export default App;
