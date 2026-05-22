import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TransactionProvider } from "@/contexts/TransactionContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { BudgetProvider } from "@/contexts/BudgetContext";
import { DashboardOverview } from "@/DashboardOverview";
import Index from "@/pages/Index";
import Dashboard from "@/pages/Dashboard";
import NotFound from "@/pages/NotFound";
import TransactionsPage from "@/pages/Transactions";
import InvestPage from "@/pages/Invest";
import MentorsPage from "@/pages/Mentors";
import ChatbotPage from "@/pages/Chatbot";
import CardsPage from "@/pages/cards";
import SecurityPage from "@/pages/Security";
import AIAnalysisPage from "@/pages/AIAnalysis";
import SettingsPage from "@/pages/Settings";
import SupportPage from "@/pages/Support";
import BudgetsPage from "@/pages/Budgets";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <BudgetProvider>
          <TransactionProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/dashboard" element={<Dashboard />}>
                  <Route index element={<DashboardOverview />} />
                  <Route path="transactions" element={<TransactionsPage />} />
                  <Route path="budgets" element={<BudgetsPage />} />
                  <Route path="invest" element={<InvestPage />} />
                  <Route path="mentors" element={<MentorsPage />} />
                  <Route path="chatbot" element={<ChatbotPage />} />
                  <Route path="cards" element={<CardsPage />} />
                  <Route path="security" element={<SecurityPage />} />
                  <Route path="ai-analysis" element={<AIAnalysisPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="support" element={<SupportPage />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TransactionProvider>
        </BudgetProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
