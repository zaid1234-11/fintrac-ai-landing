import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { DashboardOverview } from "@/DashboardOverview";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "@/pages/Index";
import Dashboard from "@/pages/Dashboard";
import NotFound from "@/pages/NotFound";
import TransactionsPage from "@/pages/Transactions";
import InvestPage from "@/pages/Invest";
import MentorsPage from "@/pages/Mentors";
import ChatbotPage from "@/pages/Chatbot";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="dashboard" element={<Dashboard />}>
            <Route index element={<DashboardOverview />} />
            <Route path="transactions" element={<TransactionsPage />} />
            <Route path="invest" element={<InvestPage />} />
            <Route path="mentors" element={<MentorsPage />} />
            <Route path="chatbot" element={<ChatbotPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
