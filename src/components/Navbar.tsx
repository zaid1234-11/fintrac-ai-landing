import { Button } from "@/components/ui/button";
import { TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">FinTrack AI</span>
          </Link>
          
          <div className="flex items-center gap-8">
            <Link to="/#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link to="/#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
              How It Works
            </Link>
            <Link to="/#mentors" className="text-muted-foreground hover:text-foreground transition-colors">
              Mentors
            </Link>
            <Link to="/dashboard">
              <Button variant="outline" size="sm">
                View Dashboard
              </Button>
            </Link>
            <Button variant="cta" size="sm">
              Join Waitlist
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
