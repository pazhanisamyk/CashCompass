import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAppTheme } from '../context/ThemeContext';
import { Calendar, FileDown, TrendingUp, TrendingDown, Scale, Table } from 'lucide-react';

type ReportType = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

export const ReportsPage: React.FC = () => {
  const { incomes, expenses } = useData();
  const { formatCurrency } = useAppTheme();

  const [reportType, setReportType] = useState<ReportType>('monthly');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1); // first day of month
    return d.toISOString().substring(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().substring(0, 10));

  // Helper: Filter records based on dates
  const getFilteredTransactions = () => {
    const today = new Date();
    let start = new Date(startDate);
    let end = new Date(endDate);

    if (reportType === 'daily') {
      start = new Date(today.setHours(0,0,0,0));
      end = new Date(today.setHours(23,59,59,999));
    } else if (reportType === 'weekly') {
      const dayOfWeek = today.getDay();
      const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Monday
      const monday = new Date(today.setDate(diff));
      monday.setHours(0,0,0,0);
      start = monday;
      end = new Date();
    } else if (reportType === 'monthly') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
      start = firstDay;
      end = lastDay;
    } else if (reportType === 'yearly') {
      start = new Date(today.getFullYear(), 0, 1);
      end = new Date(today.getFullYear(), 11, 31, 23, 59, 59);
    }

    const merged = [
      ...incomes.map(i => ({ ...i, txType: 'income' as const })),
      ...expenses.map(e => ({ ...e, txType: 'expense' as const }))
    ];

    return merged.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate >= start && txDate <= end;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const transactions = getFilteredTransactions();

  const totalInc = transactions.filter(t => t.txType === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExp = transactions.filter(t => t.txType === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const netSavings = totalInc - totalExp;

  // Export to CSV
  const exportCSV = () => {
    const headers = ['Type', 'Title', 'Amount', 'Category', 'Date', 'Notes'];
    const rows = transactions.map(t => [
      t.txType.toUpperCase(),
      `"${t.title.replace(/"/g, '""')}"`,
      t.amount,
      t.category,
      t.date,
      `"${(t.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `CashCompass_finance_report_${reportType}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to JSON
  const exportJSON = () => {
    const jsonStr = JSON.stringify(transactions, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `CashCompass_finance_report_${reportType}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Financial Reports</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Export transaction logs and analyze margins over selected periods.</p>
        </div>
        
        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            disabled={transactions.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 rounded-xl text-xs font-semibold disabled:opacity-40 transition-colors cursor-pointer"
          >
            <FileDown className="w-4 h-4" />
            CSV Export
          </button>
          <button
            onClick={exportJSON}
            disabled={transactions.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 rounded-xl text-xs font-semibold disabled:opacity-40 transition-colors cursor-pointer"
          >
            <FileDown className="w-4 h-4" />
            JSON Export
          </button>
        </div>
      </div>

      {/* Date Filter Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between shadow-xs">
        {/* Filter type dropdown */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Calendar className="w-4.5 h-4.5 text-slate-400 shrink-0" />
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as ReportType)}
            className="w-full md:w-44 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:outline-none focus:border-emerald-500 text-slate-700 dark:text-slate-350 dark:bg-slate-900"
          >
            <option value="daily">Today</option>
            <option value="weekly">This Week</option>
            <option value="monthly">This Month</option>
            <option value="yearly">This Year</option>
            <option value="custom">Custom Date Range</option>
          </select>
        </div>

        {/* Custom Date Picker inputs */}
        {reportType === 'custom' && (
          <div className="flex items-center gap-2 w-full md:w-auto">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full md:w-40 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs focus:outline-none text-slate-700 dark:text-slate-350 dark:bg-slate-900"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full md:w-40 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs focus:outline-none text-slate-700 dark:text-slate-350 dark:bg-slate-900"
            />
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Income sum */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Revenue In</span>
            <p className="text-2xl font-bold text-emerald-500">{formatCurrency(totalInc)}</p>
          </div>
          <div className="bg-emerald-500/10 text-emerald-500 p-3 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Expense sum */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Payments Out</span>
            <p className="text-2xl font-bold text-rose-500">{formatCurrency(totalExp)}</p>
          </div>
          <div className="bg-rose-500/10 text-rose-500 p-3 rounded-xl">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>

        {/* Balance sum */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Net Margin</span>
            <p className={`text-2xl font-bold ${netSavings >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {formatCurrency(netSavings)}
            </p>
          </div>
          <div className={`p-3 rounded-xl ${netSavings >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
            <Scale className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Transactions Table List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
          <Table className="w-4.5 h-4.5 text-slate-400" />
          <h3 className="font-bold text-slate-800 dark:text-white">Transaction Logs ({transactions.length} rows)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold text-xs bg-slate-50/50 dark:bg-slate-850/5">
                <th className="py-3.5 px-6">Transaction</th>
                <th className="py-3.5 px-6">Category</th>
                <th className="py-3.5 px-6">Date</th>
                <th className="py-3.5 px-6">Notes</th>
                <th className="py-3.5 px-6 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No transactions recorded within selected timeframe.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/10 transition-colors">
                    <td className="py-4 px-6 font-semibold text-slate-800 dark:text-white">{tx.title}</td>
                    <td className="py-4 px-6">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        tx.txType === 'income' 
                          ? 'bg-emerald-500/10 text-emerald-500' 
                          : 'bg-rose-500/10 text-rose-500'
                      }`}>
                        {tx.category}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-500 dark:text-slate-400 text-xs">{tx.date}</td>
                    <td className="py-4 px-6 text-slate-550 dark:text-slate-400 text-xs truncate max-w-[250px]">
                      {tx.notes || '—'}
                    </td>
                    <td className={`py-4 px-6 text-right font-bold ${
                      tx.txType === 'income' ? 'text-emerald-500' : 'text-rose-500'
                    }`}>
                      {tx.txType === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
