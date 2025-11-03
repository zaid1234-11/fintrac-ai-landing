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
  Home,
  Sparkles,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  isMobile: boolean;
  isOpen?: boolean;
  setIsOpen?: (isOpen: boolean) => void;
}

const mainNavItems = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard", end: true },
  { name: "Transactions", icon: ArrowRightLeft, path: "/dashboard/transactions" },
  { name: "Budgets", icon: TrendingUp, path: "/dashboard/budgets" },
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

const SidebarContent = ({ onNavigate }: { onNavigate?: () => void }) => {
  const navigate = useNavigate();

  const handleHomeClick = () => {
    navigate("/");
    if (onNavigate) onNavigate();
  };

  return (
    <>
      {/* Logo */}
      <div className="flex items-center justify-between p-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Sparkles className="w-8 h-8 text-primary animate-pulse" />
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            FinTrack AI
          </span>
        </div>
      </div>

      {/* Back to Homepage Button */}
      <div className="px-4 pt-4">
        <Button
          onClick={handleHomeClick}
          variant="outline"
          className="w-full justify-start gap-3 border-slate-700 bg-slate-800/50 hover:bg-slate-700/50 text-slate-200 hover:text-white transition-all group"
        >
          <Home className="w-5 h-5 group-hover:scale-110 transition-transform" />
          Back to Homepage
        </Button>
      </div>

      <ScrollArea className="flex-1 px-4 py-4">
        {/* Main Navigation */}
        <div className="space-y-1">
          <p className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Main
          </p>
          {mainNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-primary/10 text-primary shadow-md"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </div>

        {/* Secondary Navigation */}
        <div className="space-y-1 mt-8">
          <p className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Account
          </p>
          {secondaryNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-primary/10 text-primary shadow-md"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </div>
      </ScrollArea>

      {/* Logout Button */}
      <div className="p-4 border-t border-slate-700">
        <button className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-all">
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </>
  );
};

const Sidebar = ({ isMobile, isOpen, setIsOpen }: SidebarProps) => {
  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        {isOpen && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsOpen?.(false)}
          />
        )}

        {/* Mobile Sidebar */}
        <aside
          className={`fixed left-0 top-0 h-full w-72 bg-slate-900 border-r border-slate-700 z-50 transform transition-transform duration-300 lg:hidden flex flex-col ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Close Button */}
          <button
            onClick={() => setIsOpen?.(false)}
            className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>

          <SidebarContent onNavigate={() => setIsOpen?.(false)} />
        </aside>
      </>
    );
  }

  // Desktop Sidebar
  return (
    <aside className="hidden lg:flex lg:flex-col h-screen w-72 bg-slate-900 border-r border-slate-700 sticky top-0">
      <SidebarContent />
    </aside>
  );
};

export default Sidebar;

