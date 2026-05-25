"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb, ArrowRight, HelpCircle } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTransactions } from "@/contexts/TransactionContext";
import { InsightExplainabilityModal } from "./InsightExplainabilityModal";

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
  const [selectedInsightId, setSelectedInsightId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();
  const { transactions, lastUpdated } = useTransactions();

  // Calculate insights from real transaction data (fallback local heuristics)
  const generateInsights = useMemo(() => {
    if (transactions.length === 0) return [];

    const sortedTransactions = [...transactions].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    const latestDate = new Date(sortedTransactions[0].date);
    
    const thirtyDaysAgo = new Date(latestDate);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const currentPeriodTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date >= thirtyDaysAgo && date <= latestDate && t.type === 'debit';
    });

    const sixtyDaysAgo = new Date(latestDate);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    
    const previousPeriodTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date >= sixtyDaysAgo && date < thirtyDaysAgo && t.type === 'debit';
    });

    const currentSpending: Record<string, number> = {};
    const previousSpending: Record<string, number> = {};

    currentPeriodTransactions.forEach(t => {
      currentSpending[t.category] = (currentSpending[t.category] || 0) + t.amount;
    });

    previousPeriodTransactions.forEach(t => {
      previousSpending[t.category] = (previousSpending[t.category] || 0) + t.amount;
    });

    const newInsights: Insight[] = [];

    if (Object.keys(currentSpending).length > 0) {
      Object.keys(currentSpending).forEach((category, index) => {
        const current = currentSpending[category];
        const previous = previousSpending[category] || 0;
        
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

  const analyzeSpending = async () => {
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/insights');
      if (!res.ok) throw new Error('Failed to fetch insights');
      const data = await res.json();
      
      if (data && data.length > 0) {
        const mapped = data.map((t: any) => {
          let uiType: 'warning' | 'success' | 'info' = 'info';
          if (t.type === 'anomaly') uiType = 'warning';
          else if (t.type === 'recommendation') uiType = 'success';

          return {
            id: t.id,
            type: uiType,
            category: t.type.replace('_', ' ').toUpperCase(),
            title: t.title,
            description: t.description,
            amount: t.metrics?.total || t.metrics?.salarySum || t.metrics?.currentTotal || undefined,
            recommendation: t.type === 'recommendation' ? t.description : undefined
          };
        });
        setInsights(mapped);
      } else {
        setInsights(generateInsights);
      }
    } catch (e) {
      console.error('[AIInsights] Error loading DB insights:', e);
      setInsights(generateInsights);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    analyzeSpending();
  }, [lastUpdated]);

  useEffect(() => {
    const handleInsightsUpdate = () => {
      console.log('AIInsights: Refreshing insights from Realtime event...');
      analyzeSpending();
    };

    window.addEventListener("fintrac:insights-updated", handleInsightsUpdate);
    return () => {
      window.removeEventListener("fintrac:insights-updated", handleInsightsUpdate);
    };
  }, []);

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

  const handleExplainClick = (insightId: string) => {
    setSelectedInsightId(insightId);
    setIsModalOpen(true);
  };

  return (
    <Card className="gpu-glass h-full transform-gpu bg-slate-900/80 backdrop-blur-md border-white/10">
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
          className="min-h-11 px-3 py-2.5 sm:px-4 sm:py-2"
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
              className="gpu-glass transform-gpu p-4 border rounded-lg bg-slate-950/30 backdrop-blur-md hover:bg-accent/50 transition-colors"
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
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 min-h-11 px-3 py-2.5 sm:px-4 sm:py-2 text-xs text-muted-foreground hover:text-primary"
                    onClick={() => handleExplainClick(insight.id)}
                  >
                    <HelpCircle className="h-3 w-3 mr-1" />
                    Why this claim?
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {insights.length > 0 && (
            <Button
              variant="outline"
              className="w-full mt-4 min-h-11 px-3 py-2.5 sm:px-4 sm:py-2"
              size="sm"
              onClick={() => router.push('/dashboard/ai-analysis')}
            >
              View Detailed Analysis
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </CardContent>

      <InsightExplainabilityModal
        insightId={selectedInsightId}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onRefresh={analyzeSpending}
      />
    </Card>
  );
};
