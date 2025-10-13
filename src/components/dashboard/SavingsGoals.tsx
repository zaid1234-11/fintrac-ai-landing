import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Plus } from "lucide-react";

const goals = [
  {
    title: "New Laptop",
    current: 60000,
    target: 120000,
  },
  {
    title: "Vacation Fund",
    current: 35000,
    target: 80000,
  },
];

export const SavingsGoals = () => {
  return (
    <Card className="bg-slate-800 border-slate-700 rounded-xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white">Savings Goals</CardTitle>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Add Goal
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {goals.map((goal) => {
          const percentage = (goal.current / goal.target) * 100;
          return (
            <div key={goal.title} className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-white">{goal.title}</h3>
                <span className="text-sm text-slate-400">
                  ₹{goal.current.toLocaleString()} / ₹{goal.target.toLocaleString()}
                </span>
              </div>
              <Progress value={percentage} className="h-2" />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
