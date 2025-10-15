
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, ArrowUpRight, ArrowDownLeft, SlidersHorizontal, Utensils, Plane, Receipt, ShoppingBag, Clapperboard, Home, HelpCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ScrollArea } from "@/components/ui/scroll-area";

// --- Data Structures and Mock Data ---
interface Transaction {
  id: string;
  merchant: string;
  amount: number;
  type: 'debit' | 'credit';
  date: string; // ISO 8601 format
  category: 'Food' | 'Travel' | 'Bills' | 'Shopping' | 'Entertainment' | 'Other' | 'Salary';
}

const mockTransactions: Transaction[] = [
  { id: '1', merchant: 'Zomato', amount: 450.00, type: 'debit', date: '2025-10-13T10:00:00Z', category: 'Food' },
  { id: '2', merchant: 'Salary Deposit', amount: 75000.00, type: 'credit', date: '2025-10-01T09:00:00Z', category: 'Salary' },
  { id: '3', merchant: 'IndiGo', amount: 8500.00, type: 'debit', date: '2025-10-11T15:30:00Z', category: 'Travel' },
  { id: '4', merchant: 'Airtel Bill', amount: 1199.00, type: 'debit', date: '2025-10-05T12:00:00Z', category: 'Bills' },
  { id: '5', merchant: 'Myntra', amount: 2500.00, type: 'debit', date: '2025-10-08T20:15:00Z', category: 'Shopping' },
  { id: '6', merchant: 'PVR Cinemas', amount: 880.00, type: 'debit', date: '2025-10-04T18:45:00Z', category: 'Entertainment' },
  { id: '7', merchant: 'Upwork Payment', amount: 15000.00, type: 'credit', date: '2025-09-28T11:00:00Z', category: 'Salary' },
  { id: '8', merchant: 'Swiggy Instamart', amount: 720.50, type: 'debit', date: '2025-10-10T09:20:00Z', category: 'Food' },
  { id: '9', merchant: 'Electricity Bill', amount: 1850.00, type: 'debit', date: '2025-09-25T14:00:00Z', category: 'Bills' },
];

const categoryIcons: { [key in Transaction['category']]: React.ElementType } = {
  Food: Utensils,
  Travel: Plane,
  Bills: Receipt,
  Shopping: ShoppingBag,
  Entertainment: Clapperboard,
  Salary: Home, // Using Home as a placeholder for income
  Other: HelpCircle,
};

const TransactionsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const filteredTransactions = useMemo(() => {
    return mockTransactions
      .filter(t => {
        if (typeFilter === 'all') return true;
        return t.type === typeFilter;
      })
      .filter(t => {
        if (categoryFilter === 'all') return true;
        return t.category === categoryFilter;
      })
      .filter(t => 
        t.merchant.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [searchTerm, typeFilter, categoryFilter]);

  const spendingData = useMemo(() => {
    const spendingByCategory: { [key: string]: number } = {};
    mockTransactions
      .filter(t => t.type === 'debit')
      .forEach(t => {
        spendingByCategory[t.category] = (spendingByCategory[t.category] || 0) + t.amount;
      });
    return Object.entries(spendingByCategory).map(([name, amount]) => ({ name, amount }));
  }, [mockTransactions]);
  
  const totalSpent = spendingData.reduce((sum, item) => sum + item.amount, 0);
  const totalReceived = mockTransactions.filter(t => t.type === 'credit').reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="p-4 sm:p-8 rounded-lg min-h-screen relative overflow-hidden">
        {/* Animated background for Glassmorphism effect */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute w-96 h-96 bg-primary/30 rounded-full blur-3xl opacity-50 animate-pulse -top-10 -left-20"></div>
            <div className="absolute w-96 h-96 bg-accent/30 rounded-full blur-3xl opacity-50 animate-pulse -bottom-10 -right-20" style={{ animationDelay: '2s' }}></div>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Summary & Filters */}
        <div className="lg:col-span-1 space-y-8">
          <Card className="bg-slate-800/40 backdrop-blur-xl border-white/10 shadow-lg shadow-primary/10">
            <CardHeader>
              <CardTitle className="text-white text-2xl">Spending Summary</CardTitle>
              <CardDescription className="text-slate-400">Your spending by category this month.</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={spendingData} layout="vertical" margin={{ right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                  <XAxis type="number" stroke="#94a3b8" />
                  <YAxis type="category" dataKey="name" stroke="#94a3b8" width={80} />
                  <Tooltip cursor={{fill: '#47556950'}} contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569", textShadow: "0 0 5px hsl(var(--primary))" }}/>
                  <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-6 grid grid-cols-2 gap-4 text-center">
                  <div>
                      <p className="text-sm text-slate-400">Total Spent</p>
                      <p className="text-xl font-bold text-red-400 [text-shadow:0_0_8px_rgba(248,113,113,0.5)]">₹{totalSpent.toLocaleString('en-IN')}</p>
                  </div>
                   <div>
                      <p className="text-sm text-slate-400">Total Received</p>
                      <p className="text-xl font-bold text-green-400 [text-shadow:0_0_8px_rgba(74,222,128,0.5)]">₹{totalReceived.toLocaleString('en-IN')}</p>
                  </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/40 backdrop-blur-xl border-white/10 shadow-lg shadow-accent/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2"><SlidersHorizontal /> Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-slate-300 text-sm font-medium">Transaction Type</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full mt-2 bg-slate-700/50 border-slate-600 text-white focus:ring-accent/50 focus:border-accent/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="debit">Debit</SelectItem>
                    <SelectItem value="credit">Credit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-slate-300 text-sm font-medium">Category</label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full mt-2 bg-slate-700/50 border-slate-600 text-white focus:ring-accent/50 focus:border-accent/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {Object.keys(categoryIcons).map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Transaction List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search for transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-full bg-slate-800/40 backdrop-blur-lg border border-white/10 text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
            />
          </div>
          <ScrollArea className="h-[calc(100vh-220px)] lg:h-[75vh] pr-4">
            <div className="space-y-3">
              {filteredTransactions.map(t => {
                const Icon = t.type === 'debit' ? ArrowUpRight : ArrowDownLeft;
                const amountColor = t.type === 'debit' ? 'text-red-400' : 'text-green-400';
                const CategoryIcon = categoryIcons[t.category] || HelpCircle;
                return (
                  <Card key={t.id} className="bg-slate-800/40 backdrop-blur-xl border-white/10 flex items-center p-4 gap-4 transition-all hover:border-primary/50 hover:bg-slate-800/60 hover:shadow-lg hover:shadow-primary/20">
                     <div className="flex-shrink-0 bg-slate-700/50 text-slate-300 p-3 rounded-full">
                         <CategoryIcon className="w-6 h-6"/>
                     </div>
                     <div className="flex-grow overflow-hidden">
                        <p className="font-bold text-white truncate">{t.merchant}</p>
                        <p className="text-xs text-slate-400">{new Date(t.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                     </div>
                     <div className="text-right flex-shrink-0">
                         <p className={`font-bold text-lg ${amountColor} flex items-center justify-end gap-1`}>
                            <Icon className="w-4 h-4" />
                            ₹{t.amount.toLocaleString('en-IN')}
                         </p>
                         <Badge variant="secondary" className="mt-1 text-xs bg-slate-700/50 text-slate-200 border-slate-600">{t.category}</Badge>
                     </div>
                  </Card>
                );
              })}
              {filteredTransactions.length === 0 && (
                <div className="text-center py-16">
                    <p className="text-xl text-slate-300">No transactions found.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

export default TransactionsPage;
