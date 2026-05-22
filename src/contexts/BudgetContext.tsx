import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Budget {
  id: string;
  category: string;
  amount: number;
  period: 'monthly' | 'weekly' | 'yearly';
  spent: number;
  color: string;
  icon: string;
}

interface BudgetContextType {
  budgets: Budget[];
  addBudget: (budget: Omit<Budget, 'id' | 'spent'>) => void;
  updateBudget: (id: string, budget: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;
  getBudgetByCategory: (category: string) => Budget | undefined;
  getTotalBudget: () => number;
  getTotalSpent: () => number;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

interface BudgetProviderProps {
  children: ReactNode;
}

export const BudgetProvider: React.FC<BudgetProviderProps> = ({ children }) => {
  const [budgets, setBudgets] = useState<Budget[]>(() => {
    const saved = localStorage.getItem('fintrack_budgets');
    return saved ? JSON.parse(saved) : [
      {
        id: '1',
        category: 'Food',
        amount: 15000,
        period: 'monthly',
        spent: 0,
        color: '#f59e0b',
        icon: 'Utensils',
      },
      {
        id: '2',
        category: 'Shopping',
        amount: 10000,
        period: 'monthly',
        spent: 0,
        color: '#8b5cf6',
        icon: 'ShoppingBag',
      },
      {
        id: '3',
        category: 'Travel',
        amount: 8000,
        period: 'monthly',
        spent: 0,
        color: '#06b6d4',
        icon: 'Plane',
      },
    ];
  });

  useEffect(() => {
    localStorage.setItem('fintrack_budgets', JSON.stringify(budgets));
  }, [budgets]);

  const addBudget = (budget: Omit<Budget, 'id' | 'spent'>) => {
    const newBudget: Budget = {
      ...budget,
      id: Date.now().toString(),
      spent: 0,
    };
    setBudgets([...budgets, newBudget]);
  };

  const updateBudget = (id: string, updatedBudget: Partial<Budget>) => {
    setBudgets(budgets.map(b => (b.id === id ? { ...b, ...updatedBudget } : b)));
  };

  const deleteBudget = (id: string) => {
    setBudgets(budgets.filter(b => b.id !== id));
  };

  const getBudgetByCategory = (category: string) => {
    return budgets.find(b => b.category === category);
  };

  const getTotalBudget = () => {
    return budgets.reduce((sum, b) => sum + b.amount, 0);
  };

  const getTotalSpent = () => {
    return budgets.reduce((sum, b) => sum + b.spent, 0);
  };

  return (
    <BudgetContext.Provider
      value={{
        budgets,
        addBudget,
        updateBudget,
        deleteBudget,
        getBudgetByCategory,
        getTotalBudget,
        getTotalSpent,
      }}
    >
      {children}
    </BudgetContext.Provider>
  );
};

export const useBudgets = (): BudgetContextType => {
  const context = useContext(BudgetContext);
  if (!context) {
    throw new Error('useBudgets must be used within BudgetProvider');
  }
  return context;
};
