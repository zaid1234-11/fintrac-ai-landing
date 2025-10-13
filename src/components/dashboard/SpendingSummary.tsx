import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { category: "Food", amount: 12500 },
  { category: "Bills", amount: 18000 },
  { category: "Travel", amount: 8500 },
  { category: "Shopping", amount: 6670.5 },
];

export const SpendingSummary = () => {
  return (
    <Card className="bg-slate-800 border-slate-700 rounded-xl">
      <CardHeader>
        <CardTitle className="text-white">Spending This Month</CardTitle>
        <div className="space-y-1">
          <p className="text-3xl font-bold text-white">₹45,670.50</p>
          <p className="text-sm text-green-500">+5.2% from last month</p>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
            <XAxis dataKey="category" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "1px solid #475569",
                borderRadius: "8px",
                color: "#fff",
              }}
            />
            <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
