import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAppTheme } from '../context/ThemeContext';
import { Plus, Trash2, Edit2, Target, Calendar, Award } from 'lucide-react';
import { Modal } from '../components/Modal';
import { SavingsGoal } from '../types/types';

export const GoalsPage: React.FC = () => {
  const { goals, addGoal, updateGoal, deleteGoal } = useData();
  const { formatCurrency } = useAppTheme();

  // Modals state
  const [isOpen, setIsOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [depositGoal, setDepositGoal] = useState<SavingsGoal | null>(null);

  // Form Fields state
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [savedAmount, setSavedAmount] = useState('');
  const [deadline, setDeadline] = useState('');

  // Deposit specific state
  const [depositVal, setDepositVal] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(targetAmount);
    const saved = parseFloat(savedAmount) || 0;
    if (!name.trim() || isNaN(target) || target <= 0) return;

    const payload = {
      name,
      targetAmount: target,
      savedAmount: saved,
      deadline
    };

    if (editingGoal) {
      updateGoal(editingGoal.id, payload);
      setEditingGoal(null);
    } else {
      addGoal(payload);
      setIsOpen(false);
    }
  };

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositGoal) return;
    const amount = parseFloat(depositVal);
    if (isNaN(amount) || amount <= 0) return;

    const updatedSaved = depositGoal.savedAmount + amount;
    updateGoal(depositGoal.id, {
      name: depositGoal.name,
      targetAmount: depositGoal.targetAmount,
      savedAmount: Math.min(updatedSaved, depositGoal.targetAmount),
      deadline: depositGoal.deadline
    });

    setDepositGoal(null);
    setDepositVal('');
  };

  const openAddModal = () => {
    setName('');
    setTargetAmount('');
    setSavedAmount('0');
    setDeadline(() => {
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      return nextYear.toISOString().substring(0, 10);
    });
    setIsOpen(true);
  };

  const openEditModal = (g: SavingsGoal) => {
    setEditingGoal(g);
    setName(g.name);
    setTargetAmount(String(g.targetAmount));
    setSavedAmount(String(g.savedAmount));
    setDeadline(g.deadline);
  };

  const openDepositModal = (g: SavingsGoal) => {
    setDepositGoal(g);
    setDepositVal('');
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Savings Goals</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Set targets and allocate funds towards major milestones.</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-md shadow-emerald-500/10 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create Goal
        </button>
      </div>

      {/* Goals Grid list */}
      {goals.length === 0 ? (
        <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl py-16 px-5 text-center text-slate-450">
          <Target className="w-12 h-12 mx-auto mb-2 text-slate-350 opacity-60" />
          <p className="text-sm font-medium">No savings goals established yet.</p>
          <button
            onClick={openAddModal}
            className="text-xs text-emerald-500 font-bold hover:underline mt-1 cursor-pointer"
          >
            Create New Savings Goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((g) => {
            const percent = Math.min((g.savedAmount / g.targetAmount) * 100, 100);
            const isCompleted = g.savedAmount >= g.targetAmount;
            
            // Days remaining calculation
            const diffTime = new Date(g.deadline).getTime() - new Date().getTime();
            const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            return (
              <div key={g.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs flex flex-col justify-between space-y-4">
                {/* Title & Actions */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-800 dark:text-white text-base truncate max-w-[180px]">{g.name}</h3>
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Target: {g.deadline}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(g)}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteGoal(g.id)}
                      className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress Circle or Figures */}
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="font-medium text-slate-500">Saved Amount:</span>
                    <span className="font-bold text-slate-800 dark:text-white">
                      {formatCurrency(g.savedAmount)} / {formatCurrency(g.targetAmount)}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isCompleted ? 'bg-emerald-550' : 'bg-blue-500'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className={`font-semibold ${isCompleted ? 'text-emerald-500' : 'text-slate-400'}`}>
                      {percent.toFixed(0)}% Completed
                    </span>
                    <span className="text-slate-400">
                      {isCompleted ? 'Goal Reached!' : daysLeft > 0 ? `${daysLeft} days left` : 'Overdue'}
                    </span>
                  </div>
                </div>

                {/* Deposit action button */}
                {!isCompleted ? (
                  <button
                    onClick={() => openDepositModal(g)}
                    className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/45 dark:text-emerald-400 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Add Deposit
                  </button>
                ) : (
                  <div className="flex items-center justify-center gap-1 text-emerald-500 text-xs font-bold bg-emerald-50 dark:bg-emerald-950/20 py-2 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
                    <Award className="w-4 h-4 text-emerald-500" />
                    Target Fully Achieved!
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Savings Goal Modal */}
      <Modal
        isOpen={isOpen || editingGoal !== null}
        onClose={() => { setIsOpen(false); setEditingGoal(null); }}
        title={editingGoal ? 'Edit Savings Goal' : 'Create Savings Goal'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Goal Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. New Car, Trip to Bali, Emergency Fund"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Target Amount
              </label>
              <input
                type="number"
                min="1"
                required
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-850 dark:text-white focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Saved Starting Balance
              </label>
              <input
                type="number"
                min="0"
                value={savedAmount}
                onChange={(e) => setSavedAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-850 dark:text-white focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Target Deadline Date
            </label>
            <input
              type="date"
              required
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-850 dark:text-white focus:outline-none focus:border-emerald-500 text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => { setIsOpen(false); setEditingGoal(null); }}
              className="px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/10 transition-colors cursor-pointer"
            >
              {editingGoal ? 'Save Changes' : 'Confirm Goal'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Deposit Modal */}
      <Modal
        isOpen={depositGoal !== null}
        onClose={() => setDepositGoal(null)}
        title={depositGoal ? `Add Deposit for: ${depositGoal.name}` : 'Goal Deposit'}
      >
        <form onSubmit={handleDepositSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Deposit Amount
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={depositVal}
              onChange={(e) => setDepositVal(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-850 dark:text-white focus:outline-none focus:border-emerald-500 text-sm"
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setDepositGoal(null)}
              className="px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/10 transition-colors cursor-pointer"
            >
              Confirm Deposit
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
