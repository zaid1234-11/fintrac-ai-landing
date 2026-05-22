import { ParsedTransaction, parseBankSMS, categorizeMerchant } from '@/utils/smsParser';
import { TransactionBlockchain } from '@/utils/blockchain';
import { Transaction } from '@/contexts/TransactionContext';

export class SMSSyncService {
  private blockchain: TransactionBlockchain;
  private syncInterval: number = 60 * 60 * 1000; // 1 hour
  private intervalId: NodeJS.Timeout | null = null;
  private lastSyncTimestamp: number;

  constructor() {
    this.blockchain = new TransactionBlockchain();
    this.lastSyncTimestamp = this.getLastSyncTimestamp();
  }

  // Start automatic syncing
  startAutoSync(callback: (transactions: Transaction[]) => void) {
    console.log('🔄 Starting SMS auto-sync service...');
    
    // Initial sync
    this.syncSMS(callback);
    
    // Set up periodic sync
    this.intervalId = setInterval(() => {
      this.syncSMS(callback);
    }, this.syncInterval);
  }

  stopAutoSync() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('⏹️ SMS auto-sync stopped');
    }
  }

  // Simulate SMS fetching (in real app, this would use Android SMS API)
  async syncSMS(callback: (transactions: Transaction[]) => void) {
    console.log('📱 Syncing SMS messages...');
    
    try {
      // In a real mobile app, you'd use:
      // - Android: SMS Content Provider
      // - React Native: react-native-sms or react-native-android-sms-listener
      // - Capacitor: @capacitor/sms-listener
      
      const smsMessages = await this.fetchSMSMessages();
      const newTransactions: Transaction[] = [];
      
      for (const sms of smsMessages) {
        const parsed = parseBankSMS(sms.body, new Date(sms.timestamp));
        
        if (parsed) {
          // Check if transaction already exists
          const existingTransactions = this.blockchain.getAllTransactions();
          const isDuplicate = existingTransactions.some(
            (t: any) => 
              t.rawMessage === parsed.rawMessage ||
              (t.amount === parsed.amount && 
               Math.abs(new Date(t.date).getTime() - parsed.date.getTime()) < 60000)
          );
          
          if (!isDuplicate) {
            // Add to blockchain
            const block = this.blockchain.addTransaction(parsed);
            
            // Convert to app transaction format
            const transaction: Transaction = {
              id: `sms-${block.index}`,
              merchant: parsed.merchant,
              amount: parsed.amount,
              type: parsed.type,
              date: parsed.date.toISOString(),
              category: categorizeMerchant(parsed.merchant) as any,
            };
            
            newTransactions.push(transaction);
            console.log('✅ New transaction added:', transaction.merchant, transaction.amount);
          }
        }
      }
      
      if (newTransactions.length > 0) {
        callback(newTransactions);
        this.updateLastSyncTimestamp();
        console.log(`✨ Synced ${newTransactions.length} new transactions`);
      } else {
        console.log('💤 No new transactions found');
      }
      
    } catch (error) {
      console.error('❌ SMS sync failed:', error);
    }
  }

  // Mock SMS fetching (replace with actual SMS API)
  private async fetchSMSMessages(): Promise<Array<{ body: string; timestamp: number }>> {
    // In production, this would call native SMS APIs
    // For now, return empty array
    return [];
  }

  private getLastSyncTimestamp(): number {
    const stored = localStorage.getItem('fintrack_last_sms_sync');
    return stored ? parseInt(stored) : Date.now();
  }

  private updateLastSyncTimestamp(): void {
    this.lastSyncTimestamp = Date.now();
    localStorage.setItem('fintrack_last_sms_sync', this.lastSyncTimestamp.toString());
  }

  getBlockchainStatus() {
    return {
      isValid: this.blockchain.isValid(),
      blockCount: this.blockchain.getChain().length,
      transactionCount: this.blockchain.getAllTransactions().length,
      lastSync: new Date(this.lastSyncTimestamp).toLocaleString(),
    };
  }

  exportBlockchain(): string {
    return this.blockchain.exportChain();
  }
}
