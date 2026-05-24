"use client";

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
  Activity,
  Fuel,
  BookOpen,
  Wallet,
  TrendingUp,
  Send,
  ArrowLeftRight,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTransactions } from "@/contexts/TransactionContext";
import { toast } from "sonner";
import { ReceiptScanner } from "@/components/ReceiptScanner";
import { TransactionUpload } from "@/components/dashboard/TransactionUpload";

const categoryIcons: { [key: string]: React.ElementType } = {
  Food: Utensils,
  Travel: Plane,
  Shopping: ShoppingBag,
  Groceries: ShoppingBag,
  Bills: Receipt,
  Recharge: Send,
  Entertainment: Clapperboard,
  Health: Activity,
  Fuel: Fuel,
  Education: BookOpen,
  Rent: Home,
  Salary: Wallet,
  Investment: TrendingUp,
  Transfer: ArrowLeftRight,
  Other: HelpCircle,
};

const TransactionsPage = () => {
  const { transactions, addTransaction, refreshTransactions, correctTransactionCategory } = useTransactions();
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

  const handleCategoryChange = async (transactionId: string, newCategory: string) => {
    console.log(`Updating transaction ${transactionId} to ${newCategory}`);
    try {
      await correctTransactionCategory(transactionId, newCategory);
      toast.success("Category updated and engine retrained!");
    } catch (error) {
      console.error("Error updating category:", error);
      toast.error("Failed to update category");
    }
  };

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
          {/* Ingest Bank Statement */}
          <TransactionUpload onUploadSuccess={refreshTransactions} />

          {/* Spending Summary Graph */}
          <Card className="gpu-glass transform-gpu bg-slate-800/40 backdrop-blur-xl border-white/10 shadow-lg shadow-primary/10">
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
          <Card className="gpu-glass transform-gpu bg-slate-800/40 backdrop-blur-xl border-white/10 shadow-lg shadow-accent/10">
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
                className="gpu-glass transform-gpu w-full pl-12 pr-4 py-3 rounded-full bg-slate-800/40 backdrop-blur-lg border border-white/10 text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
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
          <Card className="bg-slate-900/80 border-slate-800 rounded-xl overflow-hidden flex flex-col">
            <CardContent className="p-0 overflow-x-auto overflow-y-auto h-[calc(100vh-220px)] lg:h-[75vh]">
              <Table className="w-full">
                <TableHeader className="bg-slate-950/50">
                  <TableRow className="border-slate-800 hover:bg-transparent">
                    <TableHead className="w-[100px]">Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-[140px]">Category</TableHead>
                    <TableHead className="text-right w-[100px]">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => {
                    const Icon = transaction.type === "debit" ? ArrowUpRight : ArrowDownLeft;
                    const amountColor = transaction.type === "debit" ? "text-red-400" : "text-green-400";
                    const CategoryIcon = categoryIcons[transaction.category] || HelpCircle;

                    return (
                      <TableRow key={transaction.id} className="border-slate-800">
                        {/* Classic Date Font */}
                        <TableCell className="font-serif text-slate-300 whitespace-nowrap">
                          {new Date(transaction.date).toLocaleDateString()}
                        </TableCell>
                        
                        {/* Truncated Description to prevent horizontal scroll */}
                        <TableCell className="font-medium text-white max-w-[150px] sm:max-w-[300px] truncate" title={transaction.merchant}>
                          {transaction.merchant}
                        </TableCell>
                        
                        {/* Editable Category Dropdown */}
                        <TableCell>
                          <Select 
                            defaultValue={transaction.category} 
                            onValueChange={(value) => handleCategoryChange(transaction.id, value)}
                          >
                            <SelectTrigger className="h-8 w-[130px] text-xs bg-slate-900 border-slate-700">
                              <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-700">
                              {Object.keys(categoryIcons).map((cat) => (
                                <SelectItem key={cat} value={cat} className="text-xs">
                                  {cat}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        
                        {/* Amount */}
                        <TableCell className={`text-right font-medium whitespace-nowrap ${
                          transaction.type === "credit" ? "text-emerald-400" : "text-white"
                        }`}>
                          {transaction.type === "credit" ? "+" : "-"}₹{transaction.amount.toLocaleString("en-IN")}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {filteredTransactions.length === 0 && (
                <div className="text-center py-16">
                  <p className="text-xl text-slate-300">No transactions found.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TransactionsPage;
