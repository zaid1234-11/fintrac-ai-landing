import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { SpendingSummary } from "@/components/dashboard/SpendingSummary";
import { SavingsGoals } from "@/components/dashboard/SavingsGoals";
import { ChatInterface } from "@/components/dashboard/ChatInterface";

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-slate-900 font-['Inter',sans-serif]">
      <Sidebar />
      <div className="ml-64">
        <Header />
        <main className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <SpendingSummary />
            <SavingsGoals />
          </div>
          <ChatInterface />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
