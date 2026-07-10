import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Income,
  Expense,
  Budget,
  SavingsGoal,
  Bill,
  Notification,
  NotificationType,
  IncomeCategory,
  ExpenseCategory,
  PaymentMethod
} from '../types/types';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { storage } from '../utils/storage';

interface DataContextProps {
  incomes: Income[];
  expenses: Expense[];
  budgets: Budget[];
  goals: SavingsGoal[];
  bills: Bill[];
  notifications: Notification[];
  
  // Income CRUD
  addIncome: (income: Omit<Income, 'id' | 'userId'>) => void;
  updateIncome: (id: string, income: Omit<Income, 'id' | 'userId'>) => void;
  deleteIncome: (id: string) => void;
  
  // Expense CRUD
  addExpense: (expense: Omit<Expense, 'id' | 'userId'>) => void;
  updateExpense: (id: string, expense: Omit<Expense, 'id' | 'userId'>) => void;
  deleteExpense: (id: string) => void;
  duplicateExpense: (id: string) => void;
  toggleFavoriteExpense: (id: string) => void;
  
  // Budget CRUD
  addBudget: (budget: Omit<Budget, 'id' | 'userId'>) => void;
  updateBudget: (id: string, budget: Omit<Budget, 'id' | 'userId'>) => void;
  deleteBudget: (id: string) => void;
  
  // Goal CRUD
  addGoal: (goal: Omit<SavingsGoal, 'id' | 'userId'>) => void;
  updateGoal: (id: string, goal: Omit<SavingsGoal, 'id' | 'userId'>) => void;
  deleteGoal: (id: string) => void;
  
  // Bill CRUD
  addBill: (bill: Omit<Bill, 'id' | 'userId'>) => void;
  updateBill: (id: string, bill: Omit<Bill, 'id' | 'userId'>) => void;
  deleteBill: (id: string) => void;
  payBill: (id: string) => void;
  
  // Notification actions
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;
  
  // Global Data controls
  resetAllData: () => void;
  backupData: () => string;
  restoreData: (jsonStr: string) => boolean;
}

const DataContext = createContext<DataContextProps | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const [incomes, setIncomes] = useState<Income[]>(() => JSON.parse(storage.getItem('incomes') || '[]'));
  const [expenses, setExpenses] = useState<Expense[]>(() => JSON.parse(storage.getItem('expenses') || '[]'));
  const [budgets, setBudgets] = useState<Budget[]>(() => JSON.parse(storage.getItem('budgets') || '[]'));
  const [goals, setGoals] = useState<SavingsGoal[]>(() => JSON.parse(storage.getItem('goals') || '[]'));
  const [bills, setBills] = useState<Bill[]>(() => JSON.parse(storage.getItem('bills') || '[]'));
  const [notifications, setNotifications] = useState<Notification[]>(() => JSON.parse(storage.getItem('notifications') || '[]'));

  // Save to storage whenever state changes
  useEffect(() => { storage.setItem('incomes', JSON.stringify(incomes)); }, [incomes]);
  useEffect(() => { storage.setItem('expenses', JSON.stringify(expenses)); }, [expenses]);
  useEffect(() => { storage.setItem('budgets', JSON.stringify(budgets)); }, [budgets]);
  useEffect(() => { storage.setItem('goals', JSON.stringify(goals)); }, [goals]);
  useEffect(() => { storage.setItem('bills', JSON.stringify(bills)); }, [bills]);
  useEffect(() => { storage.setItem('notifications', JSON.stringify(notifications)); }, [notifications]);




  // Automated notification checker
  useEffect(() => {
    if (!currentUser) return;

    const todayStr = new Date().toISOString().substring(0, 10);
    const currentPeriod = new Date().toISOString().substring(0, 7);

    // 1. Check budget limits
    const currentMonthExpenses = expenses.filter(
      e => e.userId === currentUser.id && e.date.substring(0, 7) === currentPeriod
    );

    // Monthly Budget check
    const monthlyBud = budgets.find(b => b.userId === currentUser.id && b.type === 'monthly' && b.period === currentPeriod);
    if (monthlyBud) {
      const totalSpent = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
      if (totalSpent > monthlyBud.limitAmount) {
        const notifExists = notifications.some(
          n => n.userId === currentUser.id && n.type === 'budget_exceeded' && n.title === 'Monthly Budget Exceeded' && n.date.startsWith(currentPeriod)
        );
        if (!notifExists) {
          addNotification('Monthly Budget Exceeded', `You have spent ${totalSpent.toFixed(2)} which exceeds your monthly budget of ${monthlyBud.limitAmount.toFixed(2)}!`, 'budget_exceeded');
        }
      }
    }

    // Category Budgets check
    const catBudgets = budgets.filter(b => b.userId === currentUser.id && b.type === 'category' && b.period === currentPeriod);
    catBudgets.forEach(b => {
      if (!b.category) return;
      const spentInCat = currentMonthExpenses.filter(e => e.category === b.category).reduce((sum, e) => sum + e.amount, 0);
      if (spentInCat > b.limitAmount) {
        const notifExists = notifications.some(
          n => n.userId === currentUser.id && n.type === 'budget_exceeded' && n.title === `${b.category} Budget Exceeded` && n.date.startsWith(currentPeriod)
        );
        if (!notifExists) {
          addNotification(`${b.category} Budget Exceeded`, `Spent amount in ${b.category} (${spentInCat.toFixed(2)}) exceeded the category limit of ${b.limitAmount.toFixed(2)}.`, 'budget_exceeded');
        }
      }
    });

    // 2. Check Upcoming / Overdue Bills
    bills.filter(b => b.userId === currentUser.id && !b.paid).forEach(bill => {
      const diffTime = new Date(bill.dueDate).getTime() - new Date(todayStr).getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 3 && diffDays >= 0) {
        const notifExists = notifications.some(
          n => n.userId === currentUser.id && n.type === 'bill_due' && n.message.includes(bill.name) && n.date.startsWith(todayStr)
        );
        if (!notifExists) {
          addNotification('Upcoming Bill Due', `Your bill "${bill.name}" of $${bill.amount} is due in ${diffDays} day(s).`, 'bill_due');
        }
      } else if (diffDays < 0) {
        const notifExists = notifications.some(
          n => n.userId === currentUser.id && n.type === 'bill_due' && n.message.includes(`"${bill.name}" is overdue`)
        );
        if (!notifExists) {
          addNotification('Overdue Bill Warning', `Your bill "${bill.name}" of $${bill.amount} is overdue since ${bill.dueDate}!`, 'bill_due');
        }
      }
    });

  }, [incomes, expenses, budgets, bills]);

  const addNotification = (title: string, message: string, type: NotificationType) => {
    if (!currentUser) return;
    const newNotif: Notification = {
      id: Math.random().toString(36).substring(2, 9),
      userId: currentUser.id,
      title,
      message,
      type,
      date: new Date().toISOString(),
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearAllNotifications = () => {
    if (!currentUser) return;
    setNotifications(prev => prev.filter(n => n.userId !== currentUser.id));
  };

  // INCOMES
  const addIncome = (income: Omit<Income, 'id' | 'userId'>) => {
    if (!currentUser) return;
    const newIncome: Income = {
      ...income,
      id: Math.random().toString(36).substring(2, 9),
      userId: currentUser.id
    };
    setIncomes(prev => [newIncome, ...prev]);
    toast('Income added successfully!', 'success');
  };

  const updateIncome = (id: string, income: Omit<Income, 'id' | 'userId'>) => {
    setIncomes(prev => prev.map(i => i.id === id ? { ...i, ...income } : i));
    toast('Income updated successfully!', 'success');
  };

  const deleteIncome = (id: string) => {
    setIncomes(prev => prev.filter(i => i.id !== id));
    toast('Income deleted.', 'info');
  };

  // EXPENSES
  const addExpense = (expense: Omit<Expense, 'id' | 'userId'>) => {
    if (!currentUser) return;
    const newExpense: Expense = {
      ...expense,
      id: Math.random().toString(36).substring(2, 9),
      userId: currentUser.id
    };
    setExpenses(prev => [newExpense, ...prev]);
    toast('Expense added successfully!', 'success');
  };

  const updateExpense = (id: string, expense: Omit<Expense, 'id' | 'userId'>) => {
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...expense } : e));
    toast('Expense updated successfully!', 'success');
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    toast('Expense deleted.', 'info');
  };

  const duplicateExpense = (id: string) => {
    const original = expenses.find(e => e.id === id);
    if (!original || !currentUser) return;
    const duplicated: Expense = {
      ...original,
      id: Math.random().toString(36).substring(2, 9),
      date: new Date().toISOString().substring(0, 10) // Duplicate with today's date
    };
    setExpenses(prev => [duplicated, ...prev]);
    toast('Expense duplicated successfully!', 'success');
  };

  const toggleFavoriteExpense = (id: string) => {
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, favorite: !e.favorite } : e));
  };

  // BUDGETS
  const addBudget = (budget: Omit<Budget, 'id' | 'userId'>) => {
    if (!currentUser) return;
    // Check if budget of same type/category already exists for the period
    const exists = budgets.some(b => 
      b.userId === currentUser.id &&
      b.type === budget.type &&
      b.period === budget.period &&
      (budget.type === 'monthly' || b.category === budget.category)
    );

    if (exists) {
      toast(`A budget of this type already exists for period ${budget.period}`, 'warning');
      return;
    }

    const newBudget: Budget = {
      ...budget,
      id: Math.random().toString(36).substring(2, 9),
      userId: currentUser.id
    };
    setBudgets(prev => [...prev, newBudget]);
    toast('Budget limits configured!', 'success');
  };

  const updateBudget = (id: string, budget: Omit<Budget, 'id' | 'userId'>) => {
    setBudgets(prev => prev.map(b => b.id === id ? { ...b, ...budget } : b));
    toast('Budget updated successfully!', 'success');
  };

  const deleteBudget = (id: string) => {
    setBudgets(prev => prev.filter(b => b.id !== id));
    toast('Budget constraint deleted.', 'info');
  };

  // SAVINGS GOALS
  const addGoal = (goal: Omit<SavingsGoal, 'id' | 'userId'>) => {
    if (!currentUser) return;
    const newGoal: SavingsGoal = {
      ...goal,
      id: Math.random().toString(36).substring(2, 9),
      userId: currentUser.id
    };
    setGoals(prev => [...prev, newGoal]);
    toast('Savings Goal created!', 'success');
  };

  const updateGoal = (id: string, goal: Omit<SavingsGoal, 'id' | 'userId'>) => {
    setGoals(prev => {
      const updated = prev.map(g => g.id === id ? { ...g, ...goal } : g);
      const curGoal = updated.find(g => g.id === id);
      if (curGoal && curGoal.savedAmount >= curGoal.targetAmount && currentUser) {
        // Trigger completion notification if not already triggered
        const alreadyNotified = notifications.some(n => n.userId === currentUser.id && n.type === 'goal_completed' && n.title.includes(curGoal.name));
        if (!alreadyNotified) {
          addNotification('Savings Goal Completed!', `Congratulations! You have reached your savings goal of $${curGoal.targetAmount.toFixed(2)} for "${curGoal.name}".`, 'goal_completed');
        }
      }
      return updated;
    });
    toast('Savings Goal updated successfully!', 'success');
  };

  const deleteGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
    toast('Savings Goal deleted.', 'info');
  };

  // BILLS
  const addBill = (bill: Omit<Bill, 'id' | 'userId'>) => {
    if (!currentUser) return;
    const newBill: Bill = {
      ...bill,
      id: Math.random().toString(36).substring(2, 9),
      userId: currentUser.id
    };
    setBills(prev => [...prev, newBill]);
    toast('Bill added successfully!', 'success');
  };

  const updateBill = (id: string, bill: Omit<Bill, 'id' | 'userId'>) => {
    setBills(prev => prev.map(b => b.id === id ? { ...b, ...bill } : b));
    toast('Bill updated successfully!', 'success');
  };

  const deleteBill = (id: string) => {
    setBills(prev => prev.filter(b => b.id !== id));
    toast('Bill removed.', 'info');
  };

  const payBill = (id: string) => {
    const bill = bills.find(b => b.id === id);
    if (!bill || !currentUser) return;

    // 1. Mark bill as paid
    setBills(prev => prev.map(b => b.id === id ? { ...b, paid: true } : b));

    // 2. Add an automatic expense entry for it
    const newExpense: Expense = {
      id: Math.random().toString(36).substring(2, 9),
      userId: currentUser.id,
      title: `Paid Bill: ${bill.name}`,
      amount: bill.amount,
      category: 'Utilities', // default category for bills
      paymentMethod: 'Bank Transfer',
      date: new Date().toISOString().substring(0, 10),
      notes: `Autogenerated payment from bill due: ${bill.dueDate}`,
      tags: ['Bills', 'Auto-Paid']
    };
    setExpenses(prev => [newExpense, ...prev]);

    // 3. Trigger Notification
    addNotification('Bill Paid', `Completed payment of $${bill.amount} for "${bill.name}".`, 'system');
    toast(`Bill "${bill.name}" paid and recorded as expense!`, 'success');
  };

  // RESET ALL DATA
  const resetAllData = () => {
    if (!currentUser) return;
    const uId = currentUser.id;
    setIncomes(prev => prev.filter(i => i.userId !== uId));
    setExpenses(prev => prev.filter(e => e.userId !== uId));
    setBudgets(prev => prev.filter(b => b.userId !== uId));
    setGoals(prev => prev.filter(g => g.userId !== uId));
    setBills(prev => prev.filter(b => b.userId !== uId));
    setNotifications(prev => prev.filter(n => n.userId !== uId));
    toast('All data reset successfully.', 'warning');
  };

  // BACKUP DATA (EXPORT JSON)
  const backupData = (): string => {
    if (!currentUser) return '';
    const userId = currentUser.id;
    const userPayload = {
      incomes: incomes.filter(i => i.userId === userId),
      expenses: expenses.filter(e => e.userId === userId),
      budgets: budgets.filter(b => b.userId === userId),
      goals: goals.filter(g => g.userId === userId),
      bills: bills.filter(b => b.userId === userId),
      notifications: notifications.filter(n => n.userId === userId)
    };
    return JSON.stringify(userPayload, null, 2);
  };

  // RESTORE DATA (IMPORT JSON)
  const restoreData = (jsonStr: string): boolean => {
    if (!currentUser) return false;
    try {
      const data = JSON.parse(jsonStr);
      const userId = currentUser.id;

      // Validate structure roughly
      const hasValidKeys = 'incomes' in data && 'expenses' in data && 'budgets' in data && 'goals' in data && 'bills' in data;
      if (!hasValidKeys) {
        toast('Invalid backup file structure.', 'error');
        return false;
      }

      // Add userId to imported records and set ids if missing
      const importedIncomes = (data.incomes || []).map((i: any) => ({ ...i, userId, id: i.id || Math.random().toString(36).substring(2, 9) }));
      const importedExpenses = (data.expenses || []).map((e: any) => ({ ...e, userId, id: e.id || Math.random().toString(36).substring(2, 9) }));
      const importedBudgets = (data.budgets || []).map((b: any) => ({ ...b, userId, id: b.id || Math.random().toString(36).substring(2, 9) }));
      const importedGoals = (data.goals || []).map((g: any) => ({ ...g, userId, id: g.id || Math.random().toString(36).substring(2, 9) }));
      const importedBills = (data.bills || []).map((b: any) => ({ ...b, userId, id: b.id || Math.random().toString(36).substring(2, 9) }));
      const importedNotifications = (data.notifications || []).map((n: any) => ({ ...n, userId, id: n.id || Math.random().toString(36).substring(2, 9) }));

      // Clean existing data for current user and replace with imported data
      setIncomes(prev => [...prev.filter(i => i.userId !== userId), ...importedIncomes]);
      setExpenses(prev => [...prev.filter(e => e.userId !== userId), ...importedExpenses]);
      setBudgets(prev => [...prev.filter(b => b.userId !== userId), ...importedBudgets]);
      setGoals(prev => [...prev.filter(g => g.userId !== userId), ...importedGoals]);
      setBills(prev => [...prev.filter(b => b.userId !== userId), ...importedBills]);
      setNotifications(prev => [...prev.filter(n => n.userId !== userId), ...importedNotifications]);

      toast('Data restored successfully!', 'success');
      return true;
    } catch (e) {
      toast('Failed to parse backup JSON file.', 'error');
      return false;
    }
  };

  return (
    <DataContext.Provider
      value={{
        incomes: currentUser ? incomes.filter(i => i.userId === currentUser.id) : [],
        expenses: currentUser ? expenses.filter(e => e.userId === currentUser.id) : [],
        budgets: currentUser ? budgets.filter(b => b.userId === currentUser.id) : [],
        goals: currentUser ? goals.filter(g => g.userId === currentUser.id) : [],
        bills: currentUser ? bills.filter(b => b.userId === currentUser.id) : [],
        notifications: currentUser ? notifications.filter(n => n.userId === currentUser.id) : [],
        addIncome,
        updateIncome,
        deleteIncome,
        addExpense,
        updateExpense,
        deleteExpense,
        duplicateExpense,
        toggleFavoriteExpense,
        addBudget,
        updateBudget,
        deleteBudget,
        addGoal,
        updateGoal,
        deleteGoal,
        addBill,
        updateBill,
        deleteBill,
        payBill,
        markNotificationRead,
        clearAllNotifications,
        resetAllData,
        backupData,
        restoreData
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
