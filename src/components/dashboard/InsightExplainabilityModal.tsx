"use client";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sparkles, AlertCircle, CheckCircle, XCircle, EyeOff } from "lucide-react";

interface SourceTransaction {
  id: string;
  amount: number;
  type: string;
  date: string;
  merchant_name: string;
  description: string;
  categories: { name: string };
}

interface ExplanationData {
  trigger_reason: string;
  recurrence_signals: Record<string, any>;
  source_transactions: SourceTransaction[];
}

interface InsightExplainabilityModalProps {
  insightId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const InsightExplainabilityModal = ({
  insightId,
  open,
  onOpenChange,
}: InsightExplainabilityModalProps) => {
  const [explanation, setExplanation] = useState<ExplanationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (insightId && open) {
      fetchExplanation();
    }
  }, [insightId, open]);

  const fetchExplanation = async () => {
    if (!insightId) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/insights/explain?insight_id=${insightId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch explanation');
      }
      const data = await response.json();
      setExplanation(data.explanation);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (feedback: string) => {
    // TODO: Implement feedback submission to track user corrections
    console.log('Feedback submitted:', feedback);
    // For now, just close the modal
    onOpenChange(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gpu-glass max-w-3xl max-h-[80vh] overflow-y-auto transform-gpu border-white/10 bg-gradient-to-br from-slate-50/95 to-slate-100/95 backdrop-blur-md dark:from-slate-900/90 dark:to-slate-800/90">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Why this claim?
          </DialogTitle>
          <DialogDescription>
            Understand the reasoning behind this AI-generated insight
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Sparkles className="h-8 w-8 text-primary animate-pulse" />
            <span className="ml-2 text-muted-foreground">Loading explanation...</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <span className="text-destructive">{error}</span>
          </div>
        )}

        {explanation && !loading && !error && (
          <div className="space-y-6">
            {/* Trigger Reason */}
            <div className="gpu-glass transform-gpu p-4 bg-white/90 dark:bg-slate-800/80 backdrop-blur-md rounded-lg border shadow-sm">
              <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-primary" />
                Trigger Reason
              </h3>
              <p className="text-sm text-muted-foreground">{explanation.trigger_reason}</p>
            </div>

            {/* Recurrence Signals */}
            {Object.keys(explanation.recurrence_signals).length > 0 && (
              <div className="gpu-glass transform-gpu p-4 bg-white/90 dark:bg-slate-800/80 backdrop-blur-md rounded-lg border shadow-sm">
                <h3 className="font-semibold text-sm mb-3">Mathematical Parameters</h3>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(explanation.recurrence_signals).map(([key, value]) => (
                    <div key={key} className="space-y-1">
                      <p className="text-xs text-muted-foreground capitalize">
                        {key.replace(/_/g, ' ')}
                      </p>
                      <p className="text-sm font-medium">
                        {typeof value === 'number' ? value.toFixed(2) : String(value)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Source Transactions */}
            {explanation.source_transactions && explanation.source_transactions.length > 0 && (
              <div className="gpu-glass transform-gpu p-4 bg-white/90 dark:bg-slate-800/80 backdrop-blur-md rounded-lg border shadow-sm">
                <h3 className="font-semibold text-sm mb-3">Source Transactions</h3>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {explanation.source_transactions.map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell className="text-sm">{formatDate(tx.date)}</TableCell>
                          <TableCell className="text-sm">
                            {tx.merchant_name || tx.description || 'Unknown'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {tx.categories?.name || 'Other'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ₹{tx.amount.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleFeedback('helpful')}
            className="min-h-11 w-full"
          >
            <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
            Helpful
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleFeedback('unhelpful')}
            className="min-h-11 w-full"
          >
            <XCircle className="h-4 w-4 mr-2 text-red-500" />
            Unhelpful
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleFeedback('correct_category')}
            className="min-h-11 w-full"
          >
            <Sparkles className="h-4 w-4 mr-2 text-blue-500" />
            Correct Category
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleFeedback('hide_alert')}
            className="min-h-11 w-full"
          >
            <EyeOff className="h-4 w-4 mr-2 text-gray-500" />
            Hide Alert
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
