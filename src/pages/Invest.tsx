import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { toast } from "../components/ui/use-toast";
import { Loader2, Sparkles, TrendingUp, Target, Calendar, HelpCircle, ArrowRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { Badge } from "@/components/ui/badge";

// Mock Market Data
const marketMovers = [
  { name: "Reliance Industries", change: "+2.5%", value: "₹2,850.75" },
  { name: "Tata Motors", change: "+1.8%", value: "₹980.10" },
  { name: "HDFC Bank", change: "-0.5%", value: "₹1,520.40" },
  { name: "Infosys", change: "+3.1%", value: "₹1,450.00" },
];

const riskLevels = {
  1: { label: "Conservative", color: "bg-blue-500" },
  2: { label: "Balanced", color: "bg-green-500" },
  3: { label: "Growth", color: "bg-yellow-500" },
  4: { label: "Aggressive", color: "bg-orange-500" },
  5: { label: "Very Aggressive", color: "bg-red-500" },
};

// Define the expected structure of the AI's response
interface InvestmentSuggestion {
  instrument_name: string;
  category: "Mutual Fund" | "Stock" | "ETF" | "Bond" | "Crypto";
  rationale: string;
  risk_level: "Low" | "Medium" | "High";
  potential_return: string; // e.g., "12-15% CAGR"
  allocation_percentage: number;
}

const InvestPage = () => {
  const [amount, setAmount] = useState(25000);
  const [risk, setRisk] = useState(3);
  const [horizon, setHorizon] = useState("5-10");
  const [goal, setGoal] = useState("wealth-growth");
  const [suggestions, setSuggestions] = useState<InvestmentSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleGetSuggestions = async () => {
    setIsLoading(true);
    setSuggestions([]);

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      toast({
        variant: "destructive",
        title: "API Key Missing",
        description: "Please configure your .env file with VITE_GEMINI_API_KEY.",
      });
      setIsLoading(false);
      return;
    }

    const riskLabel = riskLevels[risk as keyof typeof riskLevels].label;
    const prompt = `
      As a financial advisor AI for the Indian market, generate a diversified investment portfolio for a user with the following profile:
      - Investment Amount: ₹${amount.toLocaleString('en-IN')}
      - Risk Tolerance: ${riskLabel}
      - Investment Horizon: ${horizon} years
      - Financial Goal: ${goal.replace('-', ' ')}

      Provide 5 diverse investment suggestions. For each suggestion, give me the instrument name (e.g., 'Parag Parikh Flexi Cap Fund' or 'Reliance Industries Ltd.'), category, a brief rationale, risk level (Low, Medium, or High), potential return as an estimated CAGR range, and a recommended allocation percentage. The total allocation percentage across all suggestions must sum up to 100.

      IMPORTANT: Respond ONLY with a valid JSON array of objects. Do not include any introductory text, backticks, or the word "json". The structure of each object in the array must be:
      {
        "instrument_name": string,
        "category": "Mutual Fund" | "Stock" | "ETF" | "Bond" | "Crypto",
        "rationale": string,
        "risk_level": "Low" | "Medium" | "High",
        "potential_return": string,
        "allocation_percentage": number
      }
    `;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "An unknown error occurred.");
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (text) {
        const parsedSuggestions = JSON.parse(text);
        setSuggestions(parsedSuggestions);
      } else {
        throw new Error("No content received from AI.");
      }
    } catch (error: any) {
      console.error("Error fetching AI suggestions:", error);
      toast({
        variant: "destructive",
        title: "Failed to Get Suggestions",
        description: error.message || "Please check the console for more details.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];
  
  const getRiskBadgeColor = (riskLevel: string) => {
    switch(riskLevel.toLowerCase()) {
      case 'low': return 'bg-blue-500/20 text-blue-300 border-blue-400/30';
      case 'medium': return 'bg-green-500/20 text-green-300 border-green-400/30';
      case 'high': return 'bg-red-500/20 text-red-300 border-red-400/30';
      default: return 'bg-slate-500/20 text-slate-300 border-slate-400/30';
    }
  };


  return (
    <div className="p-8 rounded-lg min-h-screen">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Controls */}
        <div className="lg:col-span-1 space-y-8">
          <Card className="bg-slate-800/40 backdrop-blur-xl border-white/10 shadow-lg">
            <CardHeader>
              <CardTitle className="text-white text-2xl flex items-center gap-2">
                <Sparkles className="text-primary" />
                AI Investment Planner
              </CardTitle>
              <CardDescription className="text-slate-400">
                Tell us your goals, and our AI will build a personalized investment plan for you.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Amount */}
              <div>
                <label className="text-slate-300 font-medium">Investment Amount (₹)</label>
                <div className="flex items-center gap-4 mt-2">
                  <Slider
                    value={[amount]}
                    onValueChange={(value) => setAmount(value[0])}
                    min={5000}
                    max={100000}
                    step={1000}
                  />
                  <span className="font-bold text-lg text-primary w-24 text-center">
                    {amount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Risk Tolerance */}
              <div>
                <label className="text-slate-300 font-medium">Risk Tolerance</label>
                <div className="flex items-center gap-4 mt-2">
                  <Slider
                    value={[risk]}
                    onValueChange={(value) => setRisk(value[0])}
                    min={1}
                    max={5}
                    step={1}
                  />
                  <span className={`font-semibold text-sm text-white px-3 py-1 rounded-full ${riskLevels[risk as keyof typeof riskLevels].color} w-32 text-center`}>
                    {riskLevels[risk as keyof typeof riskLevels].label}
                  </span>
                </div>
              </div>

              {/* Investment Horizon */}
              <div>
                <label className="text-slate-300 font-medium flex items-center gap-2"><Calendar className="w-4 h-4" />Investment Horizon</label>
                 <Select value={horizon} onValueChange={setHorizon}>
                    <SelectTrigger className="w-full mt-2 bg-slate-700/50 border-slate-600 text-white">
                        <SelectValue placeholder="Select horizon" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="1-3">Short-term (1-3 Years)</SelectItem>
                        <SelectItem value="3-5">Medium-term (3-5 Years)</SelectItem>
                        <SelectItem value="5-10">Long-term (5-10 Years)</SelectItem>
                        <SelectItem value="10+">Very Long-term (10+ Years)</SelectItem>
                    </SelectContent>
                </Select>
              </div>

               {/* Financial Goal */}
              <div>
                <label className="text-slate-300 font-medium flex items-center gap-2"><Target className="w-4 h-4" />Financial Goal</label>
                 <Select value={goal} onValueChange={setGoal}>
                    <SelectTrigger className="w-full mt-2 bg-slate-700/50 border-slate-600 text-white">
                        <SelectValue placeholder="Select goal" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="wealth-growth">Wealth Growth</SelectItem>
                        <SelectItem value="tax-saving">Tax Saving</SelectItem>
                        <SelectItem value="retirement">Retirement</SelectItem>
                        <SelectItem value="child-education">Child's Education</SelectItem>
                    </SelectContent>
                </Select>
              </div>

              <Button onClick={handleGetSuggestions} disabled={isLoading} size="lg" className="w-full">
                {isLoading ? <Loader2 className="animate-spin" /> : "Get AI Suggestions"}
              </Button>
            </CardContent>
          </Card>
           <Card className="bg-slate-800/40 backdrop-blur-xl border-white/10 shadow-lg">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="text-primary"/> Market Movers
              </CardTitle>
            </CardHeader>
            <CardContent>
                <ul className="space-y-3">
                    {marketMovers.map(stock => (
                        <li key={stock.name} className="flex justify-between items-center text-sm">
                            <span className="font-medium text-slate-200">{stock.name}</span>
                            <div className="text-right">
                                <span className={`font-semibold ${stock.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>{stock.change}</span>
                                <p className="text-xs text-slate-400">{stock.value}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Suggestions */}
        <div className="lg:col-span-2">
          {isLoading && (
            <div className="flex justify-center items-center h-full">
               <Loader2 className="w-16 h-16 text-primary animate-spin" />
            </div>
          )}
          {!isLoading && suggestions.length === 0 && (
             <Card className="bg-slate-800/40 backdrop-blur-xl border-white/10 shadow-lg flex flex-col items-center justify-center text-center p-12 h-full">
                <HelpCircle className="w-16 h-16 text-primary/50 mb-4"/>
                <h3 className="text-2xl font-bold text-white mb-2">Ready to Invest?</h3>
                <p className="text-slate-400 max-w-sm">Adjust the settings on the left and click "Get AI Suggestions" to generate your personalized portfolio.</p>
             </Card>
          )}

          {suggestions.length > 0 && (
            <div className="space-y-6">
                <Card className="bg-slate-800/40 backdrop-blur-xl border-white/10 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-white">AI Recommended Portfolio</CardTitle>
                         <CardDescription className="text-slate-400">Based on your inputs, here's a suggested asset allocation.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie data={suggestions} dataKey="allocation_percentage" nameKey="instrument_name" cx="50%" cy="50%" outerRadius={100} label>
                                {suggestions.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

              {suggestions.map((s, index) => (
                <Card key={index} className="bg-slate-800/40 backdrop-blur-xl border-white/10 shadow-lg transition-all hover:border-primary/50">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-primary text-xl">{s.instrument_name}</CardTitle>
                            <CardDescription className="text-slate-400">{s.category}</CardDescription>
                        </div>
                        <Badge className={getRiskBadgeColor(s.risk_level)}>{s.risk_level} Risk</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-slate-300 text-sm">{s.rationale}</p>
                    <div className="grid grid-cols-2 gap-4 text-sm pt-4 border-t border-white/10">
                        <div>
                            <p className="text-slate-400">Potential Return</p>
                            <p className="font-bold text-green-400 text-base">{s.potential_return}</p>
                        </div>
                        <div>
                            <p className="text-slate-400">Allocation</p>
                            <p className="font-bold text-white text-base">{s.allocation_percentage}%</p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full group/btn border-slate-600 text-slate-200 hover:bg-primary/20 hover:text-primary hover:border-primary/50">
                        Invest Now <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform"/>
                    </Button>
                  </CardContent>
                </Card>
              ))}
               <p className="text-xs text-slate-500 text-center px-4">*Disclaimer: The information provided by the AI is for informational purposes only and does not constitute financial advice. Always consult with a qualified professional before making investment decisions.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvestPage;

