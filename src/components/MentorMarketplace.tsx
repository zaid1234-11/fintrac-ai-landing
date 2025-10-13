import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, ArrowRight } from "lucide-react";

const mentors = [
  {
    name: "Sarah Johnson",
    expertise: "Investment Strategy",
    rating: 4.9,
    reviews: 127,
    price: "$99/month",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop",
    specialties: ["Stocks", "ETFs", "Portfolio Management"],
  },
  {
    name: "Michael Chen",
    expertise: "Retirement Planning",
    rating: 5.0,
    reviews: 89,
    price: "$129/month",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop",
    specialties: ["401k", "IRA", "Long-term Planning"],
  },
  {
    name: "Emily Rodriguez",
    expertise: "Debt Management",
    rating: 4.8,
    reviews: 156,
    price: "$79/month",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop",
    specialties: ["Debt Reduction", "Credit Score", "Budgeting"],
  },
];

const MentorMarketplace = () => {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16 space-y-4">
          <span className="text-accent text-sm font-semibold tracking-wider uppercase">
            Expert Guidance
          </span>
          <h2 className="text-4xl lg:text-5xl font-bold">
            Connect with Financial Mentors
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get personalized advice from vetted financial professionals through flexible subscription plans.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {mentors.map((mentor, index) => (
            <Card 
              key={index}
              className="group overflow-hidden bg-gradient-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-elevated hover:-translate-y-2"
            >
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={mentor.image} 
                  alt={mentor.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-xl font-bold mb-1">{mentor.name}</h3>
                  <p className="text-sm text-primary">{mentor.expertise}</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-accent fill-accent" />
                    <span className="font-semibold">{mentor.rating}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    ({mentor.reviews} reviews)
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {mentor.specialties.map((specialty, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {specialty}
                    </Badge>
                  ))}
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <span className="text-2xl font-bold text-primary">{mentor.price}</span>
                  <Button variant="outline" size="sm" className="group/btn">
                    Book Session
                    <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
        
        <div className="text-center">
          <Button variant="cta" size="lg">
            View All Mentors
          </Button>
        </div>
      </div>
    </section>
  );
};

export default MentorMarketplace;
