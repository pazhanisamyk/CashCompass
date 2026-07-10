import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAppTheme } from '../context/ThemeContext';
import { Plus, Trash2, Edit2, Calendar, Check, AlertTriangle, AlertCircle, RefreshCw } from 'lucide-react';
import { Modal } from '../components/Modal';
import { Bill } from '../types/types';

export const BillsPage: React.FC = () => {
  const { bills, addBill, updateBill, deleteBill, payBill } = useData();
  const { formatCurrency } = useAppTheme();

  // Modals state
  const [isOpen, setIsOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);

  // Form Fields state
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [paid, setPaid] = useState(false);
  const [repeatMonthly, setRepeatMonthly] = useState(true);

  const todayStr = new Date().toISOString().substring(0, 10);

  // Bill groupings
  const unpaidBills = bills.filter(b => !b.paid);
  const paidBills = bills.filter(b => b.paid);

  // Calculations for Overdue vs Upcoming unpaid bills
  const overdueCount = unpaidBills.filter(b => new Date(b.dueDate) < new Date(todayStr)).length;
  const upcomingCount = unpaidBills.filter(b => new Date(b.dueDate) >= new Date(todayStr)).length;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!name.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return;

    const payload = {
      name,
      amount: parsedAmount,
      dueDate,
      paid,
      repeatMonthly
    };

    if (editingBill) {
      updateBill(editingBill.id, payload);
      setEditingBill(null);
    } else {
      addBill(payload);
      setIsOpen(false);
    }
  };

  const openAddModal = () => {
    setName('');
    setAmount('');
    setDueDate(() => new Date().toISOString().substring(0, 10));
    setPaid(false);
    setRepeatMonthly(true);
    setIsOpen(true);
  };

  const openEditModal = (b: Bill) => {
    setEditingBill(b);
    setName(b.name);
    setAmount(String(b.amount));
    setDueDate(b.dueDate);
    setPaid(b.paid);
    setRepeatMonthly(b.repeatMonthly);
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Recurring Bills</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Keep track of monthly subscriptions, rentals, and utility charges.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-md shadow-emerald-500/10 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Bill
        </button>
      </div>

      {/* Grid: Overview Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Bills</span>
            <p className="text-2xl font-bold text-slate-850 dark:text-white">{bills.length}</p>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 text-slate-500 p-3 rounded-xl">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Upcoming Bills</span>
            <p className="text-2xl font-bold text-amber-500">{upcomingCount}</p>
          </div>
          <div className="bg-amber-500/10 text-amber-500 p-3 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Overdue Bills</span>
            <p className="text-2xl font-bold text-rose-500">{overdueCount}</p>
          </div>
          <div className="bg-rose-500/10 text-rose-500 p-3 rounded-xl">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Unpaid Bills */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-850 dark:text-white flex items-center gap-2">
            <Calendar className="w-4.5 h-4.5 text-amber-500" />
            Pending Payments
          </h3>
          <div className="space-y-3">
            {unpaidBills.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <Check className="w-10 h-10 mx-auto mb-2 text-emerald-500 bg-emerald-500/10 p-2 rounded-full" />
                <p className="text-sm">All bills paid for this month!</p>
              </div>
            ) : (
              unpaidBills.map(bill => {
                const isOverdue = new Date(bill.dueDate) < new Date(todayStr);
                return (
                  <div key={bill.id} className="p-4 border border-slate-100 dark:border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-850/20 transition-all">
                    <div className="space-y-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-850 dark:text-white truncate">{bill.name}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          Due: {bill.dueDate}
                        </span>
                        {bill.repeatMonthly && (
                          <span className="flex items-center gap-1 text-[10px] bg-blue-500/10 text-blue-500 font-bold px-1.5 py-0.5 rounded">
                            <RefreshCw className="w-2.5 h-2.5" /> Monthly
                          </span>
                        )}
                        {isOverdue && (
                          <span className="text-[10px] bg-rose-500/10 text-rose-500 font-bold px-1.5 py-0.5 rounded">
                            Overdue
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 justify-between sm:justify-start">
                      <span className="text-base font-extrabold text-slate-800 dark:text-white">{formatCurrency(bill.amount)}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => payBill(bill.id)}
                          className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                        >
                          Pay Now
                        </button>
                        <button
                          onClick={() => openEditModal(bill)}
                          className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteBill(bill.id)}
                          className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Paid Bills History */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-850 dark:text-white flex items-center gap-2">
            <Check className="w-4.5 h-4.5 text-emerald-500" />
            Paid History
          </h3>
          <div className="space-y-3">
            {paidBills.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <p className="text-xs">No paid bills logged yet.</p>
              </div>
            ) : (
              paidBills.map(bill => (
                <div key={bill.id} className="p-4 border border-slate-100 dark:border-slate-850 rounded-xl flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-850/20 transition-all opacity-80">
                  <div className="space-y-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-white truncate line-through">{bill.name}</p>
                    <span className="text-xs text-slate-450 dark:text-slate-500 block">Due date: {bill.dueDate}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-800 dark:text-white">{formatCurrency(bill.amount)}</span>
                    <span className="bg-emerald-500/10 text-emerald-500 font-bold px-2.5 py-1 rounded-xl text-[10px] flex items-center gap-1">
                      <Check className="w-3 h-3" /> Paid
                    </span>
                    <button
                      onClick={() => openEditModal(bill)}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteBill(bill.id)}
                      className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add / Edit Bill Modal */}
      <Modal
        isOpen={isOpen || editingBill !== null}
        onClose={() => { setIsOpen(false); setEditingBill(null); }}
        title={editingBill ? 'Edit Bill Record' : 'Configure New Bill'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Bill Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Broadband, Rent, Electric Bill, Gym"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-850 dark:text-white focus:outline-none focus:border-emerald-500 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Amount
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-850 dark:text-white focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Due Date
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-850 dark:text-white focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={repeatMonthly}
                onChange={(e) => setRepeatMonthly(e.target.checked)}
                className="rounded border-slate-350 text-emerald-500 focus:ring-emerald-500 h-4.5 w-4.5"
              />
              <span>Repeat Monthly</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={paid}
                onChange={(e) => setPaid(e.target.checked)}
                className="rounded border-slate-350 text-emerald-500 focus:ring-emerald-500 h-4.5 w-4.5"
              />
              <span>Mark as Paid</span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => { setIsOpen(false); setEditingBill(null); }}
              className="px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/10 transition-colors cursor-pointer"
            >
              {editingBill ? 'Save Changes' : 'Confirm Bill'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
