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
import { toast } from "sonner";

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
  onRefresh?: () => void;
}

const MASTER_CATEGORIES = [
  "Food", "Travel", "Shopping", "Groceries", "Bills", "Recharge",
  "Entertainment", "Medical", "Investment", "Salary", "Rent",
  "Transfer", "Taxes", "Insurance", "Other"
];

export const InsightExplainabilityModal = ({
  insightId,
  open,
  onOpenChange,
  onRefresh,
}: InsightExplainabilityModalProps) => {
  const [explanation, setExplanation] = useState<ExplanationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCorrectionForm, setShowCorrectionForm] = useState(false);
  const [correctionMerchant, setCorrectionMerchant] = useState("");
  const [correctionCategory, setCorrectionCategory] = useState("Food");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  useEffect(() => {
    if (insightId && open) {
      fetchExplanation();
      setShowCorrectionForm(false);
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

  const handleFeedback = async (action: 'helpful' | 'unhelpful' | 'hide' | 'correct_merchant', correctionData?: any) => {
    if (!insightId) return;
    
    setSubmittingFeedback(true);
    try {
      const payload: any = {
        insight_id: insightId,
        action: action
      };
      
      if (action === 'helpful' || action === 'unhelpful') {
        payload.action = 'feedback';
        payload.feedback_value = action;
      } else if (action === 'hide') {
        payload.action = 'hide';
      } else if (action === 'correct_merchant') {
        payload.action = 'correct_merchant';
        payload.correction_data = correctionData;
      }

      const response = await fetch('/api/insights/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit feedback');
      }

      toast.success(
        action === 'helpful' 
          ? "Thank you for your feedback!" 
          : action === 'correct_merchant' 
          ? "Correction submitted and trained successfully." 
          : "Insight updated."
      );
      
      onOpenChange(false);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Feedback submission failed');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const startCorrection = () => {
    setShowCorrectionForm(true);
    const firstTxMerchant = explanation?.source_transactions?.[0]?.merchant_name;
    const inferredMerchant = explanation?.recurrence_signals?.merchant || firstTxMerchant || "";
    setCorrectionMerchant(inferredMerchant);
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
      <DialogContent className="gpu-glass max-w-3xl max-h-[85vh] overflow-y-auto transform-gpu border-white/10 bg-slate-900/95 backdrop-blur-md text-white shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Sparkles className="h-5 w-5 text-primary" />
            Why this claim?
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Understand the mathematical reasoning and source transactions behind this AI insight.
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Sparkles className="h-8 w-8 text-primary animate-pulse" />
            <span className="text-slate-400 text-sm">Parsing audit trace...</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
            <span className="text-red-400 text-sm">{error}</span>
          </div>
        )}

        {explanation && !loading && !error && (
          <div className="space-y-6">
            {/* Trigger Reason */}
            <div className="gpu-glass transform-gpu p-4 bg-slate-950/40 backdrop-blur-md rounded-xl border border-white/5 shadow-sm">
              <h3 className="font-semibold text-sm mb-2 text-slate-200 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-primary" />
                Trigger Criteria
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">{explanation.trigger_reason}</p>
            </div>

            {/* Recurrence Signals */}
            {Object.keys(explanation.recurrence_signals || {}).length > 0 && (
              <div className="gpu-glass transform-gpu p-4 bg-slate-950/40 backdrop-blur-md rounded-xl border border-white/5 shadow-sm">
                <h3 className="font-semibold text-sm mb-3 text-slate-200">Mathematical Parameters</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {Object.entries(explanation.recurrence_signals).map(([key, value]) => (
                    <div key={key} className="space-y-1">
                      <p className="text-[10px] text-slate-400 font-mono uppercase">
                        {key.replace(/_/g, ' ')}
                      </p>
                      <p className="text-sm font-medium text-white">
                        {typeof value === 'number' ? value.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : String(value)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Source Transactions */}
            {explanation.source_transactions && explanation.source_transactions.length > 0 && (
              <div className="gpu-glass transform-gpu p-4 bg-slate-950/40 backdrop-blur-md rounded-xl border border-white/5 shadow-sm space-y-3">
                <h3 className="font-semibold text-sm text-slate-200">Source Transactions</h3>
                <div className="overflow-x-auto rounded-xl border border-white/10 bg-slate-950/20">
                  <Table>
                    <TableHeader className="bg-slate-950/50">
                      <TableRow className="border-b border-white/10">
                        <TableHead className="text-slate-400 text-xs">Date</TableHead>
                        <TableHead className="text-slate-400 text-xs">Merchant</TableHead>
                        <TableHead className="text-slate-400 text-xs">Category</TableHead>
                        <TableHead className="text-slate-400 text-xs text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {explanation.source_transactions.map((tx) => (
                        <TableRow key={tx.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                          <TableCell className="text-xs text-slate-300 font-mono">{formatDate(tx.date)}</TableCell>
                          <TableCell className="text-xs font-semibold text-white">
                            {tx.merchant_name || tx.description || 'Unknown'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px] bg-slate-900 border-white/10 text-slate-300 font-mono">
                              {tx.categories?.name || 'Other'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-right font-bold text-white font-mono">
                            ₹{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Category Correction Form */}
            {showCorrectionForm && (
              <div className="p-4 bg-slate-950/60 rounded-xl space-y-4 border border-primary/20 transform-gpu animate-in slide-in-from-top-1 duration-200">
                <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Correct Merchant Classification
                </h4>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-mono">Merchant Pattern</label>
                    <input
                      type="text"
                      value={correctionMerchant}
                      onChange={(e) => setCorrectionMerchant(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-slate-900 border border-white/10 rounded-lg focus:outline-none focus:border-primary text-white"
                      placeholder="e.g. NETFLIX"
                      disabled={submittingFeedback}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-mono">Correct Category</label>
                    <select
                      value={correctionCategory}
                      onChange={(e) => setCorrectionCategory(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-slate-900 border border-white/10 rounded-lg focus:outline-none focus:border-primary text-white"
                      disabled={submittingFeedback}
                    >
                      {MASTER_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="min-h-11 px-3 py-2.5 sm:min-h-9 sm:px-4 sm:py-2 text-xs"
                    onClick={() => setShowCorrectionForm(false)}
                    disabled={submittingFeedback}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    className="min-h-11 px-3 py-2.5 sm:min-h-9 sm:px-4 sm:py-2 text-xs bg-primary text-white hover:bg-primary/95"
                    onClick={() => handleFeedback('correct_merchant', {
                      canonical_merchant: correctionMerchant,
                      new_category: correctionCategory
                    })}
                    disabled={submittingFeedback}
                  >
                    Train Custom Engine
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {!showCorrectionForm && explanation && !loading && !error && (
          <DialogFooter className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4 pt-4 border-t border-white/5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleFeedback('helpful')}
              className="min-h-11 w-full bg-slate-950/40 border-white/10 hover:bg-slate-800 text-slate-300 px-3 py-2.5 sm:px-4 sm:py-2"
              disabled={submittingFeedback}
            >
              <CheckCircle className="h-5 w-5 sm:h-4 sm:w-4 mr-2 text-green-500" />
              Helpful
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleFeedback('unhelpful')}
              className="min-h-11 w-full bg-slate-950/40 border-white/10 hover:bg-slate-800 text-slate-300 px-3 py-2.5 sm:px-4 sm:py-2"
              disabled={submittingFeedback}
            >
              <XCircle className="h-5 w-5 sm:h-4 sm:w-4 mr-2 text-red-500" />
              Unhelpful
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={startCorrection}
              className="min-h-11 w-full bg-slate-950/40 border-white/10 hover:bg-slate-800 text-slate-300 px-3 py-2.5 sm:px-4 sm:py-2"
              disabled={submittingFeedback}
            >
              <Sparkles className="h-5 w-5 sm:h-4 sm:w-4 mr-2 text-blue-500" />
              Correct Category
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleFeedback('hide')}
              className="min-h-11 w-full bg-slate-950/40 border-white/10 hover:bg-slate-800 text-slate-300 px-3 py-2.5 sm:px-4 sm:py-2"
              disabled={submittingFeedback}
            >
              <EyeOff className="h-5 w-5 sm:h-4 sm:w-4 mr-2 text-gray-500" />
              Hide Alert
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
