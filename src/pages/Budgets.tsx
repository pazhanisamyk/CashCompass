import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAppTheme } from '../context/ThemeContext';
import { Plus, Trash2, Edit2, Wallet, AlertCircle, ShoppingBag, Info } from 'lucide-react';
import { Modal } from '../components/Modal';
import { Budget, ExpenseCategory } from '../types/types';

const CATEGORIES: ExpenseCategory[] = ['Food', 'Shopping', 'Rent', 'Fuel', 'Medical', 'Travel', 'Entertainment', 'Utilities', 'Education', 'Insurance', 'Subscription', 'Investment', 'Other'];

export const BudgetsPage: React.FC = () => {
  const { budgets, expenses, addBudget, updateBudget, deleteBudget } = useData();
  const { formatCurrency } = useAppTheme();

  // Modal control
  const [isOpen, setIsOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  // Form states
  const [type, setType] = useState<'monthly' | 'category'>('monthly');
  const [category, setCategory] = useState<ExpenseCategory>('Food');
  const [limitAmount, setLimitAmount] = useState('');
  const [period, setPeriod] = useState(() => new Date().toISOString().substring(0, 7)); // YYYY-MM

  const currentPeriod = new Date().toISOString().substring(0, 7);

  // Group budgets by period (current vs older)
  const currentBudgets = budgets.filter(b => b.period === currentPeriod);
  const historicBudgets = budgets.filter(b => b.period !== currentPeriod);

  const getSpentForBudget = (b: Budget) => {
    const periodExpenses = expenses.filter(e => e.date.substring(0, 7) === b.period);
    if (b.type === 'monthly') {
      return periodExpenses.reduce((sum, e) => sum + e.amount, 0);
    } else {
      return periodExpenses.filter(e => e.category === b.category).reduce((sum, e) => sum + e.amount, 0);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedLimit = parseFloat(limitAmount);
    if (isNaN(parsedLimit) || parsedLimit <= 0) return;

    const payload = {
      type,
      category: type === 'category' ? category : undefined,
      limitAmount: parsedLimit,
      period
    };

    if (editingBudget) {
      updateBudget(editingBudget.id, payload);
      setEditingBudget(null);
    } else {
      addBudget(payload);
      setIsOpen(false);
    }
  };

  const openAddModal = () => {
    setType('monthly');
    setCategory('Food');
    setLimitAmount('');
    setPeriod(currentPeriod);
    setIsOpen(true);
  };

  const openEditModal = (b: Budget) => {
    setEditingBudget(b);
    setType(b.type);
    if (b.category) setCategory(b.category);
    setLimitAmount(String(b.limitAmount));
    setPeriod(b.period);
  };

  const renderBudgetCard = (b: Budget) => {
    const spent = getSpentForBudget(b);
    const percent = Math.min((spent / b.limitAmount) * 100, 100);
    const isExceeded = spent > b.limitAmount;

    return (
      <div key={b.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-4 relative overflow-hidden">
        {/* Card Top Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold tracking-wider uppercase bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500">
              {b.type === 'monthly' ? 'Global Limit' : `Category: ${b.category}`}
            </span>
            <h4 className="text-base font-bold text-slate-800 dark:text-white">
              {b.type === 'monthly' ? 'All Expenditures' : b.category}
            </h4>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => openEditModal(b)}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-850 rounded text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => deleteBudget(b.id)}
              className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress figures */}
        <div className="flex items-baseline justify-between">
          <p className="text-xl font-extrabold text-slate-850 dark:text-white">
            {formatCurrency(spent)} <span className="text-xs font-normal text-slate-400">spent of {formatCurrency(b.limitAmount)}</span>
          </p>
          <span className={`text-xs font-bold ${isExceeded ? 'text-rose-500' : percent > 75 ? 'text-amber-500' : 'text-emerald-500'}`}>
            {percent.toFixed(0)}%
          </span>
        </div>

        {/* Progress bar container */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isExceeded
                ? 'bg-rose-500'
                : percent > 75
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* Exceeded Status indicator */}
        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800/40">
          <span className="text-slate-500">Remaining limit:</span>
          {isExceeded ? (
            <span className="font-bold text-rose-500 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              Over by {formatCurrency(spent - b.limitAmount)}
            </span>
          ) : (
            <span className="font-bold text-emerald-500">
              {formatCurrency(b.limitAmount - spent)} left
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Budgets & Limits</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Establish spending caps to curb unnecessary outgoings.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-md shadow-emerald-500/10 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Setup Budget
        </button>
      </div>

      {/* Active Budgets Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Active Limits ({currentPeriod})</h3>
        {currentBudgets.length === 0 ? (
          <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl py-10 px-5 text-center text-slate-400">
            <Wallet className="w-10 h-10 mx-auto mb-2 text-slate-350 opacity-60" />
            <p className="text-sm font-medium">No budgets defined for the current month.</p>
            <button
              onClick={openAddModal}
              className="text-xs text-emerald-500 font-bold hover:underline mt-1 cursor-pointer"
            >
              Add Budget Limit
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentBudgets.map(b => renderBudgetCard(b))}
          </div>
        )}
      </div>

      {/* Historic Budgets Section */}
      {historicBudgets.length > 0 && (
        <div className="space-y-4 pt-4">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">Previous Limits</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {historicBudgets.map(b => renderBudgetCard(b))}
          </div>
        </div>
      )}

      {/* Setup / Edit Budget Modal */}
      <Modal
        isOpen={isOpen || editingBudget !== null}
        onClose={() => { setIsOpen(false); setEditingBudget(null); }}
        title={editingBudget ? 'Edit Spending Limit' : 'Configure New Budget'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          {/* Budget Type selection */}
          <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-850 p-1.5 rounded-xl border border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setType('monthly')}
              className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                type === 'monthly'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-650'
              }`}
            >
              Monthly Cap
            </button>
            <button
              type="button"
              onClick={() => setType('category')}
              className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                type === 'category'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-650'
              }`}
            >
              Category Cap
            </button>
          </div>

          {/* Period (Month) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Target Period
              </label>
              <input
                type="month"
                required
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-850 dark:text-white focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Spending Limit
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                required
                value={limitAmount}
                onChange={(e) => setLimitAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-855 dark:text-white focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>
          </div>

          {/* Category Selector (If type is Category) */}
          {type === 'category' && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Expense Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500 text-sm dark:bg-slate-900"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => { setIsOpen(false); setEditingBudget(null); }}
              className="px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/10 transition-colors cursor-pointer"
            >
              {editingBudget ? 'Save Changes' : 'Confirm Limit'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
