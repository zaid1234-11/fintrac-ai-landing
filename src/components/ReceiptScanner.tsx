import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Upload, Scan, CheckCircle, X, Loader2 } from "lucide-react";
import Tesseract from "tesseract.js";
import { toast } from "sonner";
import { useTransactions } from "@/contexts/TransactionContext";

interface ScannedData {
  merchant: string;
  amount: string;
  date: string;
  rawText: string;
  imageUrl: string;
}

export const ReceiptScanner = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState<ScannedData | null>(null);
  const [editedData, setEditedData] = useState({
    merchant: "",
    amount: "",
    category: "Food" as any,
    date: new Date().toISOString().split('T')[0],
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { addTransaction } = useTransactions();

  const parseReceiptText = (text: string): Partial<ScannedData> => {
    // Extract amount (various formats)
    const amountPatterns = [
      /(?:total|amount|pay|sum)[:\s]*(?:rs\.?|₹|inr)?\s*(\d+(?:,\d+)*(?:\.\d{2})?)/i,
      /(?:rs\.?|₹|inr)\s*(\d+(?:,\d+)*(?:\.\d{2})?)/i,
      /(\d+(?:,\d+)*\.\d{2})\s*(?:rs|₹|inr)?/i,
    ];
    
    let amount = "";
    for (const pattern of amountPatterns) {
      const match = text.match(pattern);
      if (match) {
        amount = match[1].replace(/,/g, "");
        break;
      }
    }

    // Extract date
    const datePatterns = [
      /(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/,
      /(\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{2,4})/i,
    ];
    
    let dateStr = new Date().toISOString().split('T')[0];
    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        try {
          const parsed = new Date(match[1]);
          if (!isNaN(parsed.getTime())) {
            dateStr = parsed.toISOString().split('T')[0];
            break;
          }
        } catch (e) {
          // Continue to next pattern
        }
      }
    }

    // Extract merchant (first meaningful line)
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2);
    let merchant = lines[0] || "Unknown Merchant";
    
    // Clean up merchant name
    merchant = merchant
      .replace(/[^a-zA-Z0-9\s&]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .substring(0, 50);

    return { merchant, amount, date: dateStr };
  };

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    setScanning(true);
    toast.info("Scanning receipt...", { description: "This may take a few seconds" });

    try {
      // Create image URL for preview
      const imageUrl = URL.createObjectURL(file);

      // Perform OCR
      const { data: { text } } = await Tesseract.recognize(file, "eng", {
        logger: (m) => {
          if (m.status === "recognizing text") {
            console.log(`Progress: ${Math.round(m.progress * 100)}%`);
          }
        },
      });

      // Parse the extracted text
      const parsed = parseReceiptText(text);

      setScannedData({
        merchant: parsed.merchant || "",
        amount: parsed.amount || "",
        date: parsed.date || new Date().toISOString().split('T')[0],
        rawText: text,
        imageUrl,
      });

      setEditedData({
        merchant: parsed.merchant || "",
        amount: parsed.amount || "",
        category: "Food",
        date: parsed.date || new Date().toISOString().split('T')[0],
      });

      toast.success("Receipt scanned successfully!");
    } catch (error) {
      console.error("OCR Error:", error);
      toast.error("Failed to scan receipt", {
        description: "Please try again or enter manually",
      });
    } finally {
      setScanning(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  const handleSaveTransaction = () => {
    if (!editedData.merchant || !editedData.amount) {
      toast.error("Please fill in merchant and amount");
      return;
    }

    addTransaction({
      merchant: editedData.merchant,
      amount: parseFloat(editedData.amount),
      type: "debit",
      category: editedData.category,
      date: new Date(editedData.date).toISOString(),
    });

    toast.success("Transaction added from receipt!");
    
    // Reset and close
    setScannedData(null);
    setEditedData({
      merchant: "",
      amount: "",
      category: "Food",
      date: new Date().toISOString().split('T')[0],
    });
    setIsOpen(false);
  };

  const handleCancel = () => {
    setScannedData(null);
    setIsOpen(false);
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} variant="outline" className="gap-2">
        <Scan className="h-4 w-4" />
        Scan Receipt
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Scan Receipt</DialogTitle>
            <DialogDescription>
              Upload a receipt image or take a photo to automatically extract transaction details
            </DialogDescription>
          </DialogHeader>

          {!scannedData && !scanning && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card 
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={handleUploadClick}
                >
                  <CardContent className="flex flex-col items-center justify-center py-8 gap-3">
                    <Upload className="h-10 w-10 text-primary" />
                    <div className="text-center">
                      <p className="font-semibold">Upload Image</p>
                      <p className="text-sm text-muted-foreground">From your device</p>
                    </div>
                  </CardContent>
                </Card>

                <Card 
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={handleCameraClick}
                >
                  <CardContent className="flex flex-col items-center justify-center py-8 gap-3">
                    <Camera className="h-10 w-10 text-primary" />
                    <div className="text-center">
                      <p className="font-semibold">Take Photo</p>
                      <p className="text-sm text-muted-foreground">Use camera</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              />

              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Tips for best results:</strong>
                  <br />• Ensure the receipt is well-lit and clearly visible
                  <br />• Avoid shadows and glare
                  <br />• Keep the receipt flat and straight
                </p>
              </div>
            </div>
          )}

          {scanning && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <p className="text-lg font-semibold">Scanning receipt...</p>
              <p className="text-sm text-muted-foreground">Extracting text using OCR</p>
            </div>
          )}

          {scannedData && !scanning && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-green-900 dark:text-green-100">
                    Receipt scanned successfully!
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Review and edit the details below before saving
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="preview">Receipt Preview</Label>
                  <div className="border rounded-lg overflow-hidden">
                    <img 
                      src={scannedData.imageUrl} 
                      alt="Receipt preview" 
                      className="w-full h-48 object-cover"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="grid gap-2">
                    <Label htmlFor="merchant">Merchant</Label>
                    <Input
                      id="merchant"
                      value={editedData.merchant}
                      onChange={(e) => setEditedData({ ...editedData, merchant: e.target.value })}
                      placeholder="Store name"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="amount">Amount (₹)</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={editedData.amount}
                      onChange={(e) => setEditedData({ ...editedData, amount: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={editedData.category}
                      onValueChange={(value: any) => setEditedData({ ...editedData, category: value })}
                    >
                      <SelectTrigger id="category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Food">Food</SelectItem>
                        <SelectItem value="Shopping">Shopping</SelectItem>
                        <SelectItem value="Travel">Travel</SelectItem>
                        <SelectItem value="Bills">Bills</SelectItem>
                        <SelectItem value="Entertainment">Entertainment</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={editedData.date}
                      onChange={(e) => setEditedData({ ...editedData, date: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={handleCancel} className="flex-1">
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSaveTransaction} className="flex-1">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Save Transaction
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
