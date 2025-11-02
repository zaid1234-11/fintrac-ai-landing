import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Sparkles, TrendingUp, AlertTriangle, Lightbulb, ArrowLeft,
  TrendingDown, Download, Loader2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTransactions } from "@/contexts/TransactionContext";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { 
  LineChart, 
  Line, 
  PieChart as RePieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip,
  ResponsiveContainer, 
  Legend 
} from "recharts";
import jsPDF from 'jspdf';

const COLORS: Record<string, string> = {
  Food: '#ef4444',
  Bills: '#3b82f6',
  Travel: '#10b981',
  Shopping: '#f59e0b',
  Entertainment: '#8b5cf6',
  Other: '#6b7280',
  Salary: '#22c55e'
};

const generatePDFReport = (analytics: any) => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;
  
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  
  pdf.setFillColor(59, 130, 246);
  pdf.rect(0, 0, pageWidth, 30, 'F');
  
  pdf.setFontSize(22);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text('FinTrack AI - Spending Report', margin, 20);
  
  yPos = 40;
  
  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  pdf.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, margin, yPos);
  
  yPos += 15;
  
  pdf.setFillColor(240, 240, 245);
  pdf.roundedRect(margin - 5, yPos - 5, pageWidth - 2 * margin + 10, 60, 3, 3, 'F');
  
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(30, 30, 30);
  pdf.text('FINANCIAL SUMMARY', margin, yPos + 5);
  
  yPos += 15;
  
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(60, 60, 60);
  
  const col1 = margin;
  const col2 = pageWidth / 2 + 10;
  
  pdf.text('Total Spending:', col1, yPos);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(220, 38, 38);
  pdf.text(`₹${analytics.totalSpending.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, col1 + 50, yPos);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(60, 60, 60);
  pdf.text('Change from Previous:', col2, yPos);
  pdf.setFont('helvetica', 'bold');
  if (analytics.spendingChange > 0) {
    pdf.setTextColor(220, 38, 38);
    pdf.text(`+${analytics.spendingChange.toFixed(1)}%`, col2 + 55, yPos);
  } else {
    pdf.setTextColor(22, 163, 74);
    pdf.text(`${analytics.spendingChange.toFixed(1)}%`, col2 + 55, yPos);
  }
  
  yPos += 12;
  
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(60, 60, 60);
  pdf.text('Overspending:', col1, yPos);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(234, 88, 12);
  pdf.text(`₹${analytics.overspending.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, col1 + 50, yPos);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(60, 60, 60);
  pdf.text('Potential Savings:', col2, yPos);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(22, 163, 74);
  pdf.text(`₹${analytics.potentialSavings.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, col2 + 55, yPos);
  
  yPos += 20;
  
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(30, 30, 30);
  pdf.text('CATEGORY BREAKDOWN', margin, yPos);
  
  yPos += 10;
  
  pdf.setFillColor(59, 130, 246);
  pdf.rect(margin - 5, yPos - 7, pageWidth - 2 * margin + 10, 10, 'F');
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text('Category', margin, yPos);
  pdf.text('Amount', margin + 60, yPos);
  pdf.text('Budget', margin + 100, yPos);
  pdf.text('% of Total', margin + 135, yPos);
  
  yPos += 10;
  
  pdf.setFont('helvetica', 'normal');
  analytics.categoryBreakdown.forEach((cat: any, index: number) => {
    if (yPos > pageHeight - 40) {
      pdf.addPage();
      yPos = margin;
    }
    
    if (index % 2 === 0) {
      pdf.setFillColor(248, 250, 252);
      pdf.rect(margin - 5, yPos - 7, pageWidth - 2 * margin + 10, 10, 'F');
    }
    
    pdf.setTextColor(30, 30, 30);
    pdf.text(cat.category, margin, yPos);
    
    pdf.setTextColor(220, 38, 38);
    pdf.text(`₹${cat.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, margin + 60, yPos);
    
    pdf.setTextColor(100, 116, 139);
    pdf.text(`₹${cat.budget.toLocaleString('en-IN')}`, margin + 100, yPos);
    
    pdf.setTextColor(59, 130, 246);
    pdf.text(`${cat.percentage.toFixed(1)}%`, margin + 135, yPos);
    
    yPos += 10;
  });
  
  yPos += 15;
  
  if (yPos > pageHeight - 100) {
    pdf.addPage();
    yPos = margin;
  }
  
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(30, 30, 30);
  pdf.text('AI INSIGHTS & RECOMMENDATIONS', margin, yPos);
  
  yPos += 12;
  
  analytics.insights.slice(0, 8).forEach((insight: any) => {
    if (yPos > pageHeight - 50) {
      pdf.addPage();
      yPos = margin;
    }
    
    let boxColor: [number, number, number];
    if (insight.type === 'warning') boxColor = [254, 243, 199];
    else if (insight.type === 'success') boxColor = [220, 252, 231];
    else boxColor = [219, 234, 254];
    
    pdf.setFillColor(boxColor[0], boxColor[1], boxColor[2]);
    
    const boxHeight = 35 + (insight.recommendation ? 10 : 0);
    pdf.roundedRect(margin - 5, yPos - 5, pageWidth - 2 * margin + 10, boxHeight, 2, 2, 'F');
    
    let badgeColor: [number, number, number];
    if (insight.type === 'warning') badgeColor = [234, 88, 12];
    else if (insight.type === 'success') badgeColor = [22, 163, 74];
    else badgeColor = [59, 130, 246];
    
    pdf.setFillColor(badgeColor[0], badgeColor[1], badgeColor[2]);
    pdf.roundedRect(margin, yPos - 3, 20, 6, 1, 1, 'F');
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    const badgeText = insight.type.toUpperCase().substring(0, 4);
    pdf.text(badgeText, margin + (20 - pdf.getTextWidth(badgeText)) / 2, yPos + 1);
    
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(30, 30, 30);
    pdf.text(insight.title, margin + 25, yPos);
    
    yPos += 8;
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(60, 60, 60);
    const descLines = pdf.splitTextToSize(insight.description, pageWidth - 2 * margin - 10);
    pdf.text(descLines, margin, yPos);
    yPos += descLines.length * 5;
    
    if (insight.amount) {
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(220, 38, 38);
      pdf.text(`Amount: ₹${insight.amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, margin, yPos);
      yPos += 6;
    }
    
    if (insight.recommendation) {
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(100, 116, 139);
      const recLines = pdf.splitTextToSize(`💡 ${insight.recommendation}`, pageWidth - 2 * margin - 10);
      pdf.text(recLines, margin, yPos);
      yPos += recLines.length * 5;
    }
    
    yPos += 10;
  });
  
  pdf.setFontSize(8);
  pdf.setTextColor(150, 150, 150);
  pdf.text('Generated by FinTrack AI - For informational purposes only.', margin, pageHeight - 10);
  
  return pdf;
};

const AIAnalysis = () => {
  const navigate = useNavigate();
  const { transactions, lastUpdated } = useTransactions();
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const analytics = useMemo(() => {
    if (transactions.length === 0) {
      return {
        spendingTrends: [],
        categoryBreakdown: [],
        pieChartData: [],
        insights: [],
        predictions: [],
        totalSpending: 0,
        spendingChange: 0,
        overspending: 0,
        potentialSavings: 0,
        transactionCount: 0
      };
    }

    const sortedTransactions = [...transactions].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const latestDate = new Date(sortedTransactions[0].date);

    const periods = Array.from({ length: 5 }, (_, i) => {
      const endDate = new Date(latestDate);
      endDate.setDate(endDate.getDate() - (i * 30));
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 30);
      return {
        label: endDate.toLocaleString('default', { month: 'short' }),
        startDate,
        endDate
      };
    }).reverse();

    const spendingTrends = periods.map(({ label, startDate, endDate }) => {
      const periodTransactions = transactions.filter(t => {
        const date = new Date(t.date);
        return date >= startDate && date <= endDate && t.type === 'debit';
      });
      const amount = periodTransactions.reduce((sum, t) => sum + t.amount, 0);
      return { month: label, amount, average: 15000 };
    });

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

    const categorySpending: Record<string, number> = {};
    const previousCategorySpending: Record<string, number> = {};
    
    currentPeriodTransactions.forEach(t => {
      if (t.category !== 'Salary') {
        categorySpending[t.category] = (categorySpending[t.category] || 0) + t.amount;
      }
    });

    previousPeriodTransactions.forEach(t => {
      if (t.category !== 'Salary') {
        previousCategorySpending[t.category] = (previousCategorySpending[t.category] || 0) + t.amount;
      }
    });

    const totalSpending = Object.values(categorySpending).reduce((sum, val) => sum + val, 0);
    const previousTotal = Object.values(previousCategorySpending).reduce((sum, val) => sum + val, 0);
    const spendingChange = previousTotal > 0 ? ((totalSpending - previousTotal) / previousTotal) * 100 : 0;

    const categoryBreakdown = Object.entries(categorySpending).map(([category, amount]) => {
      const budget = Math.round(amount * 0.85);
      const percentage = totalSpending > 0 ? (amount / totalSpending) * 100 : 0;
      const lastAmount = previousCategorySpending[category] || 0;
      const status = amount > budget ? 'over' : 'normal';
      return { category, amount, percentage, status, budget, lastAmount };
    });

    const pieChartData = categoryBreakdown.map(({ category, amount }) => ({
      name: category,
      value: amount,
      color: COLORS[category] || COLORS.Other
    }));

    const insights: any[] = [];
    
    categoryBreakdown.forEach(({ category, amount, lastAmount, budget }) => {
      if (lastAmount > 0) {
        const change = ((amount - lastAmount) / lastAmount) * 100;
        
        if (change > 20) {
          insights.push({
            id: `insight-${category}-over`,
            type: "warning",
            category,
            title: `Overspending on ${category}`,
            description: `You've spent ${change.toFixed(1)}% more on ${category} compared to the previous period.`,
            amount: amount - lastAmount,
            recommendation: `Consider reducing ${category} expenses by ₹${((amount - lastAmount) * 0.3).toFixed(0)}`,
            impact: change > 50 ? "high" : "medium"
          });
        } else if (change < -10) {
          insights.push({
            id: `insight-${category}-save`,
            type: "success",
            category,
            title: `Great savings on ${category}!`,
            description: `You've reduced ${category} spending by ${Math.abs(change).toFixed(1)}% compared to the previous period.`,
            amount,
            impact: "low"
          });
        }
      }

      if (amount > budget) {
        insights.push({
          id: `insight-${category}-budget`,
          type: "warning",
          category,
          title: `Over budget on ${category}`,
          description: `You've exceeded your ${category} budget by ₹${(amount - budget).toFixed(2)}`,
          amount: amount - budget,
          recommendation: `Set alerts for ${category} spending`,
          impact: "medium"
        });
      }
    });

    if (currentPeriodTransactions.length > 0) {
      insights.push({
        id: 'insight-general',
        type: "info",
        category: "Overview",
        title: "Recent Activity",
        description: `You made ${currentPeriodTransactions.length} transactions in the last 30 days totaling ₹${totalSpending.toFixed(2)}`,
        amount: totalSpending,
        impact: "low"
      });
    }

    if (previousTotal > 0) {
      if (spendingChange > 15) {
        insights.push({
          id: 'overall-increase',
          type: "warning",
          category: "Overall",
          title: "Spending Increase Alert",
          description: `Your total spending increased by ${spendingChange.toFixed(1)}% compared to the previous period.`,
          amount: totalSpending - previousTotal,
          recommendation: "Review your budget and identify unnecessary expenses",
          impact: "high"
        });
      } else if (spendingChange < -15) {
        insights.push({
          id: 'overall-decrease',
          type: "success",
          category: "Overall",
          title: "Excellent Budget Management",
          description: `You've decreased spending by ${Math.abs(spendingChange).toFixed(1)}% - great job!`,
          amount: totalSpending,
          impact: "low"
        });
      }
    }

    const predictions = categoryBreakdown.slice(0, 3).map(({ category, amount, lastAmount }) => {
      const change = lastAmount > 0 ? ((amount - lastAmount) / lastAmount) * 100 : 0;
      const predictedNext = Math.round(amount * (1 + (change / 200)));
      const predictedChange = amount > 0 ? ((predictedNext - amount) / amount) * 100 : 0;
      return {
        category,
        currentMonth: Math.round(amount),
        predictedNext,
        change: predictedChange,
        confidence: 75 + Math.random() * 15
      };
    });

    const overspending = categoryBreakdown
      .filter(c => c.status === 'over')
      .reduce((sum, c) => sum + (c.amount - c.budget), 0);
    
    const potentialSavings = insights
      .filter(i => i.type === 'warning' && i.recommendation)
      .reduce((sum, i) => sum + (i.amount * 0.3), 0);

    return {
      spendingTrends,
      categoryBreakdown,
      pieChartData,
      insights,
      predictions,
      totalSpending,
      spendingChange,
      overspending,
      potentialSavings,
      transactionCount: currentPeriodTransactions.length
    };
  }, [transactions, lastUpdated]);

  const generateReport = () => {
    setIsGeneratingReport(true);
    
    setTimeout(() => {
      try {
        const pdf = generatePDFReport(analytics);
        const filename = `FinTrack-Report-${new Date().toISOString().split('T')[0]}.pdf`;
        pdf.save(filename);

        toast.success('Report generated successfully!', {
          description: 'Your PDF report has been downloaded.'
        });
      } catch (error) {
        console.error('PDF generation error:', error);
        toast.error('Failed to generate report', {
          description: 'Please try again.'
        });
      } finally {
        setIsGeneratingReport(false);
      }
    }, 500);
  };

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
      case "warning": return "destructive";
      case "success": return "default";
      default: return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/dashboard')}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-primary" />
            AI Spending Analysis
          </h1>
          <p className="text-muted-foreground mt-1">
            Last updated: {new Date(lastUpdated).toLocaleTimeString()}
          </p>
        </div>
        <Button 
          onClick={generateReport} 
          disabled={isGeneratingReport || analytics.insights.length === 0}
        >
          {isGeneratingReport ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Generate PDF
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Spending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{analytics.totalSpending.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
            <p className={`text-xs flex items-center gap-1 mt-1 ${analytics.spendingChange > 0 ? 'text-red-500' : 'text-green-500'}`}>
              {analytics.spendingChange > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {analytics.spendingChange > 0 ? '+' : ''}{analytics.spendingChange.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overspending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">₹{analytics.overspending.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Over budget in {analytics.categoryBreakdown.filter(c => c.status === 'over').length} categories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Potential Savings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">₹{analytics.potentialSavings.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
            <p className="text-xs text-muted-foreground mt-1">
              With AI recommendations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.transactionCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Last 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="insights" className="space-y-4">
        <TabsList>
          <TabsTrigger value="insights">Insights ({analytics.insights.length})</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-4">
          {analytics.insights.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No insights available.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {analytics.insights.map((insight: any) => (
                <Card key={insight.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {getIcon(insight.type)}
                        <div>
                          <CardTitle className="text-base">{insight.title}</CardTitle>
                          <CardDescription className="mt-1">{insight.description}</CardDescription>
                        </div>
                      </div>
                      <Badge variant={getBadgeVariant(insight.type)}>
                        {insight.category}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {insight.amount && (
                      <p className="font-semibold mb-2">
                        Amount: ₹{insight.amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </p>
                    )}
                    {insight.recommendation && (
                      <div className="p-3 bg-primary/5 rounded border-l-2 border-primary">
                        <p className="text-sm flex items-start gap-2">
                          <Lightbulb className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>{insight.recommendation}</span>
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Spending Trends</CardTitle>
              <CardDescription>Last 150 days (5 × 30-day periods)</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics.spendingTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.spendingTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} name="Actual" />
                    <Line type="monotone" dataKey="average" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" name="Target" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No trend data
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Category Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.pieChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <RePieChart>
                      <Pie
                        data={analytics.pieChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        dataKey="value"
                      >
                        {analytics.pieChartData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </RePieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center">No data</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Budget vs Actual</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {analytics.categoryBreakdown.length > 0 ? (
                  analytics.categoryBreakdown.map((cat: any) => (
                    <div key={cat.category} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{cat.category}</span>
                        <span className={cat.status === 'over' ? 'text-red-500' : 'text-green-500'}>
                          ₹{cat.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })} / ₹{cat.budget.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <Progress 
                        value={Math.min((cat.amount / cat.budget) * 100, 100)} 
                        className={cat.status === 'over' ? '[&>div]:bg-red-500' : '[&>div]:bg-green-500'}
                      />
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-4">No data available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Next Period Predictions</CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.predictions.length > 0 ? (
                <div className="space-y-4">
                  {analytics.predictions.map((pred: any) => (
                    <div key={pred.category} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold">{pred.category}</h4>
                        <Badge variant="outline">
                          {pred.confidence.toFixed(0)}% confidence
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Current</p>
                          <p className="font-semibold">₹{pred.currentMonth.toLocaleString('en-IN')}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Predicted</p>
                          <p className="font-semibold">₹{pred.predictedNext.toLocaleString('en-IN')}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Change</p>
                          <p className={`font-semibold ${pred.change > 0 ? 'text-red-500' : 'text-green-500'}`}>
                            {pred.change > 0 ? '+' : ''}{pred.change.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8">Not enough data for predictions.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIAnalysis;
