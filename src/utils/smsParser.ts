export interface ParsedTransaction {
  amount: number;
  type: 'debit' | 'credit';
  merchant: string;
  date: Date;
  bankName: string;
  accountLast4: string;
  balance?: number;
  rawMessage: string;
}

// Common Indian bank SMS patterns
const SMS_PATTERNS = [
  // HDFC Bank
  {
    bank: 'HDFC',
    pattern: /(?:Rs\.?|INR)\s?([\d,]+\.?\d*)\s+(?:debited|credited|spent|received).*?(?:at|on|from)\s+([A-Z0-9\s]+?)(?:\s+on|\s+A\/C)/i,
    typePattern: /(debited|credited|spent|received)/i,
  },
  // SBI
  {
    bank: 'SBI',
    pattern: /(?:Rs\.?|INR)\s?([\d,]+\.?\d*)\s+(?:debited|credited).*?(?:to|from)\s+([A-Z0-9\s]+)/i,
    typePattern: /(debited|credited)/i,
  },
  // ICICI
  {
    bank: 'ICICI',
    pattern: /(?:Rs\.?|INR)\s?([\d,]+\.?\d*)\s+(?:debited|credited).*?(?:at|on)\s+([A-Z0-9\s]+)/i,
    typePattern: /(debited|credited)/i,
  },
  // Axis Bank
  {
    bank: 'AXIS',
    pattern: /(?:Rs\.?|INR)\s?([\d,]+\.?\d*)\s+(?:debited|credited|spent).*?(?:at|on|via)\s+([A-Z0-9\s]+)/i,
    typePattern: /(debited|credited|spent)/i,
  },
  // Paytm
  {
    bank: 'Paytm',
    pattern: /(?:Rs\.?|INR)\s?([\d,]+\.?\d*)\s+(?:paid|received).*?(?:to|from)\s+([A-Z0-9\s]+)/i,
    typePattern: /(paid|received)/i,
  },
  // UPI Generic
  {
    bank: 'UPI',
    pattern: /(?:Rs\.?|INR)\s?([\d,]+\.?\d*)\s+(?:sent|received|debited|credited).*?(?:to|from)\s+([A-Z0-9@\s]+)/i,
    typePattern: /(sent|received|debited|credited)/i,
  },
];

export const parseBankSMS = (message: string, timestamp: Date): ParsedTransaction | null => {
  // Clean the message
  const cleanMessage = message.replace(/\n/g, ' ').trim();
  
  // Try each pattern
  for (const { bank, pattern, typePattern } of SMS_PATTERNS) {
    const match = cleanMessage.match(pattern);
    const typeMatch = cleanMessage.match(typePattern);
    
    if (match && typeMatch) {
      const amountStr = match[1].replace(/,/g, '');
      const amount = parseFloat(amountStr);
      const merchant = match[2].trim();
      const typeKeyword = typeMatch[1].toLowerCase();
      
      // Determine transaction type
      const isDebit = ['debited', 'spent', 'paid', 'sent'].includes(typeKeyword);
      const type: 'debit' | 'credit' = isDebit ? 'debit' : 'credit';
      
      // Extract account number (last 4 digits)
      const accountMatch = cleanMessage.match(/X{2,}(\d{4})/i) || cleanMessage.match(/\*{2,}(\d{4})/i);
      const accountLast4 = accountMatch ? accountMatch[1] : '****';
      
      // Extract balance if present
      const balanceMatch = cleanMessage.match(/(?:balance|bal|avbl|available).*?(?:Rs\.?|INR)\s?([\d,]+\.?\d*)/i);
      const balance = balanceMatch ? parseFloat(balanceMatch[1].replace(/,/g, '')) : undefined;
      
      return {
        amount,
        type,
        merchant: cleanMerchantName(merchant),
        date: timestamp,
        bankName: bank,
        accountLast4,
        balance,
        rawMessage: cleanMessage,
      };
    }
  }
  
  return null;
};

const cleanMerchantName = (merchant: string): string => {
  return merchant
    .replace(/\s+/g, ' ')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim()
    .slice(0, 50);
};

// Categorize merchant using keywords
export const categorizeMerchant = (merchant: string): string => {
  const lowerMerchant = merchant.toLowerCase();
  
  const categories = {
    Food: ['zomato', 'swiggy', 'restaurant', 'cafe', 'food', 'mcdonald', 'kfc', 'domino', 'pizza', 'burger'],
    Travel: ['uber', 'ola', 'indigo', 'spicejet', 'airline', 'irctc', 'makemytrip', 'goibibo', 'rapido'],
    Shopping: ['amazon', 'flipkart', 'myntra', 'ajio', 'meesho', 'shopping', 'mall', 'store', 'mart'],
    Bills: ['electricity', 'water', 'gas', 'broadband', 'mobile', 'recharge', 'bill', 'payment', 'jio', 'airtel', 'vodafone'],
    Entertainment: ['netflix', 'prime', 'hotstar', 'spotify', 'youtube', 'movie', 'cinema', 'pvr', 'inox', 'gaming'],
    Other: [],
  };
  
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => lowerMerchant.includes(keyword))) {
      return category;
    }
  }
  
  return 'Other';
};
