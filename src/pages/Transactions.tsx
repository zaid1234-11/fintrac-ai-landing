import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  SlidersHorizontal,
  Utensils,
  Plane,
  Receipt,
  ShoppingBag,
  Clapperboard,
  Home,
  HelpCircle,
  Plus,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTransactions } from "@/contexts/TransactionContext";
import { toast } from "sonner";
import { ReceiptScanner } from "@/components/ReceiptScanner";

const categoryIcons: { [key: string]: React.ElementType } = {
  Food: Utensils,
  Travel: Plane,
  Bills: Receipt,
  Shopping: ShoppingBag,
  Entertainment: Clapperboard,
  Salary: Home,
  Other: HelpCircle,
};

const TransactionsPage = () => {
  const { transactions, addTransaction } = useTransactions();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "debit" | "credit">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    merchant: "",
    amount: "",
    type: "debit" as "debit" | "credit",
    category: "Food" as any,
    date: new Date().toISOString().split('T')[0],
  });

  const handleAddTransaction = () => {
    if (!formData.merchant || !formData.amount) {
      toast.error("Please fill all required fields");
      return;
    }

    addTransaction({
      merchant: formData.merchant,
      amount: parseFloat(formData.amount),
      type: formData.type,
      category: formData.category,
      date: new Date(formData.date).toISOString(),
    });

    toast.success("Transaction added successfully!");
    setIsAddDialogOpen(false);
    
    // Reset form
    setFormData({
      merchant: "",
      amount: "",
      type: "debit",
      category: "Food",
      date: new Date().toISOString().split('T')[0],
    });
  };

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((t) => {
        if (typeFilter !== "all") return t.type === typeFilter;
        return true;
      })
      .filter((t) => {
        if (categoryFilter !== "all") return t.category === categoryFilter;
        return true;
      })
      .filter((t) => t.merchant.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, searchTerm, typeFilter, categoryFilter]);

  const spendingData = useMemo(() => {
    const spendingByCategory: { [key: string]: number } = {};
    transactions
      .filter((t) => t.type === "debit")
      .forEach((t) => {
        spendingByCategory[t.category] = (spendingByCategory[t.category] || 0) + t.amount;
      });
    return Object.entries(spendingByCategory).map(([name, amount]) => ({ name, amount }));
  }, [transactions]);

  const totalSpent = spendingData.reduce((sum, item) => sum + item.amount, 0);
  const totalReceived = transactions.filter((t) => t.type === "credit").reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="p-4 sm:p-8 rounded-lg min-h-screen relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute w-96 h-96 bg-primary/30 rounded-full blur-3xl opacity-50 animate-pulse -top-10 -left-20"></div>
        <div className="absolute w-96 h-96 bg-accent/30 rounded-full blur-3xl opacity-50 animate-pulse -bottom-10 -right-20" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Summary + Filters */}
        <div className="lg:col-span-1 space-y-8">
          {/* Spending Summary Graph */}
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
                  <Tooltip
                    cursor={{ fill: '#47556950' }}
                    contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }}
                  />
                  <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-6 grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-sm text-slate-400">Total Spent</p>
                  <p className="text-xl font-bold text-red-400">₹{totalSpent.toLocaleString("en-IN")}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Total Received</p>
                  <p className="text-xl font-bold text-green-400">₹{totalReceived.toLocaleString("en-IN")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <Card className="bg-slate-800/40 backdrop-blur-xl border-white/10 shadow-lg shadow-accent/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <SlidersHorizontal /> Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-slate-300 text-sm font-medium">Transaction Type</label>
                <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
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
                    {Object.keys(categoryIcons).map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Transaction List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search Bar + Buttons */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                type="text"
                placeholder="Search for transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-full bg-slate-800/40 backdrop-blur-lg border border-white/10 text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
              />
            </div>

            {/* Receipt Scanner Button */}
            <ReceiptScanner />

            {/* Add Transaction Button */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-full px-6">
                  <Plus className="h-5 w-5 mr-2" />
                  Add
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Transaction</DialogTitle>
                  <DialogDescription>Enter the transaction details below</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="merchant">Merchant Name *</Label>
                    <Input
                      id="merchant"
                      placeholder="e.g., Zomato, Amazon, Salary"
                      value={formData.merchant}
                      onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="amount">Amount (₹) *</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="type">Transaction Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: "debit" | "credit") => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="debit">Debit (Expense)</SelectItem>
                        <SelectItem value="credit">Credit (Income)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value: any) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(categoryIcons).map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button className="flex-1" onClick={handleAddTransaction}>
                    Add Transaction
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Transaction List */}
          <ScrollArea className="h-[calc(100vh-220px)] lg:h-[75vh] pr-4">
            <div className="space-y-3">
              {filteredTransactions.map((t) => {
                const Icon = t.type === "debit" ? ArrowUpRight : ArrowDownLeft;
                const amountColor = t.type === "debit" ? "text-red-400" : "text-green-400";
                const CategoryIcon = categoryIcons[t.category] || HelpCircle;

                return (
                  <Card
                    key={t.id}
                    className="bg-slate-800/40 backdrop-blur-xl border-white/10 flex items-center p-4 gap-4 transition-all hover:border-primary/50 hover:bg-slate-800/60 hover:shadow-lg hover:shadow-primary/20"
                  >
                    <div className="flex-shrink-0 bg-slate-700/50 text-slate-300 p-3 rounded-full">
                      <CategoryIcon className="w-6 h-6" />
                    </div>
                    <div className="flex-grow overflow-hidden">
                      <p className="font-bold text-white truncate">{t.merchant}</p>
                      <p className="text-xs text-slate-400">
                        {new Date(t.date).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`font-bold text-lg ${amountColor} flex items-center justify-end gap-1`}>
                        <Icon className="w-4 h-4" />₹{t.amount.toLocaleString("en-IN")}
                      </p>
                      <Badge variant="secondary" className="mt-1 text-xs bg-slate-700/50 text-slate-200 border-slate-600">
                        {t.category}
                      </Badge>
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
