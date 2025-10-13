import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut } from "lucide-react";

export const Header = () => {
  return (
    <header className="h-16 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-8">
      <h2 className="text-2xl font-bold text-white">Dashboard</h2>
      
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
