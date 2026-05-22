import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Star, ArrowRight, Search, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";

const mentors = [
  {
    name: "Aisha Sharma",
    expertise: "Investment Strategy",
    rating: 4.9,
    reviews: 127,
    price: "₹7,999/month",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop",
    specialties: ["Stocks", "ETFs", "Portfolio Management"],
  },
  {
    name: "Rohan Mehra",
    expertise: "Retirement Planning",
    rating: 5.0,
    reviews: 89,
    price: "₹9,999/month",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop",
    specialties: ["NPS", "IRA", "Long-term Planning"],
  },
  {
    name: "Priya Singh",
    expertise: "Debt Management",
    rating: 4.8,
    reviews: 156,
    price: "₹5,999/month",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop",
    specialties: ["Debt Reduction", "CIBIL Score", "Budgeting"],
  },
  {
    name: "Vikram Reddy",
    expertise: "Crypto & Web3",
    rating: 4.7,
    reviews: 204,
    price: "₹12,999/month",
    image: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400&h=400&fit=crop",
    specialties: ["Bitcoin", "DeFi", "NFTs"],
  },
  {
    name: "Anjali Gupta",
    expertise: "Tax Planning",
    rating: 4.9,
    reviews: 182,
    price: "₹8,499/month",
    image: "https://images.unsplash.com/photo-1557862921-37829c790f19?w=400&h=400&fit=crop",
    specialties: ["Income Tax", "GST", "Capital Gains"],
  },
  {
    name: "Siddharth Kumar",
    expertise: "Startup Funding",
    rating: 5.0,
    reviews: 75,
    price: "₹15,999/month",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop",
    specialties: ["Venture Capital", "Angel Investing", "Pitch Decks"],
  },
  {
    name: "Neha Desai",
    expertise: "Real Estate",
    rating: 4.8,
    reviews: 110,
    price: "₹11,499/month",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop",
    specialties: ["Property Investment", "Rental Income", "REITs"],
  },
  {
    name: "Arjun Iyer",
    expertise: "Mutual Funds",
    rating: 4.9,
    reviews: 250,
    price: "₹6,999/month",
    image: "https://images.unsplash.com/photo-1590086782792-42dd2350140d?w=400&h=400&fit=crop",
    specialties: ["SIPs", "ELSS", "Index Funds"],
  },
  {
    name: "Fatima Khan",
    expertise: "Freelancer Finance",
    rating: 5.0,
    reviews: 95,
    price: "₹7,499/month",
    image: "https://images.unsplash.com/photo-1542103749-8ef59b94f475?w=400&h=400&fit=crop",
    specialties: ["Business Registration", "Invoicing", "Self-employed Taxes"],
  },
  {
    name: "Rajesh Nair",
    expertise: "Technical Analysis",
    rating: 4.6,
    reviews: 310,
    price: "₹14,999/month",
    image: "https://images.unsplash.com/photo-1611403119860-57c493726dd5?w=400&h=400&fit=crop",
    specialties: ["Charting", "Indicators", "Trading Psychology"],
  },
  {
    name: "Isabelle Pinto",
    expertise: "Estate Planning",
    rating: 4.9,
    reviews: 88,
    price: "₹10,999/month",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop",
    specialties: ["Wills", "Trusts", "Inheritance"],
  },
  {
    name: "Karan Malhotra",
    expertise: "Credit & Rewards",
    rating: 4.8,
    reviews: 190,
    price: "₹4,999/month",
    image: "https://images.unsplash.com/photo-1530268729831-4b0b9e170218?w=400&h=400&fit=crop",
    specialties: ["Credit Cards", "Reward Points", "Travel Hacking"],
  },
];

const popularSpecialties = ["Stocks", "Mutual Funds", "Crypto & Web3", "Tax Planning", "Retirement Planning", "Debt Management"];

const MentorsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);

  const filteredMentors = useMemo(() => {
    return mentors.filter(mentor => {
      const searchTermLower = searchTerm.toLowerCase();
      const matchesSearch =
        mentor.name.toLowerCase().includes(searchTermLower) ||
        mentor.expertise.toLowerCase().includes(searchTermLower) ||
        mentor.specialties.some(s => s.toLowerCase().includes(searchTermLower));

      const matchesSpecialty = selectedSpecialty
        ? mentor.specialties.includes(selectedSpecialty)
        : true;

      return matchesSearch && matchesSpecialty;
    });
  }, [searchTerm, selectedSpecialty]);

  return (
    <div className="relative min-h-screen p-4 sm:p-6 lg:p-8">
      {/* Animated Background - Same as Chatbot */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 -right-4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse [animation-delay:1s]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse [animation-delay:2s]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <Card className="mb-8 bg-gradient-to-br from-slate-900/80 via-slate-800/80 to-slate-900/80 backdrop-blur-2xl border-white/20 shadow-2xl">
          <CardContent className="p-6 sm:p-8">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="relative">
                  <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                  <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                  Financial Mentors
                </h1>
              </div>
              <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto">
                Get personalized advice from vetted financial professionals through flexible subscription plans
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Search and Filter */}
        <Card className="mb-8 bg-gradient-to-br from-slate-900/80 via-slate-800/80 to-slate-900/80 backdrop-blur-2xl border-white/20 shadow-2xl">
          <CardContent className="p-6 space-y-6">
            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                type="text"
                placeholder="Search by name, expertise, or specialty..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-12 sm:h-14 pl-12 pr-4 bg-slate-800/70 backdrop-blur-sm border-slate-600/50 text-white placeholder:text-slate-400 rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-lg"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button
                onClick={() => setSelectedSpecialty(null)}
                variant={!selectedSpecialty ? 'default' : 'outline'}
                className={`rounded-full px-6 transition-all shadow-lg ${
                  !selectedSpecialty 
                    ? 'bg-gradient-to-br from-primary to-accent text-white hover:from-primary/90 hover:to-accent/90' 
                    : 'border-slate-600/50 bg-slate-800/60 backdrop-blur-sm text-slate-200 hover:bg-primary/20 hover:text-primary hover:border-primary/50'
                }`}
              >
                All Mentors
              </Button>
              {popularSpecialties.map(specialty => (
                <Button
                  key={specialty}
                  onClick={() => setSelectedSpecialty(specialty)}
                  variant={selectedSpecialty === specialty ? 'default' : 'outline'}
                  className={`rounded-full px-6 transition-all shadow-lg ${
                    selectedSpecialty === specialty 
                      ? 'bg-gradient-to-br from-primary to-accent text-white hover:from-primary/90 hover:to-accent/90' 
                      : 'border-slate-600/50 bg-slate-800/60 backdrop-blur-sm text-slate-200 hover:bg-primary/20 hover:text-primary hover:border-primary/50'
                  }`}
                >
                  {specialty}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Mentors Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMentors.map((mentor, index) => (
            <Card
              key={index}
              className="group overflow-hidden bg-gradient-to-br from-slate-900/80 via-slate-800/80 to-slate-900/80 backdrop-blur-2xl border-white/20 shadow-2xl transition-all duration-300 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-2 animate-in fade-in slide-in-from-bottom-2 duration-500"
              style={{ animationDelay: `${index * 50}ms` }}
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

              <CardContent className="p-6 space-y-4">
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
              </CardContent>
            </Card>
          ))}
        </div>

        {/* No Results */}
        {filteredMentors.length === 0 && (
          <Card className="bg-gradient-to-br from-slate-900/80 via-slate-800/80 to-slate-900/80 backdrop-blur-2xl border-white/20 shadow-2xl">
            <CardContent className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center">
                <Search className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No Mentors Found</h3>
              <p className="text-slate-300">Try adjusting your search or filters</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MentorsPage;
