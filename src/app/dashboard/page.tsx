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
import { useAuth } from "@clerk/nextjs";
import { createClient } from "@/lib/supabase/client";

export default function DashboardOverview() {
  const [wellnessMetrics, setWellnessMetrics] = useState<any>(null);
  const [telemetry, setTelemetry] = useState<any>(null);
  const [showObservability, setShowObservability] = useState(false);
  const { getToken } = useAuth();

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

  useEffect(() => {
    fetchMetrics();
  }, []);

  // Set up Supabase Realtime subscriptions for async updates
  useEffect(() => {
    let profilesChannel: any = null;
    let insightsChannel: any = null;
    let supabase: any = null;

    const setupRealtime = async () => {
      try {
        const token = await getToken({ template: 'supabase' });
        supabase = createClient();

        if (token) {
          await supabase.auth.setSession({
            access_token: token,
            refresh_token: '',
          });
        }

        // Subscribe to behavioral_profiles updates
        profilesChannel = supabase
          .channel('behavioral_profiles_changes')
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'behavioral_profiles',
            },
            (payload: any) => {
              console.log('Realtime profile update:', payload);
              fetchMetrics();
            }
          )
          .subscribe();

        // Subscribe to ai_insights updates
        insightsChannel = supabase
          .channel('ai_insights_changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'ai_insights',
            },
            (payload: any) => {
              console.log('Realtime insights change:', payload);
              window.dispatchEvent(new Event("fintrac:insights-updated"));
            }
          )
          .subscribe();

      } catch (err) {
        console.error('[DashboardOverview Realtime] Failed to subscribe:', err);
      }
    };

    setupRealtime();

    return () => {
      if (supabase) {
        if (profilesChannel) supabase.removeChannel(profilesChannel);
        if (insightsChannel) supabase.removeChannel(insightsChannel);
      }
    };
  }, [getToken]);

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:gap-6 md:grid-cols-2 xl:grid-cols-6">
        {/* SpendingSummary (Anomaly Cards/Spending) */}
        <div className="order-1 xl:col-span-2">
          <SpendingSummary />
        </div>

        {/* SavingsGoals */}
        <div className="order-4 md:order-2 xl:col-span-2">
          <SavingsGoals />
        </div>

        {/* AIInsights (Behavioral Timeline) */}
        <div className="order-2 md:order-3 md:col-span-2 xl:col-span-2">
          <AIInsights />
        </div>

        {/* Behavioral Wellness Audit Card */}
        <div className="order-5 md:order-4 md:col-span-2 xl:col-span-6">
          <Card className="gpu-glass transform-gpu bg-slate-900/80 backdrop-blur-md border-white/10">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Activity className="h-5 w-5 text-primary" />
                Behavioral Wellness Audit
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
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
        <div className="order-6 md:order-5 md:col-span-2 xl:col-span-6">
          <Card className="gpu-glass transform-gpu bg-slate-900/80 backdrop-blur-md border-white/10">
            <CardHeader className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Shield className="h-5 w-5 text-primary" />
                  Observability Dashboard
                </CardTitle>
                <Badge
                  variant="outline"
                  className="cursor-pointer min-h-11 sm:min-h-0 flex items-center justify-center px-3"
                  onClick={() => setShowObservability(!showObservability)}
                >
                  {showObservability ? 'Hide' : 'Show'}
                </Badge>
              </div>
            </CardHeader>
            {showObservability && (
              <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
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

        {/* SMSSyncStatus */}
        <div className="order-7 md:order-6 md:col-span-2 xl:col-span-2">
          <SMSSyncStatus />
        </div>

        {/* ChatInterface (AI Copilot Feed) */}
        <div className="order-3 md:order-7 md:col-span-2 xl:col-span-4">
          <ChatInterface />
        </div>
      </div>
    </div>
  );
};
