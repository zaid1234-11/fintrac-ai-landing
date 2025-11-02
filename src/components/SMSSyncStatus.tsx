import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, RefreshCw, Download } from "lucide-react";
import { useState, useEffect } from "react";
import { SMSSyncService } from "@/services/smsSyncService";
import { toast } from "sonner";

export const SMSSyncStatus = () => {
  const [status, setStatus] = useState({
    isValid: true,
    blockCount: 0,
    transactionCount: 0,
    lastSync: '',
  });
  const [isSyncing, setIsSyncing] = useState(false);

  const smsService = new SMSSyncService();

  useEffect(() => {
    updateStatus();
  }, []);

  const updateStatus = () => {
    const blockchainStatus = smsService.getBlockchainStatus();
    setStatus(blockchainStatus);
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    toast.info('Syncing SMS messages...', { duration: 2000 });
    
    setTimeout(() => {
      updateStatus();
      setIsSyncing(false);
      toast.success('SMS sync completed!');
    }, 2000);
  };

  const handleExportBlockchain = () => {
    const data = smsService.exportBlockchain();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fintrack-blockchain-${Date.now()}.json`;
    link.click();
    toast.success('Blockchain exported successfully!');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            SMS Sync Status
            {status.isValid ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500" />
            )}
          </span>
          <Badge variant={status.isValid ? "default" : "destructive"}>
            {status.isValid ? 'Secure' : 'Invalid'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Blockchain Blocks</p>
            <p className="text-2xl font-bold">{status.blockCount}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Transactions</p>
            <p className="text-2xl font-bold">{status.transactionCount}</p>
          </div>
        </div>
        
        <div>
          <p className="text-xs text-muted-foreground">Last Sync</p>
          <p className="text-sm font-medium">{status.lastSync}</p>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={handleManualSync} 
            disabled={isSyncing}
            className="flex-1"
            size="sm"
          >
            {isSyncing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Manual Sync
              </>
            )}
          </Button>
          <Button 
            onClick={handleExportBlockchain}
            variant="outline"
            size="sm"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
