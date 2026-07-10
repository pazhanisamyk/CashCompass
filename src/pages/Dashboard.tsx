import React from 'react';
import { useData } from '../context/DataContext';
import { useAppTheme } from '../context/ThemeContext';
import {
  TrendingUp,
  TrendingDown,
  Scale,
  Calendar,
  PiggyBank,
  Wallet,
  ArrowRight,
  PlusCircle,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

export const Dashboard: React.FC = () => {
  const { incomes, expenses, budgets, goals, bills, payBill } = useData();
  const { formatCurrency } = useAppTheme();

  // Calculations
  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netBalance = totalIncome - totalExpenses;

  // Savings (Total of all savings goals saved)
  const totalSavings = goals.reduce((sum, g) => sum + g.savedAmount, 0);

  // This Month calculations
  const today = new Date();
  const currentPeriod = today.toISOString().substring(0, 7); // YYYY-MM
  
  const thisMonthIncomes = incomes.filter(i => i.date.startsWith(currentPeriod));
  const thisMonthExpenses = expenses.filter(e => e.date.startsWith(currentPeriod));
  
  const thisMonthIncomeSum = thisMonthIncomes.reduce((sum, i) => sum + i.amount, 0);
  const thisMonthExpenseSum = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Budgets
  const monthlyBudgetObj = budgets.find(b => b.type === 'monthly' && b.period === currentPeriod);
  const monthlyBudgetLimit = monthlyBudgetObj ? monthlyBudgetObj.limitAmount : 0;
  const remainingBudget = monthlyBudgetLimit ? (monthlyBudgetLimit - thisMonthExpenseSum) : 0;
  const budgetPercentage = monthlyBudgetLimit ? Math.min((thisMonthExpenseSum / monthlyBudgetLimit) * 100, 100) : 0;

  // Recent Transactions (merged list of incomes and expenses)
  const mergedTransactions = [
    ...incomes.map(i => ({ ...i, txType: 'income' as const })),
    ...expenses.map(e => ({ ...e, txType: 'expense' as const }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const recentTransactions = mergedTransactions.slice(0, 5);

  // Upcoming bills (unpaid, due soon or overdue)
  const upcomingBills = bills
    .filter(b => !b.paid)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 3);

  // Chart Data preparation (Last 6 Months cash flow)
  const getMonthsRange = () => {
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const periodStr = d.toISOString().substring(0, 7);
      const name = d.toLocaleDateString(undefined, { month: 'short' });
      
      const inc = incomes.filter(inVal => inVal.date.startsWith(periodStr)).reduce((s, inVal) => s + inVal.amount, 0);
      const exp = expenses.filter(exVal => exVal.date.startsWith(periodStr)).reduce((s, exVal) => s + exVal.amount, 0);
      
      data.push({
        name,
        Income: inc,
        Expense: exp,
        Net: inc - exp
      });
    }
    return data;
  };

  const chartData = getMonthsRange();

  return (
    <div className="space-y-6">
      {/* Top Welcome Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Financial Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Real-time analytics of your incomes, budgets, and recurring expenses.
          </p>
        </div>
      </div>

      {/* Grid: Balances & Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Balance */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Net Balance</span>
            <p className={`text-2xl font-bold ${netBalance >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-500'}`}>
              {formatCurrency(netBalance)}
            </p>
          </div>
          <div className={`p-3 rounded-xl ${netBalance >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
            <Scale className="w-6 h-6" />
          </div>
        </div>

        {/* Total Income */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Revenue</span>
            <p className="text-2xl font-bold text-emerald-500">{formatCurrency(totalIncome)}</p>
          </div>
          <div className="bg-emerald-500/10 text-emerald-500 p-3 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Spending</span>
            <p className="text-2xl font-bold text-rose-500">{formatCurrency(totalExpenses)}</p>
          </div>
          <div className="bg-rose-500/10 text-rose-500 p-3 rounded-xl">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>

        {/* Savings Goals Saved */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Savings</span>
            <p className="text-2xl font-bold text-blue-500">{formatCurrency(totalSavings)}</p>
          </div>
          <div className="bg-blue-500/10 text-blue-500 p-3 rounded-xl">
            <PiggyBank className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Grid: Sub Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Monthly Budget Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold text-slate-850 dark:text-white flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-500" />
              Monthly Budget Tracker
            </span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-450">{currentPeriod}</span>
          </div>
          {monthlyBudgetLimit > 0 ? (
            <div className="space-y-3">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Spent: {formatCurrency(thisMonthExpenseSum)}</span>
                <span>Limit: {formatCurrency(monthlyBudgetLimit)}</span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    budgetPercentage > 90
                      ? 'bg-rose-500'
                      : budgetPercentage > 75
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${budgetPercentage}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="font-semibold text-slate-600 dark:text-slate-400">
                  {remainingBudget >= 0 ? 'Remaining Budget:' : 'Over Budget:'}
                </span>
                <span className={`font-bold ${remainingBudget >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {formatCurrency(Math.abs(remainingBudget))}
                </span>
              </div>
              {remainingBudget < 0 && (
                <div className="flex items-center gap-1.5 text-rose-500 text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/20 p-2 rounded-lg mt-1 border border-rose-100 dark:border-rose-900/50">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Warning: You have exceeded your monthly limit!
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4 space-y-2">
              <p className="text-xs text-slate-400">No monthly budget configured for this month.</p>
              <Link
                to="/budgets"
                className="inline-flex text-xs font-semibold text-emerald-500 hover:underline"
              >
                Set Budget Limit
              </Link>
            </div>
          )}
        </div>

        {/* This Month's Income Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold text-slate-850 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Month Revenue
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-extrabold text-emerald-500">{formatCurrency(thisMonthIncomeSum)}</p>
            <p className="text-xs text-slate-400">Total received in {currentPeriod}</p>
          </div>
        </div>

        {/* This Month's Expenses Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold text-slate-850 dark:text-white flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-rose-500" />
              Month Expenses
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-extrabold text-rose-500">{formatCurrency(thisMonthExpenseSum)}</p>
            <p className="text-xs text-slate-400">Total spent in {currentPeriod}</p>
          </div>
        </div>
      </div>

      {/* Main Charts & Widgets Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Cash Flow Area Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl lg:col-span-2 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800 dark:text-white">Cash Flow Overview</h3>
            <span className="text-xs font-semibold text-slate-400">Last 6 Months</span>
          </div>
          <div className="h-72 w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100 dark:stroke-slate-800" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px'
                  }}
                />
                <Area type="monotone" dataKey="Income" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={2.5} />
                <Area type="monotone" dataKey="Expense" stroke="#f43f5e" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Upcoming Bills List */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-500" />
              Upcoming Bills
            </h3>
            <Link to="/bills" className="text-xs font-semibold text-emerald-500 hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {upcomingBills.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500 opacity-60" />
                <p className="text-xs">No pending bills due!</p>
              </div>
            ) : (
              upcomingBills.map(bill => (
                <div key={bill.id} className="p-3 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-850/30 transition-colors">
                  <div className="space-y-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{bill.name}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>Due: {bill.dueDate}</span>
                      {new Date(bill.dueDate) < new Date() && (
                        <span className="text-[10px] bg-rose-500/10 text-rose-500 font-bold px-1.5 py-0.5 rounded">Overdue</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-800 dark:text-white">{formatCurrency(bill.amount)}</span>
                    <button
                      onClick={() => payBill(bill.id)}
                      className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      Pay
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Transactions */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800 dark:text-white">Recent Transactions</h3>
          <div className="flex items-center gap-4">
            <Link
              to="/expenses"
              className="text-xs font-semibold text-emerald-500 hover:underline flex items-center gap-1"
            >
              See all transactions
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold text-xs">
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    No transactions registered yet.
                  </td>
                </tr>
              ) : (
                recentTransactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/10 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-white">{tx.title}</td>
                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        tx.txType === 'income' 
                          ? 'bg-emerald-500/10 text-emerald-500' 
                          : 'bg-rose-500/10 text-rose-500'
                      }`}>
                        {tx.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-550 dark:text-slate-400 text-xs">{tx.date}</td>
                    <td className={`py-3.5 px-4 text-right font-bold ${
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
