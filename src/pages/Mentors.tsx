import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, ArrowRight, Search } from "lucide-react";
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

// Curated list of popular specialties for the filter buttons
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
    <div className="relative overflow-hidden p-8 rounded-lg">
      {/* Background shapes for the liquid effect */}
      <div className="absolute -top-24 -left-24 w-80 h-80 bg-primary/20 rounded-full filter blur-3xl opacity-60 animate-blob"></div>
      <div className="absolute -bottom-24 -right-10 w-80 h-80 bg-accent/20 rounded-full filter blur-3xl opacity-60 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-40 -left-10 w-72 h-72 bg-blue-500/10 rounded-full filter blur-3xl opacity-50 animate-blob animation-delay-4000"></div>


      <div className="relative z-10">
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-4xl lg:text-5xl font-bold text-white tracking-tight" style={{ textShadow: '0 0 15px hsla(var(--primary), 0.5)' }}>
            Connect with Financial Mentors
          </h2>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Get personalized advice from vetted financial professionals through flexible subscription plans.
          </p>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-12 space-y-6">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by name, expertise, or specialty..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-full bg-slate-800/40 backdrop-blur-lg border border-white/10 text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
            />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              onClick={() => setSelectedSpecialty(null)}
              variant={!selectedSpecialty ? 'default' : 'outline'}
              className={`rounded-full transition-all ${!selectedSpecialty ? 'bg-primary text-white' : 'border-slate-600 text-slate-200 hover:bg-primary/20 hover:text-primary'}`}
            >
              All
            </Button>
            {popularSpecialties.map(specialty => (
              <Button
                key={specialty}
                onClick={() => setSelectedSpecialty(specialty)}
                variant={selectedSpecialty === specialty ? 'default' : 'outline'}
                className={`rounded-full transition-all ${selectedSpecialty === specialty ? 'bg-primary text-white' : 'border-slate-600 text-slate-200 hover:bg-primary/20 hover:text-primary'}`}
              >
                {specialty}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredMentors.map((mentor, index) => (
            <div
              key={index}
              className="group overflow-hidden rounded-2xl bg-slate-800/40 backdrop-blur-xl border border-white/10 shadow-lg transition-all duration-300 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-2 flex flex-col"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={mentor.image}
                  alt={mentor.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
              </div>

              <div className="p-6 space-y-4 flex flex-col flex-grow">
                <div className="flex-grow">
                  <h3 className="text-xl font-bold text-white mb-1">{mentor.name}</h3>
                  <p className="text-sm text-primary font-medium" style={{ textShadow: '0 0 8px hsla(var(--primary), 0.7)' }}>{mentor.expertise}</p>
                
                  <div className="flex items-center gap-2 text-slate-300 mt-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-accent fill-accent" />
                      <span className="font-semibold text-white">{mentor.rating}</span>
                    </div>
                    <span className="text-sm">({mentor.reviews} reviews)</span>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    {mentor.specialties.map((specialty, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs bg-slate-700/50 text-slate-200 border-slate-600">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between pt-4 border-t border-white/10 gap-x-4 gap-y-2 mt-auto">
                  <span className="text-xl lg:text-2xl font-bold text-primary whitespace-nowrap" style={{ textShadow: '0 0 10px hsla(var(--primary), 0.5)' }}>{mentor.price}</span>
                  <Button variant="outline" size="sm" className="group/btn border-slate-600 text-slate-200 hover:bg-primary/20 hover:text-primary hover:border-primary/50 flex-shrink-0">
                    Book Session
                    <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {filteredMentors.length === 0 && (
          <div className="text-center py-16">
            <p className="text-xl text-slate-300">No mentors found matching your criteria.</p>
          </div>
        )}

      </div>
       <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.2); }
          66% { transform: translate(-20px, 20px) scale(0.8); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 8s infinite ease-in-out;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
       `}</style>
    </div>
  );
};

export default MentorsPage;
