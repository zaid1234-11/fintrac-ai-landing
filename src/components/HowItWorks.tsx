import { Card, CardContent } from "@/components/ui/card";
import { UserPlus, Wallet, Brain, TrendingUp, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      icon: UserPlus,
      number: "01",
      title: "Sign Up Free",
      description: "Create your account in seconds. No credit card required to start your journey.",
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "from-blue-500/20 via-cyan-500/20 to-blue-500/20"
    },
    {
      icon: Wallet,
      title: "Connect Accounts",
      number: "02",
      description: "Securely link your bank accounts and credit cards for automatic transaction tracking.",
      gradient: "from-purple-500 to-pink-500",
      bgGradient: "from-purple-500/20 via-pink-500/20 to-purple-500/20"
    },
    {
      icon: Brain,
      number: "03",
      title: "AI Analyzes",
      description: "Our AI analyzes your spending patterns and provides personalized insights instantly.",
      gradient: "from-orange-500 to-amber-500",
      bgGradient: "from-orange-500/20 via-amber-500/20 to-orange-500/20"
    },
    {
      icon: TrendingUp,
      number: "04",
      title: "Achieve Goals",
      description: "Track your progress, get alerts, and reach your financial goals faster than ever.",
      gradient: "from-green-500 to-emerald-500",
      bgGradient: "from-green-500/20 via-emerald-500/20 to-green-500/20"
    }
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse [animation-delay:1s]" />
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <div className="flex items-center justify-center gap-2 mb-4">
            <CheckCircle2 className="w-6 h-6 text-primary animate-pulse" />
            <span className="text-sm font-semibold text-primary uppercase tracking-wider">Simple Process</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-white">
            How It{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Works
            </span>
          </h2>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Get started in minutes and take control of your financial future
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {/* Connection Lines - Desktop Only */}
          <div className="hidden lg:block absolute top-1/4 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <Card
                className={`group relative overflow-hidden bg-gradient-to-br ${step.bgGradient} backdrop-blur-2xl border-white/10 shadow-xl hover:shadow-2xl transition-all duration-500 animate-in fade-in slide-in-from-bottom-4 cursor-pointer h-full`}
                style={{ animationDelay: `${index * 150}ms` }}
              >
                {/* Hover Glow Effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className={`absolute inset-0 bg-gradient-to-br ${step.bgGradient} blur-xl`} />
                </div>

                {/* Step Number - Large Background */}
                <div className="absolute -top-8 -right-8 text-9xl font-bold text-white/5 group-hover:text-white/10 transition-colors duration-500">
                  {step.number}
                </div>

                <CardContent className="relative p-8 space-y-6 flex flex-col h-full">
                  {/* Icon with Number Badge */}
                  <div className="relative">
                    {/* Main Icon Circle */}
                    <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-2xl relative z-10`}>
                      <step.icon className="w-10 h-10 text-white" />
                    </div>

                    {/* Number Badge */}
                    <div className={`absolute -top-2 -right-2 w-10 h-10 rounded-full bg-gradient-to-br ${step.gradient} flex items-center justify-center text-white font-bold text-sm shadow-lg group-hover:scale-125 transition-transform duration-500 z-20`}>
                      {step.number}
                    </div>

                    {/* Animated Ring */}
                    <div className={`absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-white/30 transition-all duration-500 animate-pulse`} />

                    {/* Sparkles */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <Sparkles className="absolute -top-2 -left-2 w-5 h-5 text-yellow-400 animate-pulse" />
                      <Sparkles className="absolute -bottom-2 -right-2 w-4 h-4 text-yellow-400 animate-pulse [animation-delay:0.3s]" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="space-y-3 flex-grow">
                    <h3 className="text-2xl font-bold text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-200 group-hover:bg-clip-text transition-all duration-300">
                      {step.title}
                    </h3>
                    <p className="text-slate-300 leading-relaxed group-hover:text-white transition-colors duration-300">
                      {step.description}
                    </p>
                  </div>

                  {/* Arrow Indicator (except last card) */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute -right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-30">
                      <ArrowRight className={`w-8 h-8 text-white animate-pulse`} />
                    </div>
                  )}

                  {/* Bottom Gradient Line */}
                  <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${step.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`} />
                </CardContent>

                {/* Corner Glow */}
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${step.gradient} opacity-10 rounded-bl-full transform scale-0 group-hover:scale-100 transition-transform duration-500`} />
              </Card>

              {/* Step Connector - Mobile */}
              {index < steps.length - 1 && (
                <div className="lg:hidden flex items-center justify-center my-4">
                  <div className="w-0.5 h-8 bg-gradient-to-b from-primary to-accent animate-pulse" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16 animate-in fade-in slide-in-from-bottom-4 duration-1000 [animation-delay:600ms]">
          <div className="inline-flex flex-col items-center gap-4">
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 backdrop-blur-sm border border-primary/20">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <span className="text-slate-200 font-medium">
                Start your journey in less than 2 minutes
              </span>
            </div>
            
            {/* Progress Indicator */}
            <div className="flex items-center gap-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className="w-2 h-2 rounded-full bg-primary/30 animate-pulse"
                  style={{ animationDelay: `${index * 200}ms` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
