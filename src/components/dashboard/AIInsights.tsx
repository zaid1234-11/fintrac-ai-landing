import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb, ArrowRight } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTransactions } from "@/contexts/TransactionContext";


interface Insight {
  id: string;
  type: "warning" | "success" | "info";
  category: string;
  title: string;
  description: string;
  amount?: number;
  recommendation?: string;
}

export const AIInsights = () => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const navigate = useNavigate();
  const { transactions, lastUpdated } = useTransactions();

  // Calculate insights from real transaction data
  const generateInsights = useMemo(() => {
    // If no transactions, return empty
    if (transactions.length === 0) return [];

    // Get the most recent month with transactions
    const sortedTransactions = [...transactions].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    const latestDate = new Date(sortedTransactions[0].date);
    
    // Get current period transactions (last 30 days from latest transaction)
    const thirtyDaysAgo = new Date(latestDate);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const currentPeriodTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date >= thirtyDaysAgo && date <= latestDate && t.type === 'debit';
    });

    // Get previous period (31-60 days ago)
    const sixtyDaysAgo = new Date(latestDate);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    
    const previousPeriodTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date >= sixtyDaysAgo && date < thirtyDaysAgo && t.type === 'debit';
    });

    // Calculate spending by category
    const currentSpending: Record<string, number> = {};
    const previousSpending: Record<string, number> = {};

    currentPeriodTransactions.forEach(t => {
      currentSpending[t.category] = (currentSpending[t.category] || 0) + t.amount;
    });

    previousPeriodTransactions.forEach(t => {
      previousSpending[t.category] = (previousSpending[t.category] || 0) + t.amount;
    });

    const newInsights: Insight[] = [];

    // If we have current spending data
    if (Object.keys(currentSpending).length > 0) {
      // Check for overspending in each category
      Object.keys(currentSpending).forEach((category, index) => {
        const current = currentSpending[category];
        const previous = previousSpending[category] || 0;
        
        // Skip salary category
        if (category === 'Salary') return;
        
        if (previous > 0) {
          const percentChange = ((current - previous) / previous) * 100;

          if (percentChange > 20) {
            newInsights.push({
              id: `insight-${index}`,
              type: "warning",
              category,
              title: `Overspending on ${category}`,
              description: `You've spent ${percentChange.toFixed(1)}% more on ${category} compared to the previous period.`,
              amount: current - previous,
              recommendation: `Consider reducing ${category} expenses by ₹${((current - previous) * 0.3).toFixed(0)} to get back on track`
            });
          } else if (percentChange < -10) {
            newInsights.push({
              id: `insight-${index}`,
              type: "success",
              category,
              title: `Great savings on ${category}!`,
              description: `You've reduced ${category} spending by ${Math.abs(percentChange).toFixed(1)}% compared to the previous period.`,
              amount: current,
            });
          }
        } else {
          // New category spending
          newInsights.push({
            id: `insight-new-${index}`,
            type: "info",
            category,
            title: `New spending in ${category}`,
            description: `You've started spending in ${category} category this period.`,
            amount: current,
          });
        }
      });

      // Add general spending insight
      const totalCurrent = Object.values(currentSpending).reduce((sum, val) => sum + val, 0);
      const totalPrevious = Object.values(previousSpending).reduce((sum, val) => sum + val, 0);
      
      if (totalPrevious > 0) {
        const totalChange = ((totalCurrent - totalPrevious) / totalPrevious) * 100;
        
        if (totalChange > 10) {
          newInsights.push({
            id: 'total-spending',
            type: "warning",
            category: "Overall",
            title: "Increased Spending Detected",
            description: `Your total spending is up ${totalChange.toFixed(1)}% compared to the previous period.`,
            amount: totalCurrent - totalPrevious,
            recommendation: "Review your spending patterns and identify areas to cut back"
          });
        } else if (totalChange < -10) {
          newInsights.push({
            id: 'total-spending',
            type: "success",
            category: "Overall",
            title: "Excellent Budget Control",
            description: `You've reduced total spending by ${Math.abs(totalChange).toFixed(1)}% compared to the previous period!`,
            amount: totalCurrent,
          });
        }
      }

      // Check most expensive category
      const maxCategory = Object.entries(currentSpending).reduce((max, [cat, amt]) => 
        amt > max.amount ? { category: cat, amount: amt } : max
      , { category: '', amount: 0 });

      if (maxCategory.category && maxCategory.category !== 'Salary') {
        newInsights.push({
          id: 'max-category',
          type: "info",
          category: maxCategory.category,
          title: `Highest Spending: ${maxCategory.category}`,
          description: `${maxCategory.category} is your largest expense category, accounting for ${((maxCategory.amount / totalCurrent) * 100).toFixed(1)}% of your spending.`,
          amount: maxCategory.amount,
        });
      }
    }

    return newInsights;
  }, [transactions]);

  const analyzeSpending = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setInsights(generateInsights);
      setIsAnalyzing(false);
    }, 1500);
  };

  // Auto-analyze when transactions change
  useEffect(() => {
    analyzeSpending();
  }, [lastUpdated, generateInsights]);

  const getIcon = (type: string) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="h-5 w-5" style={{ color: '#f97316' }} />;
      case "success":
        return <TrendingUp className="h-5 w-5" style={{ color: '#22c55e' }} />;
      default:
        return <Lightbulb className="h-5 w-5" style={{ color: '#3b82f6' }} />;
    }
  };

  const getBadgeVariant = (type: string): "default" | "destructive" | "outline" => {
    switch (type) {
      case "warning":
        return "destructive";
      case "success":
        return "default";
      default:
        return "outline";
    }
  };

  return (
    <Card className="col-span-1">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg font-semibold">AI Spending Insights</CardTitle>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={analyzeSpending}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <>
              <Sparkles className="h-4 w-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Re-analyze
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights.length === 0 && !isAnalyzing && (
            <div className="text-center py-8 text-muted-foreground">
              <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No insights available yet. Add more transactions to get AI analysis.</p>
            </div>
          )}
          
          {isAnalyzing && (
            <div className="text-center py-8">
              <Sparkles className="h-12 w-12 mx-auto mb-4 text-primary animate-pulse" />
              <p className="text-muted-foreground">Analyzing your spending patterns...</p>
            </div>
          )}

          {insights.slice(0, 3).map((insight) => (
            <div 
              key={insight.id}
              className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {getIcon(insight.type)}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm">{insight.title}</h4>
                    <Badge variant={getBadgeVariant(insight.type)} className="text-xs">
                      {insight.category}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {insight.description}
                  </p>
                  {insight.amount && (
                    <p className="text-sm font-medium">
                      Amount: ₹{insight.amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </p>
                  )}
                  {insight.recommendation && (
                    <div className="mt-2 p-2 bg-primary/5 rounded border-l-2 border-primary">
                      <p className="text-xs text-muted-foreground flex items-start gap-2">
                        <Lightbulb className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <span>{insight.recommendation}</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {insights.length > 0 && (
            <Button 
              variant="outline" 
              className="w-full mt-4" 
              size="sm"
              onClick={() => navigate('/dashboard/ai-analysis')}
            >
              View Detailed Analysis
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
