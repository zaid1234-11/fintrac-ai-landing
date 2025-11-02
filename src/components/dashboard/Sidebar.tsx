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
  Wallet,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SidebarProps {
  isMobile: boolean;
  isOpen?: boolean;
  setIsOpen?: (isOpen: boolean) => void;
}

const mainNavItems = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard", end: true },
  { name: "Transactions", icon: ArrowRightLeft, path: "/dashboard/transactions" },
  { name: "Budgets", icon: Wallet, path: "/dashboard/budgets" },
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
    <div className="p-6 border-b border-white/10">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <span className="text-white font-bold text-lg">F</span>
        </div>
        <div>
          <h2 className="text-white font-bold text-lg">FinTrack AI</h2>
          <p className="text-slate-400 text-xs">Smart Finance Manager</p>
        </div>
      </div>
    </div>

    <ScrollArea className="flex-1 py-4">
      <nav className="space-y-1 px-3">
        {mainNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                isActive
                  ? "bg-primary/20 text-primary border-l-4 border-primary"
                  : "text-slate-300 hover:bg-white/5 hover:text-white border-l-4 border-transparent"
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="my-4 px-3">
        <div className="h-px bg-white/10"></div>
      </div>

      <nav className="space-y-1 px-3">
        {secondaryNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                isActive
                  ? "bg-primary/20 text-primary border-l-4 border-primary"
                  : "text-slate-300 hover:bg-white/5 hover:text-white border-l-4 border-transparent"
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.name}</span>
          </NavLink>
        ))}
      </nav>
    </ScrollArea>

    <div className="p-4 border-t border-white/10">
      <button className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-white/5 hover:text-white transition-all duration-200 w-full">
        <LogOut className="w-5 h-5" />
        <span className="font-medium">Logout</span>
      </button>
    </div>
  </>
);

const Sidebar = ({ isMobile, isOpen, setIsOpen }: SidebarProps) => {
  if (isMobile) {
    return (
      <>
        {isOpen && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsOpen?.(false)}
          />
        )}
        <aside
          className={`fixed top-0 left-0 h-full w-64 bg-slate-900/95 backdrop-blur-xl border-r border-white/10 z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="absolute top-4 right-4">
            <button
              onClick={() => setIsOpen?.(false)}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
          <SidebarContent onNavigate={() => setIsOpen?.(false)} />
        </aside>
      </>
    );
  }

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-slate-900/95 backdrop-blur-xl border-r border-white/10 h-screen sticky top-0">
      <SidebarContent />
    </aside>
  );
};

export default Sidebar;
