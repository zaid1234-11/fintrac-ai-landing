"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useTransactions } from "@/contexts/TransactionContext";
import { useMemo } from "react";

export const SpendingSummary = () => {
  const { transactions } = useTransactions();

  const totalSpent = useMemo(() => {
    return transactions
      .filter((t) => t.type === "debit")
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const chartData = useMemo(() => {
    const categories: Record<string, number> = {};
    transactions
      .filter((t) => t.type === "debit")
      .forEach((t) => {
        categories[t.category] = (categories[t.category] || 0) + t.amount;
      });
    return Object.entries(categories).map(([category, amount]) => ({
      category,
      amount,
    }));
  }, [transactions]);

  return (
    <Card className="gpu-glass h-full transform-gpu bg-slate-900/80 backdrop-blur-md border-white/10 rounded-xl">
      <CardHeader>
        <CardTitle className="text-white">Spending This Month</CardTitle>
        <div className="space-y-1">
          <p className="text-3xl font-bold text-white tracking-tight truncate sm:whitespace-normal">
            ₹{totalSpent.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-[250px] flex items-center justify-center text-slate-400">
            No spending data this month.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            {/* Add margins to prevent labels from cutting off */}
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#475569" vertical={false} />
              
              <XAxis 
                dataKey="category" 
                stroke="#94a3b8" 
                fontSize={12}
                tickMargin={10}
                angle={-45} // Rotate long labels like "Payments" diagonally
                textAnchor="end" // Align them cleanly
                height={50} // Give the rotated text room to breathe
              />
              
              <YAxis 
                stroke="#94a3b8" 
                fontSize={12}
                tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value} // Compresses large numbers
              />
              
              <Tooltip
                cursor={{ fill: '#334155', opacity: 0.4 }}
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #475569",
                  borderRadius: "8px",
                  color: "#fff",
                }}
                formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, "Amount"]}
              />
              <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={50} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
