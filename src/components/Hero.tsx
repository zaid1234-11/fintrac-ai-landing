import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, TrendingUp, Wallet, BarChart3, PieChart } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse [animation-delay:1s]" />
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text Content */}
          <div className="space-y-8 animate-in fade-in slide-in-from-left duration-1000">
            <Badge className="bg-primary/10 text-primary border-primary/20 backdrop-blur-sm px-4 py-2 text-sm w-fit">
              <TrendingUp className="w-4 h-4 mr-2" />
              Smart Financial Management
            </Badge>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-tight">
              Your Money,
              <br />
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Smarter Than Ever
              </span>
            </h1>

            <p className="text-xl text-slate-300 max-w-xl">
              AI-powered personal finance management that helps you save more, spend wisely, and achieve your financial goals faster.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                size="lg"
                onClick={() => navigate("/dashboard")}
                className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-2xl shadow-primary/30 text-lg px-8 py-6 rounded-2xl group"
              >
                Get Started Free
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-slate-600/50 bg-slate-800/60 backdrop-blur-sm text-slate-200 hover:bg-white/10 hover:border-primary/50 text-lg px-8 py-6 rounded-2xl"
              >
                Watch Demo
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center gap-8 pt-8">
              <div className="text-center">
                <div className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  10K+
                </div>
                <div className="text-sm text-slate-400">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  4.9/5
                </div>
                <div className="text-sm text-slate-400">User Rating</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  ₹50Cr+
                </div>
                <div className="text-sm text-slate-400">Managed</div>
              </div>
            </div>
          </div>

          {/* Right: 3D Interactive Dashboard Visualization */}
          <div className="relative animate-in fade-in slide-in-from-right duration-1000 [animation-delay:200ms] perspective-1000">
            <div className="relative w-full h-[600px]">
              {/* Main Dashboard Card - Center */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-96 rounded-3xl bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 backdrop-blur-2xl border border-white/20 shadow-2xl p-6 animate-float z-10 transition-all duration-300 cursor-pointer hover:scale-105 hover:shadow-primary/30 hover:shadow-2xl hover:border-primary/40 group">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors">Total Balance</h3>
                    <Wallet className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    ₹2,45,890
                  </div>
                  <div className="flex items-center gap-2 text-sm text-green-400">
                    <TrendingUp className="w-4 h-4" />
                    <span>+12.5% this month</span>
                  </div>
                  
                  {/* Mini Chart */}
                  <div className="mt-6 h-32 flex items-end gap-2">
                    {[40, 65, 45, 80, 60, 90, 75, 95].map((height, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-gradient-to-t from-primary to-accent rounded-t-lg animate-grow hover:from-accent hover:to-primary transition-all"
                        style={{
                          height: `${height}%`,
                          animationDelay: `${i * 100}ms`
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating Card - Top Right */}
              <div className="absolute top-8 right-0 w-64 h-32 rounded-2xl bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 backdrop-blur-xl border border-white/10 shadow-xl p-4 animate-float-delayed-1 rotate-3 transition-all duration-300 cursor-pointer hover:scale-110 hover:rotate-6 hover:shadow-blue-500/30 hover:shadow-2xl hover:border-blue-500/40 group">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Expenses</span>
                  <PieChart className="w-4 h-4 text-blue-400 group-hover:rotate-12 group-hover:scale-125 transition-transform" />
                </div>
                <div className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">₹45,200</div>
                <div className="text-xs text-slate-400">This month</div>
              </div>

              {/* Floating Card - Bottom Left */}
              <div className="absolute bottom-8 left-0 w-64 h-32 rounded-2xl bg-gradient-to-br from-green-500/20 via-teal-500/20 to-cyan-500/20 backdrop-blur-xl border border-white/10 shadow-xl p-4 animate-float-delayed-2 -rotate-3 transition-all duration-300 cursor-pointer hover:scale-110 hover:-rotate-6 hover:shadow-green-500/30 hover:shadow-2xl hover:border-green-500/40 group">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Savings</span>
                  <BarChart3 className="w-4 h-4 text-green-400 group-hover:rotate-12 group-hover:scale-125 transition-transform" />
                </div>
                <div className="text-2xl font-bold text-white group-hover:text-green-400 transition-colors">₹1,24,500</div>
                <div className="text-xs text-slate-400">Goal: ₹2,00,000</div>
              </div>

              {/* Floating Card - Top Left */}
              <div className="absolute top-16 left-12 w-48 h-24 rounded-xl bg-gradient-to-br from-orange-500/20 via-red-500/20 to-pink-500/20 backdrop-blur-xl border border-white/10 shadow-xl p-3 animate-float-delayed-3 -rotate-6 transition-all duration-300 cursor-pointer hover:scale-110 hover:-rotate-12 hover:shadow-orange-500/30 hover:shadow-2xl hover:border-orange-500/40 group">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse group-hover:scale-150 transition-transform" />
                  <span className="text-xs text-slate-300 group-hover:text-white transition-colors">AI Active</span>
                </div>
                <div className="text-sm font-semibold text-white group-hover:text-orange-400 transition-colors">Budget Tracking</div>
              </div>

              {/* Floating Card - Bottom Right */}
              <div className="absolute bottom-16 right-12 w-48 h-24 rounded-xl bg-gradient-to-br from-purple-500/20 via-indigo-500/20 to-blue-500/20 backdrop-blur-xl border border-white/10 shadow-xl p-3 animate-float-delayed-4 rotate-6 transition-all duration-300 cursor-pointer hover:scale-110 hover:rotate-12 hover:shadow-purple-500/30 hover:shadow-2xl hover:border-purple-500/40 group">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-3 h-3 text-primary group-hover:rotate-12 group-hover:scale-125 transition-transform" />
                  <span className="text-xs text-slate-300 group-hover:text-white transition-colors">Investments</span>
                </div>
                <div className="text-sm font-semibold text-white group-hover:text-purple-400 transition-colors">+₹12,450</div>
              </div>

              {/* Glow Effects */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Animation Styles */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes float-delayed-1 {
          0%, 100% { transform: translateY(0px) rotate(3deg); }
          50% { transform: translateY(-15px) rotate(3deg); }
        }
        
        @keyframes float-delayed-2 {
          0%, 100% { transform: translateY(0px) rotate(-3deg); }
          50% { transform: translateY(-25px) rotate(-3deg); }
        }
        
        @keyframes float-delayed-3 {
          0%, 100% { transform: translateY(0px) rotate(-6deg); }
          50% { transform: translateY(-18px) rotate(-6deg); }
        }
        
        @keyframes float-delayed-4 {
          0%, 100% { transform: translateY(0px) rotate(6deg); }
          50% { transform: translateY(-22px) rotate(6deg); }
        }
        
        @keyframes grow {
          from { height: 0; }
          to { height: var(--final-height); }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-float-delayed-1 {
          animation: float-delayed-1 5s ease-in-out infinite;
          animation-delay: 0.5s;
        }
        
        .animate-float-delayed-2 {
          animation: float-delayed-2 7s ease-in-out infinite;
          animation-delay: 1s;
        }
        
        .animate-float-delayed-3 {
          animation: float-delayed-3 5.5s ease-in-out infinite;
          animation-delay: 1.5s;
        }
        
        .animate-float-delayed-4 {
          animation: float-delayed-4 6.5s ease-in-out infinite;
          animation-delay: 2s;
        }
        
        .animate-grow {
          animation: grow 1s ease-out forwards;
        }
        
        .perspective-1000 {
          perspective: 1000px;
        }
      `}</style>
    </section>
  );
};

export default Hero;
