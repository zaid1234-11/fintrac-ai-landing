import { Smartphone, MessageSquare, TrendingUp, BarChart3, Users } from "lucide-react";
import { Card } from "@/components/ui/card";

const features = [
  {
    icon: Smartphone,
    title: "Automated Tracking",
    description: "Securely connect with your SMS for transaction alerts. Your spending is tracked automatically—no more manual entry needed.",
  },
  {
    icon: MessageSquare,
    title: "AI Financial Assistant",
    description: "Ask our AI chatbot anything about your spending from the last month. 'How much did I spend on groceries?' Get instant, accurate answers.",
  },
  {
    icon: TrendingUp,
    title: "AI Investment Suggestions",
    description: "Receive personalized investment ideas based on your savings and risk profile. Let AI analyze market opportunities to help grow your wealth.",
    disclaimer: "Suggestions are not financial advice.",
  },
  {
    icon: BarChart3,
    title: "Visual Dashboard",
    description: "See exactly where your money is going with interactive charts and insights. Beautiful visualizations make complex data simple.",
  },
  {
    icon: Users,
    title: "Mentor Marketplace",
    description: "Connect with vetted financial mentors through subscription plans. Get professional guidance tailored to your financial goals.",
  },
];

const Features = () => {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16 space-y-4">
          <span className="text-accent text-sm font-semibold tracking-wider uppercase">
            Powerful Features
          </span>
          <h2 className="text-4xl lg:text-5xl font-bold">
            Everything You Need to Master Your Finances
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            From automated tracking to AI-powered insights, we've built the tools you need to take control.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index}
              className="group p-8 bg-gradient-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-elevated hover:-translate-y-2"
            >
              <div className="mb-6">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
              </div>
              
              <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                {feature.description}
              </p>
              
              {feature.disclaimer && (
                <p className="text-xs text-muted-foreground italic border-t border-border pt-4">
                  * {feature.disclaimer}
                </p>
              )}
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
