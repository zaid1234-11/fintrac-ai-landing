import {
  LayoutDashboard,
  ArrowRightLeft,
  TrendingUp,
  Users,
  Bot,
  X,
  Settings,
  LifeBuoy,
  LogOut,
  CreditCard,
  ShieldCheck,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";

const navItems = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard", end: true },
  { name: "Transactions", icon: ArrowRightLeft, path: "/dashboard/transactions" },
];

interface SidebarProps {
  isMobile: boolean;
  isOpen?: boolean;
  setIsOpen?: (isOpen: boolean) => void;
}

const mainNavItems = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard", end: true },
  { name: "Transactions", icon: ArrowRightLeft, path: "/dashboard/transactions" },
  { name: "Invest", icon: TrendingUp, path: "/dashboard/invest" },
  { name: "Mentors", icon: Users, path: "/dashboard/mentors" },
  { name: "Chatbot", icon: Bot, path: "/dashboard/chatbot" },
  { name: "Cards", icon: CreditCard, path: "/dashboard/cards" },
  { name: "Security", icon: ShieldCheck, path: "/dashboard/security" },
];

const secondaryNavItems = [
  { name: "Settings", icon: Settings, path: "/dashboard/settings" },
  { name: "Support", icon: LifeBuoy, path: "/dashboard/support" },
];

const SidebarContent = ({ onNavigate }: { onNavigate?: () => void }) => (
  <>
    <div className="p-6 border-b border-slate-700 flex-shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">FinTrack AI</h1>
          </div>
      <button onClick={onNavigate} className="lg:hidden text-slate-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>
        
    <ScrollArea className="flex-1 px-4">
          <div className="py-4 space-y-6">
            <nav className="space-y-2">
              {mainNavItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  end={item.end}
                  onClick={onNavigate} // Close sidebar on navigation
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      isActive
                        ? "bg-primary/20 text-primary"
                        : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                    }`
                  }
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </NavLink>
              ))}
            </nav>
            <div className="space-y-2">
               <h3 className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Account</h3>
                {secondaryNavItems.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-700/50 hover:text-white transition-all"
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </NavLink>
                ))}
                 <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-700/50 hover:text-white transition-all">
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Logout</span>
                </a>
            </div>
          </div>
        </ScrollArea>
  </>
);

export const Sidebar = ({ isMobile, isOpen, setIsOpen }: SidebarProps) => {
  if (isMobile) {
    return (
      <>
        {/* Overlay for mobile */}
        <div
          className={`fixed inset-0 bg-black/60 z-40 lg:hidden transition-opacity ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
          onClick={() => setIsOpen?.(false)}
        />
        <aside className={`fixed top-0 h-screen w-64 border-r border-slate-700 bg-slate-800 flex flex-col z-50 transition-transform transform ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <SidebarContent onNavigate={() => setIsOpen?.(false)} />
        </aside>
      </>
    );
  }

  // Desktop sidebar
  return (
    <div className="h-full bg-slate-800 flex flex-col border-r border-slate-700">
      <aside className="flex flex-col h-full">
        <SidebarContent />
      </aside>
    </div>
  );
};