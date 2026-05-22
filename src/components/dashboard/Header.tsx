import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, Menu } from "lucide-react";
import { Button } from "../ui/button";

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header = ({ onMenuClick }: HeaderProps) => {
  return (
    <header className="flex items-center justify-between px-4 md:px-8 py-4 border-b border-slate-700">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
          <Menu className="w-6 h-6 text-white" />
        </Button>
        <h2 className="text-2xl font-bold text-white">Dashboard</h2>
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger className="focus:outline-none">
          <Avatar className="cursor-pointer ring-2 ring-primary/20 hover:ring-primary/40 transition-all">
            <AvatarFallback className="bg-primary text-white">U</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 bg-slate-800 border-slate-700">
          <DropdownMenuItem className="cursor-pointer text-slate-200 focus:bg-slate-700 focus:text-white">
            <User className="mr-2 h-4 w-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer text-slate-200 focus:bg-slate-700 focus:text-white">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
};
