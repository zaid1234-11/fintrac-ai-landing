import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Transaction {
  id: string;
  merchant: string;
  amount: number;
  type: 'debit' | 'credit';
  date: string;
  category: 'Food' | 'Travel' | 'Bills' | 'Shopping' | 'Entertainment' | 'Other' | 'Salary';
}

const initialTransactions: Transaction[] = [
  { id: '1', merchant: 'Zomato', amount: 450.00, type: 'debit', date: '2025-10-13T10:00:00Z', category: 'Food' },
  { id: '2', merchant: 'Salary Deposit', amount: 75000.00, type: 'credit', date: '2025-10-01T09:00:00Z', category: 'Salary' },
  { id: '3', merchant: 'IndiGo', amount: 8500.00, type: 'debit', date: '2025-10-11T15:30:00Z', category: 'Travel' },
  { id: '4', merchant: 'Airtel Bill', amount: 1199.00, type: 'debit', date: '2025-10-05T12:00:00Z', category: 'Bills' },
  { id: '5', merchant: 'Myntra', amount: 2500.00, type: 'debit', date: '2025-10-08T20:15:00Z', category: 'Shopping' },
  { id: '6', merchant: 'PVR Cinemas', amount: 880.00, type: 'debit', date: '2025-10-04T18:45:00Z', category: 'Entertainment' },
  { id: '7', merchant: 'Upwork Payment', amount: 15000.00, type: 'credit', date: '2025-09-28T11:00:00Z', category: 'Salary' },
  { id: '8', merchant: 'Swiggy Instamart', amount: 720.50, type: 'debit', date: '2025-10-10T09:20:00Z', category: 'Food' },
  { id: '9', merchant: 'Electricity Bill', amount: 1850.00, type: 'debit', date: '2025-09-25T14:00:00Z', category: 'Bills' },
];

interface TransactionContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  lastUpdated: number;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

interface TransactionProviderProps {
  children: ReactNode;
}

export const TransactionProvider: React.FC<TransactionProviderProps> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('fintrack_transactions');
    return saved ? JSON.parse(saved) : initialTransactions;
  });
  const [lastUpdated, setLastUpdated] = useState(Date.now());

  useEffect(() => {
    localStorage.setItem('fintrack_transactions', JSON.stringify(transactions));
    setLastUpdated(Date.now());
  }, [transactions]);

  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString(),
    };
    setTransactions(prev => [...prev, newTransaction]);
  };

  const updateTransaction = (id: string, updatedFields: Partial<Transaction>) => {
    setTransactions(prev =>
      prev.map(t => (t.id === id ? { ...t, ...updatedFields } : t))
    );
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        lastUpdated,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransactions = (): TransactionContextType => {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransactions must be used within TransactionProvider');
  }
  return context;
};
