import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();

  const handleViewAllMentors = () => {
    navigate("/dashboard/mentors");
    // Scroll to top after navigation
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <Badge className="bg-primary/10 text-primary border-primary/20 backdrop-blur-sm px-4 py-2 text-sm">
            Expert Guidance
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold text-white">
            Connect with{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Financial Mentors
            </span>
          </h2>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Get personalized advice from vetted financial professionals through flexible subscription plans.
          </p>
        </div>

        {/* Mentors Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {mentors.map((mentor, index) => (
            <Card
              key={index}
              className="group bg-gradient-to-br from-slate-900/80 via-slate-800/80 to-slate-900/80 backdrop-blur-2xl border-white/20 shadow-xl hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-2 transition-all duration-300 overflow-hidden animate-in fade-in slide-in-from-bottom-4"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={mentor.image}
                  alt={mentor.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
                
                {/* Rating Badge */}
                <div className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-sm border border-white/10">
                  <Star className="w-4 h-4 text-accent fill-accent" />
                  <span className="font-semibold text-white text-sm">{mentor.rating}</span>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {/* Name & Expertise */}
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">{mentor.name}</h3>
                  <p className="text-sm text-primary font-medium">{mentor.expertise}</p>
                </div>

                {/* Reviews */}
                <div className="flex items-center gap-2 text-slate-300 text-sm">
                  <span>({mentor.reviews} reviews)</span>
                </div>

                {/* Specialties */}
                <div className="flex flex-wrap gap-2">
                  {mentor.specialties.map((specialty, idx) => (
                    <Badge 
                      key={idx} 
                      variant="secondary" 
                      className="text-xs bg-slate-700/50 text-slate-200 border border-slate-600/30 backdrop-blur-sm"
                    >
                      {specialty}
                    </Badge>
                  ))}
                </div>

                {/* Price & CTA */}
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    {mentor.price}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="group/btn border-slate-600/50 bg-slate-800/60 backdrop-blur-sm text-slate-200 hover:bg-primary/20 hover:text-primary hover:border-primary/50 rounded-xl"
                  >
                    Book
                    <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center">
          <Button
            size="lg"
            onClick={handleViewAllMentors}
            className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-xl shadow-primary/20 text-lg px-8 py-6 rounded-2xl group"
          >
            View All Mentors
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default MentorMarketplace;
