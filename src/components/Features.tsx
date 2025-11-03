import { Card, CardContent } from "@/components/ui/card";
import { Wallet, Bot, TrendingUp, Shield, Brain, Users, Sparkles, Zap } from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: Wallet,
      title: "Smart Budgeting",
      description: "AI-powered budget tracking with real-time alerts and spending insights to keep you on track.",
      gradient: "from-blue-500/20 via-cyan-500/20 to-blue-500/20",
      iconColor: "text-blue-400",
      iconBg: "from-blue-500 to-cyan-500"
    },
    {
      icon: Bot,
      title: "AI Assistant",
      description: "Chat with Gemini 2.0 for personalized financial advice and instant answers to your money questions.",
      gradient: "from-purple-500/20 via-pink-500/20 to-purple-500/20",
      iconColor: "text-purple-400",
      iconBg: "from-purple-500 to-pink-500"
    },
    {
      icon: TrendingUp,
      title: "Investment Tracking",
      description: "Monitor your portfolio performance and get smart investment recommendations based on your goals.",
      gradient: "from-green-500/20 via-emerald-500/20 to-green-500/20",
      iconColor: "text-green-400",
      iconBg: "from-green-500 to-emerald-500"
    },
    {
      icon: Shield,
      title: "Bank-Level Security",
      description: "Your data is encrypted and protected with enterprise-grade security protocols.",
      gradient: "from-orange-500/20 via-amber-500/20 to-orange-500/20",
      iconColor: "text-orange-400",
      iconBg: "from-orange-500 to-amber-500"
    },
    {
      icon: Brain,
      title: "Smart Analytics",
      description: "Understand your spending patterns with AI-driven insights and predictive forecasting.",
      gradient: "from-pink-500/20 via-rose-500/20 to-pink-500/20",
      iconColor: "text-pink-400",
      iconBg: "from-pink-500 to-rose-500"
    },
    {
      icon: Users,
      title: "Expert Mentors",
      description: "Connect with certified financial advisors for personalized guidance and professional advice.",
      gradient: "from-cyan-500/20 via-teal-500/20 to-cyan-500/20",
      iconColor: "text-cyan-400",
      iconBg: "from-cyan-500 to-teal-500"
    }
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse [animation-delay:1s]" />
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 text-primary animate-pulse" />
            <span className="text-sm font-semibold text-primary uppercase tracking-wider">Features</span>
            <Sparkles className="w-6 h-6 text-accent animate-pulse [animation-delay:0.5s]" />
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-white">
            Everything You Need to{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Succeed
            </span>
          </h2>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Powerful features designed to make managing money effortless and intelligent
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              className={`group relative overflow-hidden bg-gradient-to-br ${feature.gradient} backdrop-blur-2xl border-white/10 shadow-xl hover:shadow-2xl transition-all duration-500 animate-in fade-in slide-in-from-bottom-4 cursor-pointer`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Hover Glow Effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} blur-xl`} />
              </div>

              {/* Animated Border on Hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className={`absolute inset-0 bg-gradient-to-r ${feature.iconBg} opacity-20 animate-pulse`} />
              </div>

              <CardContent className="relative p-8 space-y-6">
                {/* Icon Container with Gradient */}
                <div className="relative">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.iconBg} flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  
                  {/* Animated Sparkle */}
                  <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <Zap className="w-5 h-5 text-yellow-400 animate-pulse" />
                  </div>

                  {/* Floating Particles */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="absolute top-0 left-0 w-2 h-2 bg-white rounded-full animate-ping" />
                    <div className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-white rounded-full animate-ping [animation-delay:0.3s]" />
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-200 group-hover:bg-clip-text transition-all duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-slate-300 leading-relaxed group-hover:text-white transition-colors duration-300">
                    {feature.description}
                  </p>
                </div>

                {/* Hover Arrow Indicator */}
                <div className="flex items-center gap-2 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                  <span>Learn more</span>
                  <Zap className="w-4 h-4 animate-pulse" />
                </div>

                {/* Bottom Gradient Line */}
                <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${feature.iconBg} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`} />
              </CardContent>

              {/* Corner Accent */}
              <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${feature.iconBg} opacity-10 rounded-bl-full transform scale-0 group-hover:scale-100 transition-transform duration-500`} />
            </Card>
          ))}
        </div>

        {/* Bottom CTA Section */}
        <div className="text-center mt-16 animate-in fade-in slide-in-from-bottom-4 duration-1000 [animation-delay:600ms]">
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 backdrop-blur-sm border border-primary/20">
            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
            <span className="text-slate-200 font-medium">
              And many more features to discover
            </span>
            <Sparkles className="w-5 h-5 text-accent animate-pulse [animation-delay:0.5s]" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
