import { SavingsGoals } from "@/components/dashboard/SavingsGoals";
import { SpendingSummary } from "@/components/dashboard/SpendingSummary";
import { ChatInterface } from "@/components/dashboard/ChatInterface";
import { AIInsights } from "@/components/dashboard/AIInsights";
import { SMSSyncStatus } from "@/components/SMSSyncStatus";

export const DashboardOverview = () => {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <SpendingSummary />
        <SavingsGoals />
        <AIInsights />
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <SMSSyncStatus />
        <ChatInterface />
      </div>
    </>
  );
};
