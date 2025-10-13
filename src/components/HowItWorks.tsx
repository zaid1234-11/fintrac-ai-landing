import { Link2, Lightbulb, TrendingUp } from "lucide-react";

const steps = [
  {
    icon: Link2,
    number: "01",
    title: "Connect",
    description: "Securely link your SMS for transaction alerts. Your data is encrypted and protected.",
  },
  {
    icon: Lightbulb,
    number: "02",
    title: "Get Insights",
    description: "Our AI analyzes your spending patterns and provides actionable insights automatically.",
  },
  {
    icon: TrendingUp,
    number: "03",
    title: "Grow",
    description: "Receive personalized investment suggestions and connect with mentors to build wealth.",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-24 bg-secondary/50 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(66,153,225,0.05),transparent)]" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16 space-y-4">
          <span className="text-accent text-sm font-semibold tracking-wider uppercase">
            Simple Process
          </span>
          <h2 className="text-4xl lg:text-5xl font-bold">
            How It Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get started in three simple steps and take control of your financial future.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <div key={index} className="relative group">
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-20 left-[60%] w-full h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
              )}
              
              <div className="relative bg-gradient-card border border-border rounded-2xl p-8 hover:border-primary/50 transition-all duration-300 hover:shadow-elevated">
                <div className="absolute -top-6 left-8">
                  <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-glow">
                    <step.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                </div>
                
                <div className="pt-8">
                  <div className="text-6xl font-bold text-primary/20 mb-4">
                    {step.number}
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
