"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';

export interface Transaction {
  id: string;
  merchant: string;
  amount: number;
  type: 'debit' | 'credit';
  date: string;
  category: string;
  description?: string;
  upi_id?: string | null;
  blockchain_hash?: string | null;
  source?: string;
  classification_source?: string;
  ai_confidence_score?: number;
}

interface TransactionContextType {
  transactions: Transaction[];
  loading: boolean;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  correctTransactionCategory: (id: string, category: string) => Promise<void>;
  refreshTransactions: () => Promise<void>;
  lastUpdated: number;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

interface TransactionProviderProps {
  children: ReactNode;
}

export const TransactionProvider: React.FC<TransactionProviderProps> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(Date.now());

  const refreshTransactions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/transactions');
      if (!res.ok) {
        throw new Error('Failed to load transactions');
      }
      const data = await res.json();
      
      // Map database schema to Context type
      const mapped = data.map((t: any) => ({
        id: t.id,
        merchant: t.merchant_name || 'Unknown',
        amount: Number(t.amount),
        type: t.type,
        date: t.date || t.created_at,
        category: t.categories?.name || 'Other',
        description: t.description,
        upi_id: t.upi_id,
        blockchain_hash: t.blockchain_hash,
        source: t.source,
        classification_source: t.classification_source || 'rules',
        ai_confidence_score: t.ai_confidence_score ? Number(t.ai_confidence_score) : 0.85,
      }));
      
      setTransactions(mapped);
      setLastUpdated(Date.now());
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Could not sync transactions from database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshTransactions();
  }, []);

  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transaction),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save transaction');
      }

      await refreshTransactions();
    } catch (error: any) {
      console.error('Error saving transaction:', error);
      toast.error(error.message || 'Failed to save transaction to database');
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      toast.info('Deleting transaction...');
      setTransactions(prev => prev.filter(t => t.id !== id));
      toast.success('Transaction deleted');
    } catch (error) {
      console.error('Delete transaction error:', error);
    }
  };

  const correctTransactionCategory = async (id: string, category: string) => {
    const res = await fetch('/api/transactions/correct', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactionId: id, category }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to update category');
    }

    await refreshTransactions();
  };

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        loading,
        addTransaction,
        deleteTransaction,
        correctTransactionCategory,
        refreshTransactions,
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
