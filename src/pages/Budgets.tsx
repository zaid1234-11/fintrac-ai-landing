import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Trash2,
  Edit,
  DollarSign,
  PieChart,
} from "lucide-react";
import { useBudgets } from "@/contexts/BudgetContext";
import { useTransactions } from "@/contexts/TransactionContext";
import { toast } from "sonner";

const Budgets = () => {
  const { budgets, addBudget, updateBudget, deleteBudget, getTotalBudget } = useBudgets();
  const { transactions } = useTransactions();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    category: "Food",
    amount: "",
    period: "monthly" as "monthly" | "weekly" | "yearly",
    color: "#f59e0b",
  });

  const budgetsWithSpent = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return budgets.map(budget => {
      const categoryTransactions = transactions.filter(
        t => t.category === budget.category && 
             t.type === 'debit' &&
             new Date(t.date) >= startOfMonth
      );
      
      const spent = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
      return { ...budget, spent };
    });
  }, [budgets, transactions]);

  const handleAddBudget = () => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (editingBudget) {
      updateBudget(editingBudget, {
        category: formData.category,
        amount: parseFloat(formData.amount),
        period: formData.period,
        color: formData.color,
      });
      toast.success("Budget updated successfully!");
      setEditingBudget(null);
    } else {
      addBudget({
        category: formData.category,
        amount: parseFloat(formData.amount),
        period: formData.period,
        color: formData.color,
        icon: 'DollarSign',
      });
      toast.success("Budget added successfully!");
    }

    setFormData({
      category: "Food",
      amount: "",
      period: "monthly",
      color: "#f59e0b",
    });
    setIsAddDialogOpen(false);
  };

  const handleEdit = (budget: any) => {
    setEditingBudget(budget.id);
    setFormData({
      category: budget.category,
      amount: budget.amount.toString(),
      period: budget.period,
      color: budget.color,
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this budget?")) {
      deleteBudget(id);
      toast.success("Budget deleted");
    }
  };

  const totalBudget = getTotalBudget();
  const totalSpent = budgetsWithSpent.reduce((sum, b) => sum + b.spent, 0);
  const totalPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const overBudgetCount = budgetsWithSpent.filter(b => b.spent > b.amount).length;
  const warningCount = budgetsWithSpent.filter(b => {
    const percentage = (b.spent / b.amount) * 100;
    return percentage >= 80 && percentage < 100;
  }).length;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Budget Management</h1>
          <p className="text-muted-foreground mt-1">
            Track your spending limits and stay on budget
          </p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button aria-label="Add new budget">
              <Plus className="h-4 w-4 mr-2" />
              Add Budget
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingBudget ? 'Edit Budget' : 'Add New Budget'}</DialogTitle>
              <DialogDescription>
                Set a spending limit for a category
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Food">Food</SelectItem>
                    <SelectItem value="Shopping">Shopping</SelectItem>
                    <SelectItem value="Travel">Travel</SelectItem>
                    <SelectItem value="Bills">Bills</SelectItem>
                    <SelectItem value="Entertainment">Entertainment</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="amount">Budget Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="10000"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="period">Period</Label>
                <Select
                  value={formData.period}
                  onValueChange={(value: any) => setFormData({ ...formData, period: value })}
                >
                  <SelectTrigger id="period">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="color">Color</Label>
                <div className="flex gap-2" role="group" aria-label="Budget color selection">
                  {['#f59e0b', '#8b5cf6', '#06b6d4', '#10b981', '#ef4444', '#ec4899'].map((color, index) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 ${
                        formData.color === color ? 'border-primary' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData({ ...formData, color })}
                      aria-label={`Select color option ${index + 1}`}
                      title={`Select color option ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setIsAddDialogOpen(false);
                  setEditingBudget(null);
                }}
                aria-label="Cancel budget operation"
              >
                Cancel
              </Button>
              <Button 
                className="flex-1" 
                onClick={handleAddBudget}
                aria-label={editingBudget ? 'Update budget' : 'Add new budget'}
              >
                {editingBudget ? 'Update' : 'Add'} Budget
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Budget</p>
                <p className="text-2xl font-bold">₹{totalBudget.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-full">
                <TrendingDown className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Spent</p>
                <p className="text-2xl font-bold">₹{totalSpent.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Remaining</p>
                <p className="text-2xl font-bold">₹{(totalBudget - totalSpent).toLocaleString('en-IN')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 rounded-full">
                <AlertCircle className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Alerts</p>
                <p className="text-2xl font-bold">{overBudgetCount + warningCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Budget Progress</CardTitle>
          <CardDescription>Your total spending vs budget this month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>₹{totalSpent.toLocaleString('en-IN')} spent</span>
              <span>₹{totalBudget.toLocaleString('en-IN')} budget</span>
            </div>
            <Progress value={totalPercentage} className="h-3" />
            <p className="text-sm text-muted-foreground">
              {totalPercentage.toFixed(1)}% of total budget used
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Budget List */}
      <div className="grid gap-4 md:grid-cols-2">
        {budgetsWithSpent.map(budget => {
          const percentage = budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0;
          const isOverBudget = percentage > 100;
          const isWarning = percentage >= 80 && percentage < 100;
          
          return (
            <Card key={budget.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${budget.color}20` }}
                    >
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: budget.color }} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{budget.category}</CardTitle>
                      <CardDescription className="capitalize">{budget.period}</CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleEdit(budget)}
                      aria-label={`Edit ${budget.category} budget`}
                      title={`Edit ${budget.category} budget`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(budget.id)}
                      aria-label={`Delete ${budget.category} budget`}
                      title={`Delete ${budget.category} budget`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-2xl font-bold">
                    ₹{budget.spent.toLocaleString('en-IN')}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    of ₹{budget.amount.toLocaleString('en-IN')}
                  </span>
                </div>
                
                <Progress
                  value={Math.min(percentage, 100)}
                  className="h-2"
                />
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {percentage.toFixed(1)}% used
                  </span>
                  {isOverBudget && (
                    <Badge variant="destructive" className="text-xs">
                      Over Budget
                    </Badge>
                  )}
                  {isWarning && !isOverBudget && (
                    <Badge variant="outline" className="text-xs border-amber-500 text-amber-600">
                      Warning
                    </Badge>
                  )}
                  {percentage < 80 && (
                    <Badge variant="outline" className="text-xs border-green-500 text-green-600">
                      On Track
                    </Badge>
                  )}
                </div>
                
                <p className="text-sm text-muted-foreground">
                  ₹{(budget.amount - budget.spent).toLocaleString('en-IN')} remaining
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {budgets.length === 0 && (
        <Card>
          <CardContent className="py-16 text-center">
            <PieChart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Budgets Yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first budget to start tracking your spending limits
            </p>
            <Button 
              onClick={() => setIsAddDialogOpen(true)}
              aria-label="Create your first budget"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Budget
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Budgets;
