"use client";

import { useState, useRef, DragEvent } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, CheckCircle, X, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface TransactionUploadProps {
  onUploadSuccess: () => void;
}

export function TransactionUpload({ onUploadSuccess }: TransactionUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
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
    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    const isPDF = ext === 'pdf' || selectedFile.type === 'application/pdf';
    const isCSV = ext === 'csv' || selectedFile.type === 'text/csv' || selectedFile.type === 'application/vnd.ms-excel';

    if (!isPDF && !isCSV) {
      toast.error('Unsupported file format', {
        description: 'Please upload a PDF or CSV bank statement.',
      });
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (selectedFile.size > maxSize) {
      toast.error('File too large', {
        description: 'File size must be less than 10MB.',
      });
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(15);
    setStatusText('Uploading to secure vault...');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/ingestion/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setProgress(50);
      setStatusText('Parsing transactions & analyzing with AI...');

      const statementId = data.statement.id;
      // Start polling the status of this statement
      pollIngestionStatus(statementId);

    } catch (error: any) {
      console.error(error);
      toast.error('Ingestion failed', {
        description: error.message || 'There was an error parsing the file.',
      });
      setUploading(false);
      setProgress(0);
      setStatusText('');
    }
  };

  const pollIngestionStatus = (statementId: string) => {
    let attempts = 0;
    const maxAttempts = 30; // 60 seconds max

    const interval = setInterval(async () => {
      attempts++;
      
      try {
        const res = await fetch('/api/ingestion/status');
        if (!res.ok) throw new Error('Failed to fetch status');

        const statements = await res.json();
        const activeStatement = statements.find((s: any) => s.id === statementId);

        if (!activeStatement) {
          clearInterval(interval);
          throw new Error('Statement audit record not found.');
        }

        if (activeStatement.status === 'completed') {
          clearInterval(interval);
          setProgress(100);
          setStatusText('Success! AI Analysis complete.');
          
          toast.success('Ingestion complete!', {
            description: `Extracted ${activeStatement.extracted_transactions_count} transactions from ${activeStatement.bank_name || 'your statement'}.`,
          });

          // Short delay to let user see progress complete
          setTimeout(() => {
            setFile(null);
            setUploading(false);
            setProgress(0);
            setStatusText('');
            onUploadSuccess();
          }, 1500);

        } else if (activeStatement.status === 'failed') {
          clearInterval(interval);
          throw new Error('The document layout could not be parsed correctly. Enter manually or try another statement.');
        } else {
          // Increment progress slightly during ingestion steps
          setProgress(prev => Math.min(prev + 5, 95));
        }

      } catch (err: any) {
        clearInterval(interval);
        toast.error('Processing error', {
          description: err.message || 'Background analysis failed.',
        });
        setUploading(false);
        setProgress(0);
        setStatusText('');
      }

      if (attempts >= maxAttempts) {
        clearInterval(interval);
        toast.warning('Ingestion is taking longer than expected', {
          description: 'Your transactions will update in the background. Check back in a few minutes.',
        });
        setFile(null);
        setUploading(false);
        setProgress(0);
        setStatusText('');
        onUploadSuccess();
      }
    }, 2000);
  };

  const clearFile = () => {
    setFile(null);
  };

  return (
    <Card className="bg-slate-800/40 backdrop-blur-xl border-white/10 shadow-lg shadow-primary/5">
      <CardContent className="p-6">
        <h3 className="text-white text-lg font-semibold mb-4 flex items-center gap-2">
          <Upload className="h-5 w-5 text-primary" />
          Ingest Bank Statement
        </h3>

        {!file && (
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
              dragActive
                ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10Scale scale-[1.01]'
                : 'border-slate-600 hover:border-slate-400 bg-slate-900/30'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.csv"
              className="hidden"
              onChange={handleChange}
            />
            <Upload className="h-12 w-12 text-slate-400 mb-4 animate-bounce" />
            <p className="text-white font-medium text-center">
              Drag & drop bank statement or <span className="text-primary hover:underline font-semibold">browse files</span>
            </p>
            <p className="text-slate-400 text-xs text-center mt-2">
              Supports HDFC, ICICI, SBI (PDF or CSV formats, up to 10MB)
            </p>
          </div>
        )}

        {file && (
          <div className="space-y-4">
            <div className="bg-slate-900/50 rounded-xl p-4 flex items-center gap-4 border border-white/5 relative">
              <div className="bg-primary/20 text-primary p-3 rounded-lg">
                <FileText className="h-6 w-6" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-white font-medium truncate">{file.name}</p>
                <p className="text-slate-400 text-xs">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              {!uploading && (
                <button
                  onClick={clearFile}
                  className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-700/50 absolute top-2 right-2"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {uploading ? (
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-300 flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin text-primary" />
                    {statusText}
                  </span>
                  <span className="text-primary font-bold">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2 bg-slate-700" />
              </div>
            ) : (
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={clearFile}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleUpload}>
                  Upload & Analyze
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
