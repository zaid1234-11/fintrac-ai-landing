'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  CartesianGrid,
  Cell,
} from 'recharts';
import { optimizeSavings } from '@/lib/ai/elasticSavingsEngine';
import { estimateBehavioralPain } from '@/lib/ai/behavioralPain';
import { generateCoachingFeedback } from '@/lib/ai/coachingEngine';
import {
  Flame,
  Scale,
  CalendarDays,
  LineChart as LucideLineChart,
  TrendingUp,
  BrainCircuit,
  PiggyBank,
  CheckCircle2,
} from 'lucide-react';

const CATEGORY_COLORS = {
  Shopping: '#8b5cf6',
  Dining: '#f59e0b',
  Uber: '#06b6d4',
  Entertainment: '#ec4899',
  Groceries: '#10b981',
  Bills: '#3b82f6',
};

export default function SavingsOptimizerPage() {
  const [targetSavings, setTargetSavings] = useState<number>(6000);
  const [frictions, setFrictions] = useState({
    Shopping: 0.25,
    Dining: 0.45,
    Uber: 0.75,
    Entertainment: 0.35,
    Groceries: 0.85,
    Bills: 0.95,
  });

  const initialSpends = {
    Shopping: 15000,
    Dining: 10000,
    Uber: 5000,
    Entertainment: 8000,
    Groceries: 12000,
    Bills: 18000,
  };

  // 1. Run Optimization Engine
  const optimizationInput = useMemo(() => {
    return {
      targetSavings,
      categories: Object.keys(initialSpends).map(name => ({
        name,
        monthlySpend: initialSpends[name as keyof typeof initialSpends],
        frictionScore: frictions[name as keyof typeof frictions],
      })),
    };
  }, [targetSavings, frictions]);

  const optimizationResult = useMemo(() => {
    return optimizeSavings(optimizationInput);
  }, [optimizationInput]);

  // 2. Map Data for Table (Savings Optimization Matrix)
  const matrixData = useMemo(() => {
    return optimizationResult.recommendations.map(r => {
      const f = frictions[r.category as keyof typeof frictions] || 0.5;
      const painResult = estimateBehavioralPain({
        category: r.category,
        reductionAmount: r.suggestedReduction,
        frictionScore: f,
      });
      return {
        category: r.category,
        spend: r.currentSpend,
        friction: f,
        cut: r.suggestedReduction,
        painScore: painResult.painScore,
        painLevel: painResult.painLevel,
        newBudget: r.newBudget,
      };
    });
  }, [optimizationResult, frictions]);

  // 3. Friction Heatmap Data
  const heatmapData = useMemo(() => {
    return Object.keys(frictions).map(name => ({
      category: name,
      Friction: frictions[name as keyof typeof frictions],
    }));
  }, [frictions]);

  // 4. Monthly Trend Data (Projections over 6 months)
  const trendData = useMemo(() => {
    const data = [];
    let cumulativeNoOptimization = 0;
    let cumulativeOptimization = 0;

    const monthlyPotential = targetSavings;

    for (let month = 1; month <= 6; month++) {
      cumulativeNoOptimization += monthlyPotential * 0.4; // User saving passively
      cumulativeOptimization += monthlyPotential; // Optimized saving rate

      data.push({
        name: `Month ${month}`,
        'Without Optimization': cumulativeNoOptimization,
        'Elastic Optimization': cumulativeOptimization,
      });
    }
    return data;
  }, [targetSavings]);

  // 5. Run Coach Feedback Engine
  const coachFeedback = useMemo(() => {
    const categoriesMap = Object.keys(initialSpends).reduce((acc, name) => {
      acc[name] = initialSpends[name as keyof typeof initialSpends];
      return acc;
    }, {} as Record<string, number>);

    return generateCoachingFeedback({
      spendingCategories: categoriesMap,
      frictionScores: frictions,
      savingsGoal: targetSavings,
      optimizationResults: optimizationResult,
    });
  }, [optimizationResult, frictions, targetSavings]);

  const totalMonthlySpend = Object.values(initialSpends).reduce((a, b) => a + b, 0);

  // Behavioral Cost Gauge calculations
  // Max behavioral cost is total Spend * 1.0 friction = total spend
  // Scaled gauge percentage: (behavioralCost / targetSavings) * 100
  const costPercent = useMemo(() => {
    if (targetSavings <= 0) return 0;
    return Math.min(100, (optimizationResult.behavioralCost / targetSavings) * 100);
  }, [optimizationResult.behavioralCost, targetSavings]);

  // Helper for pain level badge styling
  const getPainLevelColor = (level: string) => {
    switch (level) {
      case 'Easy':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'Moderate':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'Difficult':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'Extreme':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  const getHeatmapColor = (friction: number) => {
    if (friction < 0.4) return '#10b981'; // Green
    if (friction < 0.7) return '#f59e0b'; // Amber
    return '#ef4444'; // Red
  };

  return (
    <div className="space-y-6">
      
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">AI Savings Optimizer</h1>
        <p className="text-muted-foreground mt-1">
          Perform cognitive behavioral budget adjustments based on consumption friction models.
        </p>
      </div>

      {/* Inputs Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-3 gpu-glass bg-slate-900/80 border-white/10 relative z-10">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6 items-end justify-between">
              <div className="space-y-2 w-full md:w-1/3">
                <Label htmlFor="targetInput" className="text-sm font-semibold flex items-center gap-1.5 text-slate-200">
                  <PiggyBank className="h-4 w-4 text-primary" />
                  Monthly Savings Goal
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                  <Input
                    id="targetInput"
                    type="number"
                    value={targetSavings}
                    onChange={(e) => setTargetSavings(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="pl-8 bg-slate-950/50 border-white/10 text-lg font-bold text-slate-100"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-slate-300">
                <div className="px-4 py-3 bg-slate-950/40 rounded-lg border border-white/5">
                  <p className="text-xs text-muted-foreground">Original Outflow</p>
                  <span className="text-lg font-extrabold text-slate-100">₹{totalMonthlySpend.toLocaleString('en-IN')}</span>
                </div>
                <div className="px-4 py-3 bg-slate-950/40 rounded-lg border border-white/5">
                  <p className="text-xs text-muted-foreground">Optimized Budget</p>
                  <span className="text-lg font-extrabold text-primary">₹{(totalMonthlySpend - optimizationResult.totalSavings).toLocaleString('en-IN')}</span>
                </div>
                <div className="px-4 py-3 bg-slate-950/40 rounded-lg border border-white/5">
                  <p className="text-xs text-muted-foreground">Total Monthly Savings</p>
                  <span className="text-lg font-extrabold text-emerald-400">₹{optimizationResult.totalSavings.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Button/Info Card */}
        <Card className="gpu-glass bg-gradient-to-br from-primary/10 to-slate-900 border-white/10 flex flex-col justify-center relative z-10">
          <CardContent className="pt-6 text-center space-y-2">
            <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
            <h3 className="text-sm font-bold">Algorithm Healthy</h3>
            <p className="text-xs text-muted-foreground">Elasticity ratios are balanced against latest transaction histories.</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Heatmap + Gauge + Predictor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 1. Friction Heatmap */}
        <Card className="gpu-glass bg-slate-900/80 border-white/10 relative z-10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <Flame className="h-5 w-5 text-amber-500" />
              Behavioral Friction Heatmap
            </CardTitle>
            <CardDescription>
              Friction value limits where cuts are applied.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={heatmapData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                <XAxis type="number" hide domain={[0, 1]} />
                <YAxis dataKey="category" type="category" stroke="#94a3b8" fontSize={11} tickLine={false} width={80} />
                <Tooltip formatter={(value) => [`${value}`, 'Friction']} />
                <Bar dataKey="Friction" radius={[0, 4, 4, 0]} barSize={12}>
                  {heatmapData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getHeatmapColor(entry.Friction)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 3. Behavioral Cost Gauge */}
        <Card className="gpu-glass bg-slate-900/80 border-white/10 relative z-10 flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <Scale className="h-5 w-5 text-primary" />
              Behavioral Cost Gauge
            </CardTitle>
            <CardDescription>
              Friction penalty incurred per rupee saved.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center relative">
            
            {/* Custom Semicircle SVG Gauge */}
            <div className="relative w-48 h-24 flex items-center justify-center overflow-hidden">
              <svg className="w-full h-full transform -rotate-180" viewBox="0 0 100 50">
                {/* Background Ring */}
                <path
                  d="M 10,50 A 40,40 0 0,1 90,50"
                  fill="none"
                  stroke="#ffffff0d"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
                {/* Colored Progress Ring */}
                <path
                  d="M 10,50 A 40,40 0 0,1 90,50"
                  fill="none"
                  stroke="url(#gaugeGradient)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray="125.6"
                  strokeDashoffset={125.6 - (125.6 * costPercent) / 100}
                  className="transition-all duration-1000 ease-out"
                />
                <defs>
                  <linearGradient id="gaugeGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="50%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#ef4444" />
                  </linearGradient>
                </defs>
              </svg>
              {/* Inner Value Display */}
              <div className="absolute bottom-0 text-center">
                <span className="text-2xl font-extrabold text-slate-100">
                  {optimizationResult.behavioralCost.toFixed(0)}
                </span>
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Friction Units</p>
              </div>
            </div>

            <div className="text-center mt-3 text-xs text-muted-foreground px-4">
              {costPercent < 40 ? (
                <span className="text-emerald-400 font-semibold">Low Discomfort Plan</span>
              ) : costPercent < 70 ? (
                <span className="text-amber-400 font-semibold">Moderate Adjustment Plan</span>
              ) : (
                <span className="text-rose-400 font-semibold">High Friction Plan</span>
              )}
              {` (Friction ratio: ${(optimizationResult.behavioralCost / (targetSavings || 1)).toFixed(2)})`}
            </div>
          </CardContent>
        </Card>

        {/* 4. Goal Achievement Predictor */}
        <Card className="gpu-glass bg-slate-900/80 border-white/10 relative z-10 flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <CalendarDays className="h-5 w-5 text-emerald-400" />
              Goal Predictor
            </CardTitle>
            <CardDescription>
              Timeframes to reach savings milestones.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>₹50,000 Milestone</span>
                <span className="font-bold text-slate-100">
                  {targetSavings > 0 ? `${(50000 / targetSavings).toFixed(1)} Months` : 'Infinite'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>₹1,00,000 Milestone</span>
                <span className="font-bold text-slate-100">
                  {targetSavings > 0 ? `${(100000 / targetSavings).toFixed(1)} Months` : 'Infinite'}
                </span>
              </div>
            </div>
            <div className="p-3 bg-slate-950/40 rounded-lg border border-white/5 text-xs text-slate-300">
              <p className="font-bold mb-1 flex items-center gap-1">
                <BrainCircuit className="h-3.5 w-3.5 text-primary" />
                Adaptive Forecast
              </p>
              Based on your low behavioral friction rating, your completion probability is **{(100 - costPercent * 0.4).toFixed(0)}%**.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. Savings Optimization Matrix Table */}
      <Card className="gpu-glass bg-slate-900/80 border-white/10 relative z-10">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            Savings Optimization Matrix
          </CardTitle>
          <CardDescription>
            Detailed analysis of spent, friction levels, suggested cuts, and emotional pain indices.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="bg-slate-950/30">
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Current Spend</TableHead>
                <TableHead className="text-center">Friction Score</TableHead>
                <TableHead className="text-right">Suggested Cut</TableHead>
                <TableHead className="text-center">Pain Score</TableHead>
                <TableHead className="text-center">Pain Level</TableHead>
                <TableHead className="text-right">New Budget</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matrixData.map((row) => (
                <TableRow key={row.category} className="hover:bg-slate-800/20">
                  <TableCell className="font-bold flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: CATEGORY_COLORS[row.category as keyof typeof CATEGORY_COLORS] }}
                    />
                    {row.category}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ₹{row.spend.toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-mono text-xs px-2 py-0.5 bg-slate-950/50 rounded border border-white/5">
                      {row.friction.toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-bold text-rose-400">
                    -₹{row.cut.toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell className="text-center font-bold text-slate-200">
                    {row.painScore.toFixed(0)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className={`text-xs border ${getPainLevelColor(row.painLevel)}`}>
                      {row.painLevel}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-bold text-emerald-400">
                    ₹{row.newBudget.toLocaleString('en-IN')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 5. Monthly Trend Graph + Coach Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Trend Area Chart */}
        <Card className="lg:col-span-2 gpu-glass bg-slate-900/80 border-white/10 relative z-10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <LucideLineChart className="h-5 w-5 text-primary" />
              6-Month Savings Trend Projections
            </CardTitle>
            <CardDescription>
              Comparing standard saving behavior against AI-optimized friction tracking.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorOptimized" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorNoOptimized" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#475569" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#475569" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip formatter={(value) => `₹${value}`} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area
                  type="monotone"
                  dataKey="Elastic Optimization"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorOptimized)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="Without Optimization"
                  stroke="#64748b"
                  fillOpacity={1}
                  fill="url(#colorNoOptimized)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Coach Coaching Panel */}
        <Card className="gpu-glass bg-slate-900/80 border-white/10 relative z-10 flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <BrainCircuit className="h-5 w-5 text-yellow-400" />
              Behavioral Finance Coaching
            </CardTitle>
            <CardDescription>
              Supportive insights based on loss-aversion metrics.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs text-slate-200">
            <div>
              <h4 className="font-bold text-slate-100 mb-1">Coach Strategy</h4>
              <p className="leading-relaxed text-muted-foreground">
                {coachFeedback.personalizedExplanation}
              </p>
            </div>
            <div>
              <h4 className="font-bold text-slate-100 mb-1 flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                Why protected?
              </h4>
              <p className="leading-relaxed text-muted-foreground">
                We guarded categories with high friction scores to prevent budget fatigue and relapse.
              </p>
            </div>
            <div className="pt-2 border-t border-white/5">
              <h4 className="font-bold text-slate-100 mb-2">Immediate Steps</h4>
              <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                {coachFeedback.actionPlan.map((action, i) => (
                  <li key={i}>{action}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
