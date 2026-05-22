"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { BudgetProvider } from "@/contexts/BudgetContext";
import { TransactionProvider } from "@/contexts/TransactionContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <BudgetProvider>
            <TransactionProvider>
              {children}
              <Toaster />
              <Sonner />
            </TransactionProvider>
          </BudgetProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
