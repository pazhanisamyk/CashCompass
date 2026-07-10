import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAppTheme } from '../context/ThemeContext';
import {
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  Copy,
  Star,
  ChevronLeft,
  ChevronRight,
  Bookmark
} from 'lucide-react';
import { Modal } from '../components/Modal';
import { ExpenseCategory, PaymentMethod, Expense } from '../types/types';

const CATEGORIES: ExpenseCategory[] = ['Food', 'Shopping', 'Rent', 'Fuel', 'Medical', 'Travel', 'Entertainment', 'Utilities', 'Education', 'Insurance', 'Subscription', 'Investment', 'Other'];
const METHODS: PaymentMethod[] = ['Cash', 'Card', 'Bank Transfer', 'Mobile Payment', 'Other'];

export const ExpensesPage: React.FC = () => {
  const { expenses, addExpense, updateExpense, deleteExpense, duplicateExpense, toggleFavoriteExpense } = useData();
  const { formatCurrency } = useAppTheme();

  // Filters State
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedMethod, setSelectedMethod] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Form Fields State
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Food');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Card');
  const [date, setDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [notes, setNotes] = useState('');
  const [tagsStr, setTagsStr] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Filtered and Sorted Expenses
  const filteredExpenses = expenses
    .filter((e) => {
      const matchesSearch = e.title.toLowerCase().includes(search.toLowerCase()) || 
        (e.notes && e.notes.toLowerCase().includes(search.toLowerCase())) ||
        (e.tags && e.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase())));
      const matchesCategory = selectedCategory === 'All' || e.category === selectedCategory;
      const matchesMethod = selectedMethod === 'All' || e.paymentMethod === selectedMethod;
      const matchesFavorite = !onlyFavorites || e.favorite;
      return matchesSearch && matchesCategory && matchesMethod && matchesFavorite;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === 'oldest') return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortBy === 'highest') return b.amount - a.amount;
      if (sortBy === 'lowest') return a.amount - b.amount;
      return 0;
    });

  // Pagination calculations
  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedExpenses = filteredExpenses.slice(startIndex, startIndex + itemsPerPage);

  const openAddModal = () => {
    setTitle('');
    setAmount('');
    setCategory('Food');
    setPaymentMethod('Card');
    setDate(new Date().toISOString().substring(0, 10));
    setNotes('');
    setTagsStr('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (exp: Expense) => {
    setEditingExpense(exp);
    setTitle(exp.title);
    setAmount(String(exp.amount));
    setCategory(exp.category);
    setPaymentMethod(exp.paymentMethod);
    setDate(exp.date);
    setNotes(exp.notes || '');
    setTagsStr(exp.tags ? exp.tags.join(', ') : '');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!title.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return;

    const tags = tagsStr
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const payload = {
      title,
      amount: parsedAmount,
      category,
      paymentMethod,
      date,
      notes: notes || undefined,
      tags: tags.length > 0 ? tags : undefined,
      favorite: editingExpense ? editingExpense.favorite : false
    };

    if (editingExpense) {
      updateExpense(editingExpense.id, payload);
      setEditingExpense(null);
    } else {
      addExpense(payload);
      setIsAddModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Payments & Expenses</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage and track your outgoings</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-md shadow-rose-500/10 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Expense
        </button>
      </div>

      {/* Filters section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex flex-col xl:flex-row gap-4 items-center justify-between shadow-xs">
        {/* Search */}
        <div className="relative w-full xl:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            placeholder="Search payments, tags..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:outline-none focus:border-rose-500 text-slate-850 dark:text-white"
          />
        </div>

        {/* Filters Selects */}
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          {/* Favorite filter toggle */}
          <button
            onClick={() => { setOnlyFavorites(!onlyFavorites); setCurrentPage(1); }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-semibold transition-colors ${
              onlyFavorites 
                ? 'bg-amber-500/10 border-amber-500 text-amber-500' 
                : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <Star className={`w-4 h-4 ${onlyFavorites ? 'fill-amber-500' : ''}`} />
            Favorites
          </button>

          {/* Category */}
          <select
            value={selectedCategory}
            onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:outline-none focus:border-rose-500 text-slate-700 dark:text-slate-350 dark:bg-slate-900"
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* Payment Method */}
          <select
            value={selectedMethod}
            onChange={(e) => { setSelectedMethod(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:outline-none focus:border-rose-500 text-slate-700 dark:text-slate-350 dark:bg-slate-900"
          >
            <option value="All">All Payment Methods</option>
            {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>

          {/* Sorter */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:outline-none focus:border-rose-500 text-slate-700 dark:text-slate-350 dark:bg-slate-900"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest">Highest Amount</option>
            <option value="lowest">Lowest Amount</option>
          </select>
        </div>
      </div>

      {/* Expenses Table List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold text-xs bg-slate-50/50 dark:bg-slate-850/5">
                <th className="py-3.5 px-6">Transaction</th>
                <th className="py-3.5 px-6">Category</th>
                <th className="py-3.5 px-6">Payment Method</th>
                <th className="py-3.5 px-6">Date</th>
                <th className="py-3.5 px-6">Tags</th>
                <th className="py-3.5 px-6 text-right">Amount</th>
                <th className="py-3.5 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No expense transactions match your filters.
                  </td>
                </tr>
              ) : (
                paginatedExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/10 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleFavoriteExpense(exp.id)}
                          className={`p-0.5 hover:scale-110 transition-transform ${
                            exp.favorite ? 'text-amber-500' : 'text-slate-350 hover:text-slate-400'
                          }`}
                        >
                          <Star className={`w-4 h-4 ${exp.favorite ? 'fill-amber-500' : ''}`} />
                        </button>
                        <span className="font-semibold text-slate-800 dark:text-white">{exp.title}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-550 dark:text-slate-400 text-xs">{exp.paymentMethod}</td>
                    <td className="py-4 px-6 text-slate-500 dark:text-slate-400 text-xs">{exp.date}</td>
                    <td className="py-4 px-6 max-w-[150px]">
                      <div className="flex flex-wrap gap-1">
                        {exp.tags && exp.tags.map(t => (
                          <span key={t} className="text-[9px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-350 px-1.5 py-0.5 rounded">
                            {t}
                          </span>
                        ))}
                        {(!exp.tags || exp.tags.length === 0) && <span className="text-slate-400">—</span>}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right font-bold text-rose-500">
                      {formatCurrency(exp.amount)}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-0.5">
                        <button
                          onClick={() => openEditModal(exp)}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => duplicateExpense(exp.id)}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
                          title="Duplicate"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteExpense(exp.id)}
                          className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Panel */}
        {totalPages > 1 && (
          <div className="px-6 py-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-400">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850 disabled:opacity-40 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850 disabled:opacity-40 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isAddModalOpen || editingExpense !== null}
        onClose={() => { setIsAddModalOpen(false); setEditingExpense(null); }}
        title={editingExpense ? 'Edit Expense Transaction' : 'Record New Expense'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Groceries, Netflix bill..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-800 dark:text-white focus:outline-none focus:border-rose-500 text-sm"
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
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-850 dark:text-white focus:outline-none focus:border-rose-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-850 dark:text-white focus:outline-none focus:border-rose-500 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-800 dark:text-white focus:outline-none focus:border-rose-500 text-sm dark:bg-slate-900"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-800 dark:text-white focus:outline-none focus:border-rose-500 text-sm dark:bg-slate-900"
              >
                {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Tags (Comma separated)
            </label>
            <input
              type="text"
              value={tagsStr}
              onChange={(e) => setTagsStr(e.target.value)}
              placeholder="e.g. holiday, office, shopping"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-850 dark:text-white focus:outline-none focus:border-rose-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add details..."
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-850 dark:text-white focus:outline-none focus:border-rose-500 text-sm resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => { setIsAddModalOpen(false); setEditingExpense(null); }}
              className="px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/10 transition-colors cursor-pointer"
            >
              {editingExpense ? 'Save Changes' : 'Record Transaction'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
