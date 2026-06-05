'use client';

import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { optimizeSavings } from '@/lib/ai/elasticSavingsEngine';
import { estimateBehavioralPain } from '@/lib/ai/behavioralPain';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Sparkles, DollarSign, BrainCircuit, Activity } from 'lucide-react';

const CATEGORY_COLORS = {
  Shopping: '#8b5cf6',      // Violet
  Dining: '#f59e0b',        // Amber
  Uber: '#06b6d4',          // Cyan
  Entertainment: '#ec4899', // Pink
};

export function FrictionSimulator() {
  const [targetSavings, setTargetSavings] = useState<number>(5000);
  const [frictions, setFrictions] = useState({
    Shopping: 0.3,
    Dining: 0.5,
    Uber: 0.7,
    Entertainment: 0.4,
  });

  const initialSpends = {
    Shopping: 12000,
    Dining: 8000,
    Uber: 4000,
    Entertainment: 6000,
  };

  // Run the Elastic Savings Algorithm
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

  // Map data for Current Spend Pie Chart
  const currentSpendData = useMemo(() => {
    return optimizationResult.recommendations.map(r => ({
      name: r.category,
      value: r.currentSpend,
    }));
  }, [optimizationResult]);

  // Map data for Recommended Budget Pie Chart
  const recommendedBudgetData = useMemo(() => {
    return optimizationResult.recommendations.map(r => ({
      name: r.category,
      value: r.newBudget,
    }));
  }, [optimizationResult]);

  // Map data for Behavioral Pain Bar Chart
  const painData = useMemo(() => {
    return optimizationResult.recommendations.map(r => {
      const painResult = estimateBehavioralPain({
        category: r.category,
        reductionAmount: r.suggestedReduction,
        frictionScore: frictions[r.category as keyof typeof frictions],
      });
      return {
        category: r.category,
        'Pain Score': painResult.painScore,
        painLevel: painResult.painLevel,
      };
    });
  }, [optimizationResult, frictions]);

  // Map data for Savings Allocation Bar Chart
  const allocationData = useMemo(() => {
    return optimizationResult.recommendations.map(r => ({
      category: r.category,
      'Current Spend': r.currentSpend,
      'Suggested Cut': r.suggestedReduction,
      'New Budget': r.newBudget,
    }));
  }, [optimizationResult]);

  // Dynamic recommendation text generator
  const recommendationText = useMemo(() => {
    const activeCuts = optimizationResult.recommendations
      .filter(r => r.suggestedReduction > 0)
      .sort((a, b) => b.suggestedReduction - a.suggestedReduction);

    if (activeCuts.length === 0) {
      return 'Your AI recommends keeping budgets as-is. Set a positive savings target to see optimized cut allocations.';
    }

    const cutDetails = activeCuts.map(
      r => `₹${r.suggestedReduction.toLocaleString('en-IN')} from ${r.category}`
    );

    if (cutDetails.length === 1) {
      return `Your AI recommends cutting ${cutDetails[0]} because it has the lowest behavioral friction.`;
    }

    const last = cutDetails.pop();
    return `Your AI recommends cutting ${cutDetails.join(', ')} and ${last} because they have the lowest behavioral friction.`;
  }, [optimizationResult]);

  const handleSliderChange = (category: keyof typeof frictions, value: number[]) => {
    setFrictions(prev => ({
      ...prev,
      [category]: value[0],
    }));
  };

  const handleSavingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setTargetSavings(isNaN(val) ? 0 : val);
  };

  return (
    <div className="space-y-6">
      {/* Control Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Input Parameters Card */}
        <Card className="lg:col-span-2 gpu-glass bg-slate-900/80 backdrop-blur-md border-white/10 relative z-10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <BrainCircuit className="h-6 w-6 text-primary animate-pulse" />
              Elastic Optimizer Controls
            </CardTitle>
            <CardDescription>
              Adjust Category Friction and Target Savings to see the allocation model shift live.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Target Savings Input */}
            <div className="space-y-2">
              <Label htmlFor="targetSavings" className="text-sm font-semibold flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 text-primary" />
                Target Savings Goal (₹)
              </Label>
              <Input
                id="targetSavings"
                type="number"
                value={targetSavings === 0 ? '' : targetSavings}
                onChange={handleSavingsChange}
                placeholder="Enter savings goal (e.g. 5000)"
                className="bg-slate-950/50 border-white/10"
              />
            </div>

            {/* Friction Sliders */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Category Friction Scores</h3>
              {Object.keys(frictions).map((catName) => {
                const key = catName as keyof typeof frictions;
                const score = frictions[key];
                const color = CATEGORY_COLORS[key];
                
                return (
                  <div key={key} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                        {key}
                      </span>
                      <span className="font-mono text-xs px-2 py-0.5 bg-slate-800 rounded border border-white/5">
                        Friction: {score.toFixed(2)}
                      </span>
                    </div>
                    <Slider
                      value={[score]}
                      onValueChange={(val) => handleSliderChange(key, val)}
                      min={0}
                      max={1}
                      step={0.05}
                      className="py-2"
                    />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Live Recommendation Output Card */}
        <Card className="gpu-glass bg-gradient-to-br from-primary/10 to-slate-900 border-white/10 flex flex-col justify-between relative z-10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <Sparkles className="h-6 w-6 text-yellow-400" />
              AI Recommendation
            </CardTitle>
            <CardDescription>
              Dynamic insights matching the lowest behavioral friction.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-white/5 shadow-inner">
              <p className="text-base text-slate-100 leading-relaxed font-medium">
                "{recommendationText}"
              </p>
            </div>
          </CardContent>
          <div className="p-6 pt-0 border-t border-white/5 mt-auto flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Activity className="h-3 w-3 text-emerald-400" />
              Calculations: 64-bit Elasticity Loop
            </span>
            <span>Cost: {optimizationResult.behavioralCost.toLocaleString('en-IN')} units</span>
          </div>
        </Card>
      </div>

      {/* Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* A & B: Spend vs Budget Pie Charts */}
        <Card className="gpu-glass bg-slate-900/80 backdrop-blur-md border-white/10 relative z-10">
          <CardHeader>
            <CardTitle>Spending Redistribution Comparison</CardTitle>
            <CardDescription>
              Current Spending vs Recommended Budget post-allocation.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80 grid grid-cols-2">
            
            {/* Current Spend Pie Chart */}
            <div className="flex flex-col items-center justify-center h-full relative">
              <span className="absolute top-0 text-xs font-bold uppercase text-muted-foreground">Current Spending</span>
              <ResponsiveContainer width="100%" height="85%">
                <PieChart>
                  <Pie
                    data={currentSpendData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {currentSpendData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name as keyof typeof CATEGORY_COLORS]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value) => `₹${value}`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="text-center mt-2">
                <span className="text-lg font-extrabold text-slate-100">₹30,000</span>
                <p className="text-[10px] text-muted-foreground uppercase">Total Outflow</p>
              </div>
            </div>

            {/* Recommended Budget Pie Chart */}
            <div className="flex flex-col items-center justify-center h-full relative">
              <span className="absolute top-0 text-xs font-bold uppercase text-muted-foreground">Recommended Budget</span>
              <ResponsiveContainer width="100%" height="85%">
                <PieChart>
                  <Pie
                    data={recommendedBudgetData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {recommendedBudgetData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name as keyof typeof CATEGORY_COLORS]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value) => `₹${value}`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="text-center mt-2">
                <span className="text-lg font-extrabold text-primary">₹{(30000 - optimizationResult.totalSavings).toLocaleString('en-IN')}</span>
                <p className="text-[10px] text-muted-foreground uppercase">Total Budget</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* D: Savings Allocation Bar Chart */}
        <Card className="gpu-glass bg-slate-900/80 backdrop-blur-md border-white/10 relative z-10">
          <CardHeader>
            <CardTitle>Budget Redistribution Details</CardTitle>
            <CardDescription>
              Comparison of current spend, proposed cuts, and remaining budget per category.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={allocationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" />
                <XAxis dataKey="category" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <RechartsTooltip formatter={(value) => `₹${value}`} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Current Spend" fill="#475569" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Suggested Cut" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="New Budget" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* C: Behavioral Pain Bar Chart */}
        <Card className="lg:col-span-2 gpu-glass bg-slate-900/80 backdrop-blur-md border-white/10 relative z-10">
          <CardHeader>
            <CardTitle>Behavioral Discomfort Score (Pain Index)</CardTitle>
            <CardDescription>
              Visualizes psychological pain level: Pain = Suggested Cut * Friction Score.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={painData} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis dataKey="category" type="category" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <RechartsTooltip formatter={(value, name, props) => [`${value} (Level: ${props.payload.painLevel})`, 'Pain Score']} />
                <Bar 
                  dataKey="Pain Score" 
                  fill="#f43f5e" 
                  radius={[0, 4, 4, 0]}
                  barSize={18}
                >
                  {painData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.category as keyof typeof CATEGORY_COLORS]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
