import { SavingsGoals } from "@/components/dashboard/SavingsGoals";
import { SpendingSummary } from "@/components/dashboard/SpendingSummary";
import { ChatInterface } from "@/components/dashboard/ChatInterface";

export const DashboardOverview = () => {
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <SpendingSummary />
        <SavingsGoals />
      </div>
      <ChatInterface />
    </>
  );
};