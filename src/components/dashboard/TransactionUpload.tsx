"use client";

import { DragEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowRight,
  Brain,
  CheckCircle,
  FileSearch,
  FileText,
  KeyRound,
  Lock,
  ScanLine,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface TransactionUploadProps {
  onUploadSuccess: () => void;
}

const activitySteps = [
  {
    label: "Parsing statement structure...",
    detail: "Reading tables, balances, dates, and transaction boundaries.",
  },
  {
    label: "Normalizing merchants...",
    detail: "Collapsing noisy bank descriptions into clean merchant identities.",
  },
  {
    label: "Detecting recurring subscriptions...",
    detail: "Looking for monthly debits, billing cycles, and quiet renewals.",
  },
  {
    label: "Analyzing behavioral spending patterns...",
    detail: "Comparing categories, timing, impulse clusters, and income rhythm.",
  },
  {
    label: "Generating financial wellness insights...",
    detail: "Preparing the Behavioral Console from your fresh transaction graph.",
  },
];

export function TransactionUpload({ onUploadSuccess }: TransactionUploadProps) {
  const router = useRouter();
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeStage, setActiveStage] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activityTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (activityTimerRef.current) {
        clearInterval(activityTimerRef.current);
      }
    };
  }, []);

  const startActivityStream = () => {
    if (activityTimerRef.current) {
      clearInterval(activityTimerRef.current);
    }

    setActiveStage(0);
    setProgress(12);

    activityTimerRef.current = setInterval(() => {
      setActiveStage((current) => Math.min(current + 1, activitySteps.length - 1));
      setProgress((current) => Math.min(current + 14, 88));
    }, 1800);
  };

  const stopActivityStream = () => {
    if (activityTimerRef.current) {
      clearInterval(activityTimerRef.current);
      activityTimerRef.current = null;
    }
  };

  const resetUploadState = () => {
    stopActivityStream();
    setUploading(false);
    setProgress(0);
    setActiveStage(0);
  };

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    const ext = selectedFile.name.split(".").pop()?.toLowerCase();
    const isPDF = ext === "pdf" || selectedFile.type === "application/pdf";
    const isCSV =
      ext === "csv" ||
      selectedFile.type === "text/csv" ||
      selectedFile.type === "application/vnd.ms-excel";

    if (!isPDF && !isCSV) {
      toast.error("Unsupported file format", {
        description: "Please upload a PDF or CSV bank statement.",
      });
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      toast.error("File too large", {
        description: "File size must be less than 10MB.",
      });
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    startActivityStream();

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (password) {
        formData.append("password", password);
      }

      const res = await fetch("/api/ingestion/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setProgress((current) => Math.max(current, 42));
      setActiveStage((current) => Math.max(current, 1));
      pollIngestionStatus(data.statement.id);
    } catch (error: any) {
      console.error(error);
      toast.error("Ingestion failed", {
        description: error.message || "There was an error parsing the file.",
      });
      resetUploadState();
    }
  };

  const pollIngestionStatus = (statementId: string) => {
    let attempts = 0;
    const maxAttempts = 30;

    const interval = setInterval(async () => {
      attempts++;

      try {
        const res = await fetch("/api/ingestion/status");
        if (!res.ok) throw new Error("Failed to fetch status");

        const statements = await res.json();
        const activeStatement = statements.find((s: any) => s.id === statementId);

        if (!activeStatement) {
          clearInterval(interval);
          throw new Error("Statement audit record not found.");
        }

        if (activeStatement.status === "completed") {
          clearInterval(interval);
          stopActivityStream();
          setActiveStage(activitySteps.length);
          setProgress(100);

          toast.success("Behavioral Console is ready", {
            description: `Extracted ${activeStatement.extracted_transactions_count} transactions from ${activeStatement.bank_name || "your statement"}.`,
          });

          setTimeout(() => {
            setFile(null);
            setPassword("");
            resetUploadState();
            onUploadSuccess();
            router.push("/dashboard");
          }, 1500);
          return;
        } else if (activeStatement.status === "failed") {
          clearInterval(interval);
          throw new Error(
            activeStatement.error_message ||
              "The document layout could not be parsed correctly. Enter manually or try another statement."
          );
        } else {
          setProgress((prev) => Math.min(prev + 5, 94));
        }
      } catch (err: any) {
        clearInterval(interval);
        toast.error("Processing error", {
          description: err.message || "Background analysis failed.",
        });
        resetUploadState();
        return;
      }

      if (attempts >= maxAttempts) {
        clearInterval(interval);
        toast.warning("Ingestion is taking longer than expected", {
          description: "Your transactions will update in the background. Check back in a few minutes.",
        });
        setFile(null);
        resetUploadState();
        onUploadSuccess();
        router.push("/dashboard");
      }
    }, 2000);
  };

  const clearFile = () => {
    setFile(null);
    setPassword("");
    resetUploadState();
  };

  return (
    <Card className="overflow-hidden border-white/10 bg-slate-950/70 shadow-2xl shadow-black/30 backdrop-blur-2xl">
      <CardContent className="relative p-0">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
        <div className="absolute -right-20 -top-24 h-52 w-52 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-20 h-52 w-52 rounded-full bg-accent/10 blur-3xl" />

        <div className="relative space-y-5 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                First statement intelligence
              </div>
              <h3 className="text-xl font-semibold text-white">Upload your bank statement</h3>
              <p className="mt-1 text-sm leading-6 text-slate-400">
                Drop a PDF and Fintrac will build your behavioral money profile from the raw statement.
              </p>
            </div>
            <div className="hidden rounded-2xl border border-primary/20 bg-primary/10 p-3 text-primary sm:block">
              <Brain className="h-6 w-6" />
            </div>
          </div>

          {!file && (
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "group relative flex min-h-[260px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed p-8 text-center transition-all duration-300",
                dragActive
                  ? "scale-[1.01] border-primary/80 bg-primary/15 shadow-2xl shadow-primary/15"
                  : "border-white/15 bg-white/[0.035] hover:border-primary/50 hover:bg-white/[0.055]"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.csv"
                className="hidden"
                onChange={handleChange}
              />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.18),transparent_40%)] opacity-80" />
              <div className="relative mb-5 grid h-20 w-20 place-items-center rounded-3xl border border-white/10 bg-slate-950/80 shadow-inner shadow-white/5 transition-transform duration-300 group-hover:-translate-y-1">
                <FileSearch className="h-9 w-9 text-primary" />
                <div className="absolute -right-2 -top-2 rounded-full border border-accent/30 bg-accent/20 p-1.5 text-accent">
                  <ScanLine className="h-4 w-4" />
                </div>
              </div>
              <p className="relative max-w-sm text-lg font-semibold text-white">Drop your PDF statement here</p>
              <p className="relative mt-2 max-w-sm text-sm leading-6 text-slate-400">
                or browse files to start the secure intelligence pass. CSV is supported for older exports.
              </p>
              <div className="relative mt-6 flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-400">
                <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-accent" />
                  Private vault
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1">
                  <FileText className="h-3.5 w-3.5 text-primary" />
                  PDF or CSV
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1">
                  <Lock className="h-3.5 w-3.5 text-slate-300" />
                  Up to 10MB
                </span>
              </div>
            </div>
          )}

          {file && (
            <div className="space-y-4">
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-primary via-accent to-primary" />
                <div className="flex items-center gap-4">
                  <div className="rounded-2xl border border-primary/20 bg-primary/15 p-3 text-primary">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-white">{file.name}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {(file.size / 1024 / 1024).toFixed(2)} MB queued for behavioral analysis
                    </p>
                  </div>
                  {!uploading && (
                    <button
                      onClick={clearFile}
                      className="rounded-full p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
                      aria-label="Remove selected file"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {(file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf") && (
                <div className="space-y-2 rounded-2xl border border-white/10 bg-slate-950/45 p-4">
                  <Label htmlFor="pdf-password" className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                    <KeyRound className="h-3.5 w-3.5 text-accent" />
                    Statement password
                    <span className="font-normal text-slate-500">(optional)</span>
                  </Label>
                  <Input
                    id="pdf-password"
                    type="password"
                    placeholder="Enter password if your PDF is locked"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border-white/10 bg-black/30 text-white placeholder:text-slate-500 focus:border-primary/50"
                    disabled={uploading}
                  />
                  <p className="text-[11px] leading-5 text-slate-500">
                    Some HDFC and ICICI statements need a password before parsing can begin.
                  </p>
                </div>
              )}

              {uploading ? (
                <div className="space-y-4 rounded-2xl border border-primary/15 bg-slate-950/60 p-4 shadow-inner shadow-black/30">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="flex items-center gap-2 text-sm font-semibold text-white">
                        <Activity className="h-4 w-4 text-accent" />
                        Intelligence engine active
                      </p>
                      <p className="mt-1 text-xs text-slate-500">Streaming secure parsing activity in real time.</p>
                    </div>
                    <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                      {progress}%
                    </span>
                  </div>

                  <Progress value={progress} className="h-1.5 bg-slate-800" />

                  <div className="space-y-3">
                    {activitySteps.map((step, index) => {
                      const isComplete = activeStage > index;
                      const isActive = activeStage === index;

                      return (
                        <div
                          key={step.label}
                          className={cn(
                            "rounded-xl border p-3 transition-all duration-300",
                            isActive && "border-primary/35 bg-primary/10 shadow-lg shadow-primary/10",
                            isComplete && "border-accent/20 bg-accent/5",
                            !isActive && !isComplete && "border-white/5 bg-white/[0.025] opacity-60"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={cn(
                                "mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border",
                                isComplete && "border-accent/40 bg-accent/15 text-accent",
                                isActive && "border-primary/50 bg-primary/15 text-primary",
                                !isActive && !isComplete && "border-white/10 text-slate-500"
                              )}
                            >
                              {isComplete ? (
                                <CheckCircle className="h-3.5 w-3.5" />
                              ) : (
                                <span className={cn("h-2 w-2 rounded-full bg-current", isActive && "animate-pulse")} />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className={cn("text-sm font-medium", isActive || isComplete ? "text-white" : "text-slate-500")}>
                                {step.label}
                              </p>
                              {(isActive || isComplete) && (
                                <p className="mt-1 text-xs leading-5 text-slate-400">{step.detail}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Button
                    variant="outline"
                    className="border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/10 hover:text-white"
                    onClick={clearFile}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="gap-2 bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90"
                    onClick={handleUpload}
                  >
                    Upload & Analyze
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
