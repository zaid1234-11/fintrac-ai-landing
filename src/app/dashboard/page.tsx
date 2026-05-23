"use client";

import { SavingsGoals } from "@/components/dashboard/SavingsGoals";
import { SpendingSummary } from "@/components/dashboard/SpendingSummary";
import { ChatInterface } from "@/components/dashboard/ChatInterface";
import { AIInsights } from "@/components/dashboard/AIInsights";
import { SMSSyncStatus } from "@/components/SMSSyncStatus";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Activity, TrendingUp, Shield, Zap } from "lucide-react";
import { useState, useEffect } from "react";

export default function DashboardOverview() {
  const [wellnessMetrics, setWellnessMetrics] = useState<any>(null);
  const [telemetry, setTelemetry] = useState<any>(null);
  const [showObservability, setShowObservability] = useState(false);

  useEffect(() => {
    // Fetch wellness metrics and telemetry
    const fetchMetrics = async () => {
      try {
        const [wellnessRes, telemetryRes] = await Promise.all([
          fetch('/api/behavioral-profile'),
          fetch('/api/telemetry'),
        ]);

        if (wellnessRes.ok) {
          const wellnessData = await wellnessRes.json();
          setWellnessMetrics(wellnessData);
        }

        if (telemetryRes.ok) {
          const telemetryData = await telemetryRes.json();
          setTelemetry(telemetryData);
        }
      } catch (error) {
        console.error('Error fetching metrics:', error);
      }
    };

    fetchMetrics();
  }, []);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
        <div className="xl:col-span-2">
          <SpendingSummary />
        </div>
        <div className="xl:col-span-2">
          <SavingsGoals />
        </div>
        <div className="md:col-span-2 xl:col-span-2">
          <AIInsights />
        </div>
      </div>

      {/* Behavioral Wellness Audit Card */}
      <div>
        <Card className="gpu-glass transform-gpu bg-slate-900/80 backdrop-blur-md border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Behavioral Wellness Audit
            </CardTitle>
          </CardHeader>
          <CardContent>
            {wellnessMetrics?.wellness_metrics ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Spending Stability</span>
                    <span className="text-sm text-muted-foreground">
                      {wellnessMetrics.wellness_metrics.spending_stability || 0}%
                    </span>
                  </div>
                  <Progress
                    value={wellnessMetrics.wellness_metrics.spending_stability || 0}
                    className="h-2"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Savings Consistency</span>
                    <span className="text-sm text-muted-foreground">
                      {wellnessMetrics.wellness_metrics.savings_consistency || 0}%
                    </span>
                  </div>
                  <Progress
                    value={wellnessMetrics.wellness_metrics.savings_consistency || 0}
                    className="h-2"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Impulse Pacing</span>
                    <span className="text-sm text-muted-foreground">
                      {wellnessMetrics.wellness_metrics.impulse_pacing || 0}%
                    </span>
                  </div>
                  <Progress
                    value={wellnessMetrics.wellness_metrics.impulse_pacing || 0}
                    className="h-2"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Subscription Buffer</span>
                    <span className="text-sm text-muted-foreground">
                      {wellnessMetrics.wellness_metrics.subscription_buffer || 0}%
                    </span>
                  </div>
                  <Progress
                    value={wellnessMetrics.wellness_metrics.subscription_buffer || 0}
                    className="h-2"
                  />
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Wellness metrics will appear after analyzing your transactions.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Observability Dashboard */}
      <div>
        <Card className="gpu-glass transform-gpu bg-slate-900/80 backdrop-blur-md border-white/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Observability Dashboard
              </CardTitle>
              <Badge
                variant="outline"
                className="cursor-pointer"
                onClick={() => setShowObservability(!showObservability)}
              >
                {showObservability ? 'Hide' : 'Show'}
              </Badge>
            </div>
          </CardHeader>
          {showObservability && (
            <CardContent>
              {telemetry?.metrics ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-primary/5 rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Classification Accuracy</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {telemetry.metrics.classification_accuracy?.metric_value || 0}%
                    </p>
                  </div>
                  <div className="p-4 bg-primary/5 rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">AI Fallback Rate</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {telemetry.metrics.ai_fallback_rate?.metric_value || 0}%
                    </p>
                  </div>
                  <div className="p-4 bg-primary/5 rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Active Corrections</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {telemetry.metrics.active_corrections?.metric_value || 0}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Telemetry data will appear after insights are generated.
                </p>
              )}
            </CardContent>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <SMSSyncStatus />
        </div>
        <div className="lg:col-span-3">
          <ChatInterface />
        </div>
      </div>
    </div>
  );
};
